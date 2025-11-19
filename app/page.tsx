'use client';

import { useState } from 'react';
import UploadScreen from '@/components/upload-screen';
import TriageScreen from '@/components/triage-screen';
import LoaderScreen from '@/components/loader-screen';
import AnalysisScreen from '@/components/analysis-screen';
import ReassessmentScreen from '@/components/reassessment-screen';

export default function Home() {
  const [stage, setStage] = useState<'upload' | 'triage' | 'loading' | 'analysis' | 'reassessment'>('upload');
  const [billData, setBillData] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<'v1' | 'v2' | null>(null);

  const handleUploadComplete = (data: any) => {
    setBillData(data);
    setStage('triage');
  };

  const handleTriageSelect = (type: 'v1' | 'v2') => {
    setAnalysisType(type);
    setStage('loading');
    // Simulate analysis processing time
    setTimeout(() => {
      setStage('analysis');
    }, 4000);
  };

  const handleAnalysisComplete = () => {
    setStage('reassessment');
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
      {stage === 'loading' && <LoaderScreen />}
      {stage === 'analysis' && (
        <AnalysisScreen
          billData={billData}
          analysisType={analysisType!}
          onComplete={handleAnalysisComplete}
          onBack={() => setStage('triage')}
        />
      )}
      {stage === 'reassessment' && (
        <ReassessmentScreen
          billData={billData}
          onBack={handleReset}
        />
      )}
    </div>
  );
}
