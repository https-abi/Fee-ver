'use client';

import { useState } from 'react';
import UploadScreen from '@/components/upload-screen';
import TriageScreen from '@/components/triage-screen';
import AnalysisScreen from '@/components/analysis-screen';
import DisputeKitScreen from '@/components/dispute-kit-screen';

export default function Home() {
  const [stage, setStage] = useState<'upload' | 'triage' | 'analysis' | 'dispute'>('upload');
  const [billData, setBillData] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<'v1' | 'v2' | null>(null);

  const handleUploadComplete = (data: any) => {
    setBillData(data);
    setStage('triage');
  };

  const handleTriageSelect = (type: 'v1' | 'v2') => {
    setAnalysisType(type);
    setStage('analysis');
  };

  const handleAnalysisComplete = () => {
    setStage('dispute');
  };

  const handleReset = () => {
    setStage('upload');
    setBillData(null);
    setAnalysisType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {stage === 'upload' && <UploadScreen onComplete={handleUploadComplete} />}
      {stage === 'triage' && <TriageScreen onSelect={handleTriageSelect} />}
      {stage === 'analysis' && (
        <AnalysisScreen
          billData={billData}
          analysisType={analysisType!}
          onComplete={handleAnalysisComplete}
          onBack={() => setStage('triage')}
        />
      )}
      {stage === 'dispute' && (
        <DisputeKitScreen
          billData={billData}
          onBack={handleReset}
        />
      )}
    </div>
  );
}
