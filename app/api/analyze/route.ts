import { NextRequest, NextResponse } from 'next/server';

// --- 1. THE HARDCODED "TRUTH" TABLE (Pricing Database) ---
// This represents the correct market rates for Angeles City/Pampanga based on your other receipts.
const PRICING_DATABASE = [
  { 
    keywords: ["urinalysis", "urine"], 
    marketPrice: 100, 
    maxAcceptable: 150, 
    code: "LAB-URI" 
  },
  { 
    keywords: ["cbc", "complete blood count", "hgb", "hct"], 
    marketPrice: 250, 
    maxAcceptable: 400, 
    code: "LAB-CBC" 
  },
  { 
    keywords: ["chest pa", "chest x-ray", "cxr", "chest - pa"], 
    marketPrice: 400, 
    maxAcceptable: 600, 
    code: "RAD-CXR" 
  },
  { 
    keywords: ["chest and lat", "chest & lat", "chest/lat"], 
    marketPrice: 800, 
    maxAcceptable: 1200, 
    code: "RAD-CXR-LAT" 
  },
  { 
    keywords: ["antigen", "cov-19"], 
    marketPrice: 800, 
    maxAcceptable: 1200, 
    code: "LAB-COV" 
  },
  { 
    keywords: ["ct scan", "ct-scan"], 
    marketPrice: 4500, 
    maxAcceptable: 6500, 
    code: "RAD-CT" 
  }
];

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

    // Robust extraction logic for Dify response
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

    let ocrResult: { charges: any[], deductions: any[] } = { charges: [], deductions: [] };

    // Parsing the JSON string from Dify
    try {
        if (typeof rawAnswer === 'object') {
             ocrResult = rawAnswer.charges ? rawAnswer : { charges: rawAnswer.items || [], deductions: [] };
        } else {
            const stringAnswer = String(rawAnswer);
            // Attempt to find JSON block
            const jsonMatch = stringAnswer.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                ocrResult = {
                    charges: parsed.charges || parsed.items || [],
                    deductions: parsed.deductions || []
                };
            }
        }
    } catch (e) {
        console.error("JSON Parse Error", e);
        // Fallback or return error - continuing with empty array to prevent crash
    }

    // Format Debug Text nicely
    let formattedDebugText = "";
    try {
        if (typeof rawAnswer === 'object') {
            formattedDebugText = JSON.stringify(rawAnswer, null, 2);
        } else if (typeof rawAnswer === 'string') {
             // Try to parse string as JSON to format it, otherwise leave as string
             try {
                // Check if it contains Markdown code blocks and strip them
                let cleanString = rawAnswer.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                const json = JSON.parse(cleanString);
                formattedDebugText = JSON.stringify(json, null, 2);
             } catch {
                // If not valid JSON, just use the raw string but trim whitespace
                formattedDebugText = rawAnswer.trim();
             }
        } else {
            formattedDebugText = String(rawAnswer);
        }
    } catch (e) {
        formattedDebugText = "Error formatting debug text";
    }


    // 4. TRANSFORM DATA & VALIDATE AGAINST HARDCODED DB
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
        debugText: formattedDebugText
    };

    const charges = Array.isArray(ocrResult.charges) ? ocrResult.charges : [];
    
    let calculatedTotal = 0;
    const itemCounts = new Map<string, { count: number, total: number }>();

    // --- ANALYSIS LOOP ---
    
    for (const item of charges) {
        const desc = item.description || "Unknown Item";
        const price = Number(item.amount || item.price || 0);
        const cleanDesc = desc.toLowerCase();

        calculatedTotal += price;

        // 1. CHECK DUPLICATES
        const countData = itemCounts.get(cleanDesc) || { count: 0, total: 0 };
        itemCounts.set(cleanDesc, { 
            count: countData.count + 1, 
            total: countData.total + price 
        });

        // 2. CHECK PRICE INTEGRITY (Using Hardcoded Table)
        let benchmarkPrice = null;
        let varianceNote = null;

        // Find matching item in our Pricing Database
        const dbMatch = PRICING_DATABASE.find(entry => 
            entry.keywords.some(keyword => cleanDesc.includes(keyword))
        );

        if (dbMatch) {
            benchmarkPrice = dbMatch.marketPrice;

            // Logic: If price is higher than maxAcceptable, flag it
            if (price > dbMatch.maxAcceptable) {
                const diff = price - dbMatch.marketPrice;
                const percentage = Math.round((diff / dbMatch.marketPrice) * 100);
                
                varianceNote = `${percentage}% Overpriced`;
                
                analysisResult.benchmarkIssues.push({
                    item: desc,
                    charged: price,
                    benchmark: dbMatch.marketPrice,
                    variance: varianceNote,
                    facility: `Standard Rate (Ref: ${dbMatch.code})`
                });

                analysisResult.summary.flaggedAmount += diff;
            }
        }

        // Add to the main list for the UI table
        analysisResult.hmoItems.push({
            item: desc,
            type: "charge",
            covered: "No",
            amount: price,
            benchmarkPrice: benchmarkPrice 
        });
    }

    // 3. FINALIZE DUPLICATES
    itemCounts.forEach((val, key) => {
        if (val.count > 1) {
            const itemName = key.toUpperCase(); 
            analysisResult.duplicates.push({
                item: itemName,
                occurrences: val.count,
                totalCharged: val.total,
                facility: "Billing Error"
            });
            analysisResult.summary.flaggedAmount += (val.total / val.count) * (val.count - 1);
        }
    });

    // 4. CALCULATE SUMMARY
    analysisResult.summary.totalCharges = calculatedTotal;
    analysisResult.summary.patientResponsibility = calculatedTotal; 

    if (calculatedTotal > 0) {
        const percent = (analysisResult.summary.flaggedAmount / calculatedTotal) * 100;
        analysisResult.summary.percentageFlagged = `${percent.toFixed(1)}%`;
    }

    return NextResponse.json({
      ...analysisResult,
      fileId: fileId,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to process medical bill' },
      { status: 500 }
    );
  }
}