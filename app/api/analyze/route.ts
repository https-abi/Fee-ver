import { NextRequest, NextResponse } from 'next/server';

// --- 1. THE HARDCODED "TRUTH" TABLE (Pricing Database) ---
// ESTIMATED MARKET AVERAGES (Based on Philippine Medical Market & Uploaded Receipts)
// Baseline: Average Provincial/Metro Manila Rates
// Upper Limit: Adjusted for Hospital Markup (approx 20-30% buffer)

const PRICING_DATABASE = [
  // --- DIAGNOSTICS (Existing) ---
  {
    keywords: ["urinalysis", "urine", "clinical microscopy"],
    marketPrice: 60,
    maxAcceptable: 150,
    code: "81000"
  },
  {
    keywords: ["cbc", "complete blood count", "hgb", "hct", "hemogram"],
    marketPrice: 250,
    maxAcceptable: 450,
    code: "85025"
  },
  {
    keywords: ["chest pa", "chest x-ray", "cxr", "chest - pa", "chest x ray"],
    marketPrice: 350,
    maxAcceptable: 650,
    code: "71045"
  },
  {
    keywords: ["chest and lat", "chest & lat", "chest/lat", "chest ap/lat"],
    marketPrice: 1200,
    maxAcceptable: 2500,
    code: "71046"
  },
  {
    keywords: ["antigen", "cov-19", "sars-cov-2", "rapid test"],
    marketPrice: 600,
    maxAcceptable: 900,
    code: "87426"
  },
  {
    keywords: ["ct scan", "ct-scan", "computed tomography"],
    marketPrice: 5000,     // Ref: Ormoc Doctors was 5k (Fair price)
    maxAcceptable: 8500,   // Allow variance for contrast vs non-contrast
    code: "74176"
  },

  // --- NEW: HOSPITAL CHARGES (From Ormoc Bill) ---
  {
    keywords: ["clinical laboratory", "lab global", "laboratory medicine"],
    marketPrice: 3500,     // Avg for basic inpatient panel (CBC, lytes, chem)
    maxAcceptable: 5000,   // Ormoc charged 5,712 (Likely flagged as high without itemization)
    code: "LAB-GLOBAL"
  },
  {
    keywords: ["drugs and medicine", "pharmacy", "meds"],
    marketPrice: 2500,     // Highly variable, but setting a baseline for the 1-day admission context
    maxAcceptable: 4000,   // Ormoc charged 3,582 (Acceptable)
    code: "PHARM-GEN"
  },
  {
    keywords: ["misc. med. supplies", "medical supplies", "central supply"],
    marketPrice: 1500,
    maxAcceptable: 2500,   // Ormoc charged 2,271 (Acceptable)
    code: "SUP-GEN"
  },
  {
    keywords: ["room and board", "room rate", "daily room"],
    marketPrice: 1500,     // Private room provincial avg
    maxAcceptable: 2500,   // Ormoc charged 1,705 (Good price)
    code: "RM-PVT"
  },
  {
    keywords: ["ward procedures", "nursing charges"],
    marketPrice: 800,
    maxAcceptable: 1500,   // Ormoc charged 1,774 (Slightly high)
    code: "NURS-PROC"
  },

  // --- NEW: PROFESSIONAL FEES ---
  {
    keywords: ["professional fee", "attending physician", "doctor's fee", "badua", "rivera"],
    marketPrice: 2500,     // Avg daily visit rate for specialists
    maxAcceptable: 4000,   // Ormoc charged 5,000 (Flagged as high for standard daily rounds)
    code: "PF-GEN"
  }
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const user = formData.get('user') as string || 'default-user';

    // Optional: Client can override prompt
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
    // We explicitly ask for a raw structure to ensure the best chance of parsing
    const finalPrompt = clientPrompt || `
      Analyze this medical bill image. 
      Extract ALL billable items into a list.
      Return a valid JSON object with this structure:
      {
        "charges": [
          { "description": "Item Name", "amount": 100.00 }
        ],
        "deductions": []
      }
      Do not include markdown formatting like \`\`\`json. Just return the raw JSON.
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
      // Dify can return output in various keys depending on the workflow version
      rawAnswer = outputs.text || outputs.result || outputs.output || outputs.json || outputs.answer;

      // Fallback: if the output is the entire object
      if (!rawAnswer && typeof outputs === 'object') {
        if (outputs.items || outputs.charges) {
          rawAnswer = outputs;
        } else {
          // Last ditch: find any string value that looks like JSON
          const values = Object.values(outputs);
          rawAnswer = values.find(v => typeof v === 'string') || JSON.stringify(outputs);
        }
      }
    }

    let ocrResult: { charges: any[], deductions: any[] } = { charges: [], deductions: [] };

    // --- ROBUST JSON PARSING ---
    try {
      if (typeof rawAnswer === 'object') {
        // It's already an object, use it directly
        ocrResult = rawAnswer.charges ? rawAnswer : { charges: rawAnswer.items || [], deductions: [] };
      } else {
        const stringAnswer = String(rawAnswer);

        // 1. Strip Markdown code blocks if present (```json ... ```)
        const cleanString = stringAnswer.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '');

        // 2. Attempt to find the first { and last } to isolate JSON
        const jsonMatch = cleanString.match(/\{[\s\S]*\}/);

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
      // If parsing fails, we'll proceed with empty arrays, but the Debug Report will show the raw text
    }

    // --- FORMAT DEBUG REPORT PROPERLY ---
    let formattedDebugText = "";
    try {
      if (typeof rawAnswer === 'object') {
        formattedDebugText = JSON.stringify(rawAnswer, null, 2);
      } else {
        // Try to parse and re-stringify to get nice indentation
        try {
          const cleanString = String(rawAnswer).replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '');
          const json = JSON.parse(cleanString);
          formattedDebugText = JSON.stringify(json, null, 2);
        } catch {
          // If it's just text, return it as is
          formattedDebugText = String(rawAnswer);
        }
      }
    } catch (e) {
      formattedDebugText = "Could not format debug text.";
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
      debugText: formattedDebugText // Now nicely formatted with whitespace
    };

    const charges = Array.isArray(ocrResult.charges) ? ocrResult.charges : [];

    let calculatedTotal = 0;
    const itemCounts = new Map<string, { count: number, total: number }>();

    // --- ANALYSIS LOOP ---

    for (const item of charges) {
      const desc = item.description || "Unknown Item";
      // Sanitize price (remove 'PHP', commas, etc)
      const priceString = String(item.amount || item.price || 0).replace(/[^0-9.-]+/g, "");
      const price = parseFloat(priceString) || 0;

      const cleanDesc = desc.toLowerCase().trim();

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

      // Fuzzy-ish matching: check if the bill description contains any of our keywords
      const dbMatch = PRICING_DATABASE.find(entry =>
        entry.keywords.some(keyword => cleanDesc.includes(keyword))
      );

      if (dbMatch) {
        benchmarkPrice = dbMatch.marketPrice;

        // Logic: If price is higher than maxAcceptable, flag it
        if (price > dbMatch.maxAcceptable) {
          const diff = price - dbMatch.marketPrice;
          const percentage = Math.round(((price - dbMatch.marketPrice) / dbMatch.marketPrice) * 100);

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
      } else {
        // Optional: Flag extremely high prices for unknown items
        if (price > 15000) {
          analysisResult.benchmarkIssues.push({
            item: desc,
            charged: price,
            benchmark: 10000, // Mock benchmark for unknown expensive item
            variance: "High Value (Unverified)",
            facility: "Review Required"
          });
          analysisResult.summary.flaggedAmount += (price - 10000);
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
        // Add total duplicate amount to flagged
        // Note: We flag the whole amount for review, or (val.total - unitPrice) if strict
        analysisResult.summary.flaggedAmount += val.total;
      }
    });

    // 4. CALCULATE SUMMARY
    analysisResult.summary.totalCharges = calculatedTotal;
    analysisResult.summary.patientResponsibility = calculatedTotal;

    if (calculatedTotal > 0) {
      // Cap percentage at 100% visually
      const rawPercent = (analysisResult.summary.flaggedAmount / calculatedTotal) * 100;
      analysisResult.summary.percentageFlagged = `${Math.min(rawPercent, 100).toFixed(1)}%`;
    }

    return NextResponse.json({
      ...analysisResult,
      fileId: fileId,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to process medical bill: ' + error.message },
      { status: 500 }
    );
  }
}