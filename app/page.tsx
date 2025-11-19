"use client";

import { useState } from "react";
import UploadScreen from "@/components/upload-screen";
import TriageScreen from "@/components/triage-screen";
import LoaderScreen from "@/components/loader-screen";
import AnalysisScreen from "@/components/analysis-screen";
import ReassessmentScreen from "@/components/reassessment-screen";

export default function Home() {
  const [stage, setStage] = useState<
    "upload" | "triage" | "loading" | "analysis" | "reassessment"
  >("upload");

  // Store the file data here so it can be passed to Triage
  const [uploadData, setUploadData] = useState<{ file: File; contributeData: boolean } | null>(null);

  const [billData, setBillData] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<"v1" | "v2" | null>(null);

  // Called when user finishes the Upload screen (clicked Continue)
  const handleUploadComplete = (data: { file: File; contributeData: boolean }) => {
    setUploadData(data);
    setStage("triage");
  };

  // Called by Triage when API request starts
  const handleAnalysisStart = () => {
    setStage("loading");
  };

  // Called by Triage when API returns data
  const handleAnalysisComplete = (result: any, type: 'v1' | 'v2') => {
    setBillData(result);
    setAnalysisType(type);
    setStage("analysis");
  };

  const handleAnalysisDone = () => {
    setStage("reassessment");
  };

  const handleReset = () => {
    setStage("upload");
    setBillData(null);
    setAnalysisType(null);
    setUploadData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {stage === "upload" && <UploadScreen onComplete={handleUploadComplete} />}

      {stage === "triage" && uploadData && (
        <TriageScreen
          uploadData={uploadData}
          onAnalysisStart={handleAnalysisStart}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

      {stage === "loading" && <LoaderScreen />}

      {stage === "analysis" && billData && (
        <AnalysisScreen
          billData={billData}
          analysisType={analysisType!}
          onComplete={handleAnalysisDone}
          onBack={() => setStage("triage")}
          onReturnHome={handleReset}
        />
      )}

      {stage === "reassessment" && (
        <ReassessmentScreen billData={billData} onBack={handleReset} />
      )}
    </div>
  );
}