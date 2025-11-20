import { NextRequest, NextResponse } from "next/server";
import { getBenchmarkAnalysis } from "@/lib/medical-rates";

export async function POST(req: NextRequest) {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Starting Medical Bill Analysis");
  console.log("=".repeat(60));

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const user = (formData.get("user") as string) || "default-user";
    const clientPrompt = formData.get("prompt") as string;

    console.log(`\n📋 Request Details:`);
    console.log(`   - File: ${file?.name || "No file"}`);
    console.log(`   - User: ${user}`);
    console.log(`   - Has custom prompt: ${!!clientPrompt}`);

    if (!file) {
      console.error("❌ No file provided in request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.DIFY_API_KEY;
    const baseUrl = process.env.DIFY_API_URL || "https://api.dify.ai/v1";

    console.log(`\n🔧 Configuration:`);
    console.log(`   - Dify URL: ${baseUrl}`);
    console.log(`   - API Key configured: ${!!apiKey}`);

    if (!apiKey) {
      console.error("❌ DIFY_API_KEY is missing from environment");
      return NextResponse.json(
        { error: "Server configuration error: DIFY_API_KEY is missing." },
        { status: 500 }
      );
    }

    // 1. Upload file to Dify
    console.log(`\n📤 Step 1: Uploading file to Dify...`);
    const arrayBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([arrayBuffer], { type: file.type });

    const uploadFormData = new FormData();
    uploadFormData.append("file", fileBlob, file.name);
    uploadFormData.append("user", user);

    const uploadRes = await fetch(`${baseUrl}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("❌ Dify Upload Error:", errorText);
      throw new Error(`Dify Upload Failed: ${uploadRes.statusText}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;
    console.log(`✅ File uploaded successfully - ID: ${fileId}`);

    // 2. Run Dify Workflow
    console.log(`\n🤖 Step 2: Running Dify OCR Workflow...`);
    // Use the prompt from the client, or fallback to a default if missing
    const finalPrompt =
      clientPrompt ||
      `
      Analyze this medical bill. Return JSON with "items" (array of {description, price}) and "total".
    `;

    const fileInputObject = {
      type: "image",
      transfer_method: "local_file",
      upload_file_id: fileId,
    };

    const workflowRes = await fetch(`${baseUrl}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          image: fileInputObject,
          query: finalPrompt,
        },
        response_mode: "blocking",
        user: user,
        files: [fileInputObject],
      }),
    });

    const workflowData = await workflowRes.json();

    if (!workflowRes.ok) {
      console.error("❌ Dify Workflow Error Response:", workflowData);
      throw new Error(
        workflowData.message || `Workflow Failed: ${workflowRes.statusText}`
      );
    }

    console.log(`✅ Workflow completed successfully`);

    // 3. Parse Workflow Output
    console.log(`\n🔍 Step 3: Parsing workflow output...`);
    const outputs = workflowData.data.outputs;

    let rawAnswer: any = null;
    if (outputs) {
      rawAnswer =
        outputs.text ||
        outputs.result ||
        outputs.output ||
        outputs.json ||
        outputs.answer;

      if (!rawAnswer && typeof outputs === "object") {
        if (outputs.items || outputs.charges) {
          rawAnswer = outputs;
        } else {
          const values = Object.values(outputs);
          rawAnswer =
            values.find((v) => typeof v === "string") ||
            JSON.stringify(outputs);
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
    console.log(`   Parsing OCR result...`);
    if (typeof rawAnswer === "object") {
      if (rawAnswer.items && !rawAnswer.charges) {
        // Legacy format fallback
        console.log(`   📝 Using legacy format (items array)`);
        ocrResult = {
          charges: rawAnswer.items.map((i: any) => ({
            description: i.description,
            amount: i.price || 0,
          })),
          deductions: [],
        };
      } else {
        console.log(`   📝 Using standard format (charges/deductions)`);
        ocrResult = rawAnswer;
      }
    } else {
      console.log(`   📝 Parsing from string format`);
      try {
        const stringAnswer = String(rawAnswer);
        const jsonMatch = stringAnswer.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          ocrResult = {
            charges: parsed.charges || parsed.items || [],
            deductions: parsed.deductions || [],
          };
        } else {
          const cleanJson = stringAnswer
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          ocrResult = JSON.parse(cleanJson);
        }
      } catch (e) {
        console.error("❌ JSON Parse Error", e);
        return NextResponse.json(
          {
            debugText: rawAnswer,
            error: "Failed to parse bill data from AI response.",
          },
          { status: 500 }
        );
      }
    }

    console.log(`✅ OCR Parsing complete:`);
    console.log(`   - Charges found: ${ocrResult.charges?.length || 0}`);
    console.log(`   - Deductions found: ${ocrResult.deductions?.length || 0}`);

    // 4. TRANSFORM DATA
    console.log(`\n🔄 Step 4: Transforming data and running analysis...`);
    const analysisResult = {
      duplicates: [] as any[],
      benchmarkIssues: [] as any[],
      hmoItems: [] as any[],
      summary: {
        totalCharges: 0,
        flaggedAmount: 0,
        percentageFlagged: "0%",
        patientResponsibility: 0,
        hmoCovered: 0,
      },
      rawItems: ocrResult.charges || [],
    };

    const charges = Array.isArray(ocrResult.charges) ? ocrResult.charges : [];
    const deductions = Array.isArray(ocrResult.deductions)
      ? ocrResult.deductions
      : [];

    let calculatedTotal = 0;
    let calculatedDeductions = 0;

    // --- PROCESS CHARGES ---
    const itemCounts = new Map<
      string,
      { count: number; total: number; originalItem: any }
    >();

    // Process charges with database benchmark lookup
    console.log(
      `\n📊 Starting benchmark analysis for ${charges.length} charges...`
    );

    for (const item of charges) {
      const desc = item.description || "Unknown Item";
      const price = item.amount || 0;

      calculatedTotal += price;

      let benchmarkPrice = null;

      // Get benchmark analysis from database
      console.log(
        `\n🔍 Analyzing: "${desc}" (Charged: ₱${price.toLocaleString()})`
      );

      try {
        const benchmarkAnalysis = await getBenchmarkAnalysis(desc, price);

        if (benchmarkAnalysis.hasBenchmark) {
          console.log(`  ✅ Database match found!`);
          console.log(
            `     - Benchmark: ₱${benchmarkAnalysis.benchmarkPrice?.toLocaleString()}`
          );
          console.log(
            `     - Range: ₱${benchmarkAnalysis.minPrice?.toLocaleString()} - ₱${benchmarkAnalysis.maxPrice?.toLocaleString()}`
          );
          console.log(
            `     - Confidence: ${(
              (benchmarkAnalysis.confidence || 0) * 100
            ).toFixed(1)}%`
          );
          console.log(`     - Variance: ${benchmarkAnalysis.variance}`);

          if (benchmarkAnalysis.isOverpriced) {
            benchmarkPrice = benchmarkAnalysis.benchmarkPrice;
            console.log(`     ⚠️  FLAGGED AS OVERPRICED`);

            analysisResult.benchmarkIssues.push({
              item: desc,
              charged: price,
              benchmark: benchmarkPrice,
              variance: benchmarkAnalysis.variance,
              facility: "Medical Facility",
              confidence: benchmarkAnalysis.confidence,
              priceRange: {
                min: benchmarkAnalysis.minPrice,
                max: benchmarkAnalysis.maxPrice,
              },
            });

            // Add the overcharged amount to flagged amount
            const overchargedAmount = Math.max(
              0,
              price - (benchmarkAnalysis.maxPrice || benchmarkPrice || 0)
            );
            analysisResult.summary.flaggedAmount += overchargedAmount;
            console.log(
              `     - Overcharged amount: ₱${overchargedAmount.toLocaleString()}`
            );
          } else {
            console.log(`     ✓ Price within acceptable range`);
          }
        } else {
          console.log(`  ⚠️  No database match found for "${desc}"`);
        }
      } catch (error) {
        console.error(`  ❌ Error getting benchmark for "${desc}":`, error);
        // Fallback to original logic for items > 10k if database lookup fails
        if (price > 10000) {
          benchmarkPrice = price * 0.8;
          console.log(`  🔄 Using fallback logic (80% of charged amount)`);
          analysisResult.benchmarkIssues.push({
            item: desc,
            charged: price,
            benchmark: benchmarkPrice,
            variance: "20% above estimate (fallback)",
            facility: "Medical Facility",
          });
          analysisResult.summary.flaggedAmount += price - benchmarkPrice;
        }
      }

      // Add to HMO List as "Charge" (Default state: Not Covered until paid)
      analysisResult.hmoItems.push({
        item: desc,
        type: "charge",
        covered: "No", // Charges are liabilities
        amount: price,
        benchmarkPrice: benchmarkPrice,
      });

      // Duplicate Logic
      const key = desc.trim().toLowerCase();
      const current = itemCounts.get(key) || {
        count: 0,
        total: 0,
        originalItem: item,
      };
      itemCounts.set(key, {
        count: current.count + 1,
        total: current.total + price,
        originalItem: item,
      });
    }

    // --- PROCESS DEDUCTIONS ---
    console.log(`\n💰 Processing ${deductions.length} deductions...`);
    deductions.forEach((d) => {
      const amount = d.amount || 0;
      calculatedDeductions += amount;
      console.log(`   - ${d.description}: ₱${amount.toLocaleString()}`);

      // Add to HMO List as "Deduction" (Status: Covered)
      analysisResult.hmoItems.push({
        item: d.description,
        type: "deduction",
        covered: "Yes", // Deductions are coverage
        amount: amount,
        benchmarkPrice: null,
      });
    });

    // Populate Duplicates Array
    console.log(`\n🔍 Checking for duplicate charges...`);
    let duplicateCount = 0;
    itemCounts.forEach((val, key) => {
      if (val.count > 1) {
        duplicateCount++;
        console.log(
          `   ⚠️  Duplicate found: "${val.originalItem.description}"`
        );
        console.log(`      - Occurrences: ${val.count}`);
        console.log(`      - Total charged: ₱${val.total.toLocaleString()}`);

        analysisResult.duplicates.push({
          item: val.originalItem.description,
          occurrences: val.count,
          totalCharged: val.total,
          facility: "Medical Facility",
        });
        analysisResult.summary.flaggedAmount += val.total;
      }
    });

    if (duplicateCount === 0) {
      console.log(`   ✅ No duplicates found`);
    } else {
      console.log(`   📊 Total duplicates: ${duplicateCount}`);
    }

    // --- FINAL CALCULATIONS (Reset Logic) ---
    console.log(`\n📊 Final Calculations:`);
    analysisResult.summary.totalCharges = calculatedTotal;
    analysisResult.summary.hmoCovered = calculatedDeductions;

    // Basic Accounting Equation: Charges - Payments = Balance
    const finalBalance = Math.max(0, calculatedTotal - calculatedDeductions);
    analysisResult.summary.patientResponsibility = finalBalance;

    if (analysisResult.summary.totalCharges > 0) {
      const percentage =
        (analysisResult.summary.flaggedAmount /
          analysisResult.summary.totalCharges) *
        100;
      analysisResult.summary.percentageFlagged = `${percentage.toFixed(1)}%`;
    }

    console.log(`   - Total Charges: ₱${calculatedTotal.toLocaleString()}`);
    console.log(`   - HMO Covered: ₱${calculatedDeductions.toLocaleString()}`);
    console.log(
      `   - Patient Responsibility: ₱${finalBalance.toLocaleString()}`
    );
    console.log(
      `   - Flagged Amount: ₱${analysisResult.summary.flaggedAmount.toLocaleString()}`
    );
    console.log(
      `   - Percentage Flagged: ${analysisResult.summary.percentageFlagged}`
    );

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ Analysis Complete!`);
    console.log(`${"=".repeat(60)}\n`);

    return NextResponse.json({
      ...analysisResult,
      fileId: fileId,
      fileName: file.name,
      debugText:
        typeof rawAnswer === "string"
          ? rawAnswer
          : JSON.stringify(rawAnswer, null, 2),
    });
  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ANALYSIS ERROR");
    console.error("=".repeat(60));
    console.error("Error details:", error);
    console.error("Stack trace:", error.stack);
    console.error("=".repeat(60) + "\n");

    return NextResponse.json(
      { error: error.message || "Failed to process medical bill" },
      { status: 500 }
    );
  }
}
