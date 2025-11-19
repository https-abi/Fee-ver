import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const user = formData.get('user') as string || 'default-user';
    // Get the specific prompt sent from the Triage Screen
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
          image: fileInputObject, // Some Dify apps use 'image' key
          file: fileInputObject,  // Others might use 'file'
          query: finalPrompt,
          prompt: finalPrompt
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

    let ocrResult: { items: any[], total: number } = { items: [], total: 0 };

    // Robust JSON Extraction
    if (typeof rawAnswer === 'object') {
      ocrResult = rawAnswer;
    } else {
      try {
        const stringAnswer = String(rawAnswer);
        // Look for JSON pattern between first { and last }
        const jsonMatch = stringAnswer.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          ocrResult = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to simple clean if regex fails (unlikely for valid JSON)
          const cleanJson = stringAnswer.replace(/```json/g, '').replace(/```/g, '').trim();
          ocrResult = JSON.parse(cleanJson);
        }
      } catch (e) {
        console.error('JSON Parse Error', e);
        // Return debug text even if parsing fails so user can see what went wrong
        return NextResponse.json({
          debugText: rawAnswer,
          error: "Failed to parse bill data from AI response."
        }, { status: 500 });
      }
    }

    // 4. TRANSFORM DATA (OCR -> Analysis)
    const analysisResult = {
      duplicates: [] as any[],
      benchmarkIssues: [] as any[],
      summary: {
        totalCharges: ocrResult.total || 0,
        flaggedAmount: 0,
        percentageFlagged: "0%"
      },
      rawItems: ocrResult.items
    };

    // Duplicate Detection Logic
    const itemCounts = new Map<string, { count: number, total: number, originalItem: any }>();
    if (Array.isArray(ocrResult.items)) {
      ocrResult.items.forEach((item: any) => {
        if (!item.description) return;
        const key = item.description.trim().toLowerCase();
        const current = itemCounts.get(key) || { count: 0, total: 0, originalItem: item };
        itemCounts.set(key, {
          count: current.count + 1,
          total: current.total + (item.price || 0),
          originalItem: item
        });
      });
    }

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

    // Benchmark Logic (Mock)
    if (Array.isArray(ocrResult.items)) {
      ocrResult.items.forEach((item: any) => {
        const price = item.price || 0;
        if (price > 10000) {
          analysisResult.benchmarkIssues.push({
            item: item.description,
            charged: price,
            benchmark: price * 0.8,
            variance: "20% above est. benchmark",
            facility: "Medical Facility"
          });
          analysisResult.summary.flaggedAmount += (price - (price * 0.8));
        }
      });
    }

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