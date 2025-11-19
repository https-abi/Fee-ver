import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const user = formData.get('user') as string || 'default-user';
    const clientPrompt = formData.get('prompt') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.DIFY_API_KEY;
    const baseUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';

    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: DIFY_API_KEY is missing.' }, { status: 500 });
    }

    // 1. Upload file to Dify
    const arrayBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([arrayBuffer], { type: file.type });

    const uploadFormData = new FormData();
    uploadFormData.append('file', fileBlob, file.name);
    uploadFormData.append('user', user);

    const uploadRes = await fetch(`${baseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('Dify Upload Error:', errorText);
      throw new Error(`Dify Upload Failed: ${uploadRes.statusText}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;

    // 2. Run Dify Workflow
    // Use the prompt from the client, or fallback to a default if missing
    const finalPrompt = clientPrompt || `
      Analyze this medical bill. Return JSON with "items" (array of {description, price}) and "total".
    `;

    const fileInputObject = {
      type: "image",
      transfer_method: "local_file",
      upload_file_id: fileId
    };

    const workflowRes = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          image: fileInputObject,
          query: finalPrompt,
        },
        response_mode: "blocking",
        user: user,
        files: [ fileInputObject ]
      }),
    });

    const workflowData = await workflowRes.json();

    if (!workflowRes.ok) {
      console.error('Dify Workflow Error Response:', workflowData);
      throw new Error(workflowData.message || `Workflow Failed: ${workflowRes.statusText}`);
    }

    // 3. Parse Workflow Output
    const outputs = workflowData.data.outputs;
    
    let rawAnswer: any = null;
    if (outputs) {
        rawAnswer = outputs.text || outputs.result || outputs.output || outputs.json || outputs.answer;
        
        if (!rawAnswer && typeof outputs === 'object') {
             if (outputs.items || outputs.charges) {
                 rawAnswer = outputs;
             } else {
                 const values = Object.values(outputs);
                 rawAnswer = values.find(v => typeof v === 'string') || JSON.stringify(outputs);
             }
        }
    }

    if (!rawAnswer) {
        throw new Error("Workflow finished but returned no usable output.");
    }

    interface ChargeItem {
        description: string;
        amount: number;
    }
    interface DeductionItem {
        description: string;
        amount: number;
    }

    interface OcrResult {
        charges: ChargeItem[];
        deductions: DeductionItem[];
    }

    let ocrResult: OcrResult = { charges: [], deductions: [] };
    
    // Robust Parsing
    if (typeof rawAnswer === 'object') {
        if (rawAnswer.items && !rawAnswer.charges) {
             // Legacy format fallback
             ocrResult = {
                 charges: rawAnswer.items.map((i: any) => ({ description: i.description, amount: i.price || 0 })),
                 deductions: []
             };
        } else {
             ocrResult = rawAnswer;
        }
    } else {
        try {
            const stringAnswer = String(rawAnswer);
            const jsonMatch = stringAnswer.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                ocrResult = {
                    charges: parsed.charges || parsed.items || [],
                    deductions: parsed.deductions || []
                };
            } else {
                 const cleanJson = stringAnswer.replace(/```json/g, '').replace(/```/g, '').trim();
                 ocrResult = JSON.parse(cleanJson);
            }
        } catch (e) {
            console.error('JSON Parse Error', e);
             return NextResponse.json({ 
                debugText: rawAnswer, 
                error: "Failed to parse bill data from AI response." 
             }, { status: 500 });
        }
    }

    // 4. TRANSFORM DATA
    const analysisResult = {
        duplicates: [] as any[],
        benchmarkIssues: [] as any[],
        hmoItems: [] as any[],
        summary: {
            totalCharges: 0,
            flaggedAmount: 0,
            percentageFlagged: "0%",
            patientResponsibility: 0,
            hmoCovered: 0
        },
        rawItems: ocrResult.charges || []
    };

    const charges = Array.isArray(ocrResult.charges) ? ocrResult.charges : [];
    const deductions = Array.isArray(ocrResult.deductions) ? ocrResult.deductions : [];
    
    let calculatedTotal = 0;
    let calculatedDeductions = 0;

    // --- PROCESS CHARGES ---
    const itemCounts = new Map<string, { count: number, total: number, originalItem: any }>();
    
    charges.forEach((item) => {
        const desc = item.description || "Unknown Item";
        const price = item.amount || 0;

        calculatedTotal += price;

        let benchmarkPrice = null;

        // Benchmark Logic (Mock for demo)
        // Flag items > 10k as potentially overpriced
        if (price > 10000) {
            benchmarkPrice = price * 0.8; // Mock benchmark at 80% of price
            analysisResult.benchmarkIssues.push({
                item: desc,
                charged: price,
                benchmark: benchmarkPrice,
                variance: "20% above estimate",
                facility: "Medical Facility"
            });
            analysisResult.summary.flaggedAmount += (price - benchmarkPrice); 
        }

        // Add to HMO List as "Charge" (Default state: Not Covered until paid)
        analysisResult.hmoItems.push({
            item: desc,
            type: "charge",
            covered: "No", // Charges are liabilities
            amount: price,
            benchmarkPrice: benchmarkPrice
        });

        // Duplicate Logic
        const key = desc.trim().toLowerCase();
        const current = itemCounts.get(key) || { count: 0, total: 0, originalItem: item };
        itemCounts.set(key, {
            count: current.count + 1,
            total: current.total + price,
            originalItem: item
        });
    });

    // --- PROCESS DEDUCTIONS ---
    deductions.forEach(d => {
        const amount = d.amount || 0;
        calculatedDeductions += amount;

        // Add to HMO List as "Deduction" (Status: Covered)
        analysisResult.hmoItems.push({
            item: d.description,
            type: "deduction",
            covered: "Yes", // Deductions are coverage
            amount: amount,
            benchmarkPrice: null
        });
    });

    // Populate Duplicates Array
    itemCounts.forEach((val, key) => {
        if (val.count > 1) {
            analysisResult.duplicates.push({
                item: val.originalItem.description,
                occurrences: val.count,
                totalCharged: val.total,
                facility: "Medical Facility"
            });
            analysisResult.summary.flaggedAmount += val.total;
        }
    });

    // --- FINAL CALCULATIONS (Reset Logic) ---
    analysisResult.summary.totalCharges = calculatedTotal;
    analysisResult.summary.hmoCovered = calculatedDeductions;
    
    // Basic Accounting Equation: Charges - Payments = Balance
    const finalBalance = Math.max(0, calculatedTotal - calculatedDeductions);
    analysisResult.summary.patientResponsibility = finalBalance;
    
    if (analysisResult.summary.totalCharges > 0) {
        const percentage = (analysisResult.summary.flaggedAmount / analysisResult.summary.totalCharges) * 100;
        analysisResult.summary.percentageFlagged = `${percentage.toFixed(1)}%`;
    }

    return NextResponse.json({
      ...analysisResult,
      fileId: fileId,
      fileName: file.name,
      debugText: typeof rawAnswer === 'string' ? rawAnswer : JSON.stringify(rawAnswer, null, 2)
    });

  } catch (error: any) {
    console.error('Full Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process medical bill' },
      { status: 500 }
    );
  }
}