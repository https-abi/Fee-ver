'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Copy, Share2 } from 'lucide-react';

interface AnalysisScreenProps {
  billData: any;
  analysisType: 'v1' | 'v2';
  onComplete: () => void;
  onBack: () => void;
}

// Mock analysis data
const mockAnalysisV1 = {
  duplicates: [
    { item: 'Consultation Fee', occurrences: 2, totalCharged: 2000 },
    { item: 'Blood Pressure Check', occurrences: 2, totalCharged: 600 },
  ],
  benchmarkIssues: [
    {
      item: 'MRI Scan',
      charged: 15000,
      benchmark: 12000,
      variance: '25% above benchmark',
      facility: 'Sample Medical Center',
    },
  ],
  summary: {
    totalCharges: 45000,
    flaggedAmount: 8000,
    percentageFlagged: '17.8%',
  },
};

const mockAnalysisV2 = {
  ...mockAnalysisV1,
  hmoItems: [
    { item: 'Laboratory Tests', covered: 'Yes', coInsurance: '20%', patientResponsibility: 1200 },
    { item: 'Physician Consultation', covered: 'Yes', coInsurance: '0%', patientResponsibility: 0 },
  ],
  summary: {
    ...mockAnalysisV1.summary,
    totalCharges: 45000,
    flaggedAmount: 8000,
    hmoCovered: 28000,
    patientResponsibility: 17000,
  },
};

export default function AnalysisScreen({
  billData,
  analysisType,
  onComplete,
  onBack,
}: AnalysisScreenProps) {
  const [copied, setCopied] = useState(false);
  const analysis = analysisType === 'v1' ? mockAnalysisV1 : mockAnalysisV2;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
          >
            ← Back to Triage
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analysis Report</h1>
          <p className="text-slate-600">
            {analysisType === 'v1'
              ? 'Direct Payment Analysis'
              : 'HMO Coverage Analysis'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-slate-600 mb-2">Total Charges</p>
            <p className="text-2xl font-bold text-slate-900">₱{analysis.summary.totalCharges.toLocaleString()}</p>
          </Card>
          <Card className="p-6 border-red-200 bg-red-50">
            <p className="text-sm text-slate-600 mb-2">Flagged Amount</p>
            <p className="text-2xl font-bold text-red-600">₱{analysis.summary.flaggedAmount.toLocaleString()}</p>
            <p className="text-xs text-red-600 mt-1">{analysis.summary.percentageFlagged} of total</p>
          </Card>
          {analysisType === 'v2' && (
            <Card className="p-6 border-green-200 bg-green-50">
              <p className="text-sm text-slate-600 mb-2">Your Responsibility</p>
              <p className="text-2xl font-bold text-green-600">
                ₱{(analysis.summary as any).patientResponsibility?.toLocaleString()}
              </p>
            </Card>
          )}
        </div>

        {/* Issues Found */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Issues Found</h2>

          {/* Duplicate Items */}
          {analysis.duplicates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-slate-900">Duplicate Charges</h3>
              </div>
              <div className="space-y-3">
                {analysis.duplicates.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-slate-900">{item.item}</p>
                      <p className="text-sm text-slate-600">Charged {item.occurrences} times</p>
                    </div>
                    <p className="font-semibold text-orange-600">₱{item.totalCharged.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benchmark Issues */}
          {analysis.benchmarkIssues.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-slate-900">Above Benchmark (Fee-ver Check)</h3>
              </div>
              <div className="space-y-3">
                {analysis.benchmarkIssues.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-slate-900 mb-2">{item.item}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Charged</p>
                        <p className="font-semibold text-slate-900">₱{item.charged.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Benchmark</p>
                        <p className="font-semibold text-slate-900">₱{item.benchmark.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Variance</p>
                        <p className="font-semibold text-red-600">{item.variance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* HMO Details (V2 only) */}
        {analysisType === 'v2' && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">HMO Coverage Breakdown</h2>
            <div className="space-y-3">
              {(analysis as any).hmoItems?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{item.item}</p>
                    <p className="text-sm text-slate-600">
                      {item.covered === 'Yes' ? 'Covered' : 'Not covered'} • {item.coInsurance} co-insurance
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">₱{item.patientResponsibility.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Data Privacy Notice */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            This analysis was completed 100% on your device. Your medical bill was never sent to any server.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Report'}
          </Button>
          <Button
            onClick={onComplete}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next: Dispute Kit →
          </Button>
        </div>
      </div>
    </div>
  );
}
