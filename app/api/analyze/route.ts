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
        files: [fileInputObject]
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
        if (outputs.items || outputs.total) {
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

    interface OcrItem {
      description: string;
      price?: number;
      total_charge?: number;
      hmo_amount?: number;
      patient_amount?: number;
    }

    let ocrResult: { items: OcrItem[], total?: number } = { items: [] };

    if (typeof rawAnswer === 'object') {
      ocrResult = rawAnswer;
    } else {
      try {
        const stringAnswer = String(rawAnswer);
        const jsonMatch = stringAnswer.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          try {
            ocrResult = JSON.parse(jsonMatch[0]);
          } catch (innerE) {
            const cleanJson = stringAnswer.replace(/```json/g, '').replace(/```/g, '').trim();
            ocrResult = JSON.parse(cleanJson);
          }
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
      rawItems: ocrResult.items
    };

    const items = Array.isArray(ocrResult.items) ? ocrResult.items : [];
    const itemCounts = new Map<string, { count: number, total: number, originalItem: any }>();

    let calculatedTotal = 0;
    let calculatedPatientDue = 0;
    let calculatedHmoCovered = 0;

    items.forEach((item: OcrItem) => {
      const desc = item.description || "Unknown Item";
      const lowerDesc = desc.toLowerCase();

      // --- KEYWORD FILTER (Fix for Double Counting) ---
      // Skip items that are clearly payments, discounts, or totals
      if (
        lowerDesc.includes('payment') ||
        lowerDesc.includes('discount') ||
        lowerDesc.includes('deposit') ||
        lowerDesc.includes('less ') ||
        lowerDesc.includes('adjustment') ||
        lowerDesc.includes('total') ||
        lowerDesc.includes('balance') ||
        lowerDesc.includes('amount due')
      ) {
        return; // Skip this item completely
      }

      const price = item.total_charge || item.price || 0;

      // Fallback calculation logic
      let hmoAmt = item.hmo_amount || 0;
      let patientAmt = item.patient_amount;

      // Smart Balancing
      if (hmoAmt > 0) {
        patientAmt = Math.max(0, price - hmoAmt);
      } else if (patientAmt === price && price > 0) {
        hmoAmt = 0;
      } else if (patientAmt === undefined || patientAmt === null) {
        patientAmt = 0;
      }

      // Sum Totals
      calculatedTotal += price;
      calculatedPatientDue += patientAmt;
      calculatedHmoCovered += hmoAmt;

      // Populate HMO Items List
      analysisResult.hmoItems.push({
        item: desc,
        covered: hmoAmt > 0 ? "Yes" : "No",
        coInsurance: (hmoAmt > 0 && patientAmt > 0) ? "Partial" : (hmoAmt > 0 ? "100%" : "0%"),
        patientResponsibility: patientAmt,
        hmoAmount: hmoAmt,
        totalCharged: price
      });

      // Duplicate Logic
      const key = lowerDesc.trim();
      const current = itemCounts.get(key) || { count: 0, total: 0, originalItem: item };
      itemCounts.set(key, {
        count: current.count + 1,
        total: current.total + price,
        originalItem: item
      });

      // Benchmark Logic (Mock)
      if (price > 10000) {
        analysisResult.benchmarkIssues.push({
          item: desc,
          charged: price,
          benchmark: price * 0.8,
          variance: "20% above estimate",
          facility: "Medical Facility"
        });
        analysisResult.summary.flaggedAmount += (price - (price * 0.8));
      }
    });

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

    analysisResult.summary.totalCharges = calculatedTotal || ocrResult.total || 0;
    analysisResult.summary.patientResponsibility = calculatedPatientDue;
    analysisResult.summary.hmoCovered = calculatedHmoCovered;

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