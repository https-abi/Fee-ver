'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, FileCheck, ChevronDown, AlertCircle, Eye, AlertOctagon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TriageScreenProps {
  // Receives the file from the parent
  uploadData: { file: File; contributeData: boolean };
  // Callbacks to manage global state
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any, type: 'v1' | 'v2') => void;
}

// Renamed from PROMPT_DIRECT/PROMPT_HMO to PROMPT_V1 for consistency with the new flow
const PROMPT_V1 = `
System Prompt for qwen-vl-max (Itemized Error Analysis):
You are an expert medical bill analyzer. 
STEP 1: VISUAL OBSERVATION
Start by providing a "DEBUG REPORT": Describe the document layout, visible headers, hospital name (if any), and the general structure of the charges. State clearly what kind of document this is.

STEP 2: DATA EXTRACTION
Extract the billing information into a valid JSON object.
Format: 
{ 
  "charges": [{"description": "string", "amount": number}], 
  "deductions": [{"description": "string", "amount": number}],
  "total_charges": number,
  "balance_due": number
}
Rules:
1. "charges": List ALL positive costs/services (e.g., Medicines, Labs, Room). Do not omit anything.
2. "deductions": List ALL credits/subtractions, including "Senior Citizen Discount", "PWD Discount", "HMO", "PhilHealth", "Payment", or "Deposit".
3. "total_charges": Sum of all "charges".
4. "balance_due": The final amount the patient needs to pay.
5. Output the valid JSON block at the end of your response.
`;

export default function TriageScreen({ uploadData, onAnalysisStart, onAnalysisComplete }: TriageScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [showHmoDisclaimer, setShowHmoDisclaimer] = useState(false);

  // This function will only run the V1 analysis since the HMO feature is postponed.
  const analyzeBill = async (type: 'v1') => {
    if (!uploadData?.file) {
      setError("File missing. Please restart the process.");
      return;
    }

    setError(null);
    setShowHmoDisclaimer(false);
    onAnalysisStart(); // Trigger Loader Screen

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('user', 'user-' + Date.now());
      formData.append('contributeData', String(uploadData.contributeData));

      // Always use the V1 analysis prompt for now
      formData.append('prompt', PROMPT_V1);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze document.');
      }

      // We pass 'v1' as the analysis type, even if the user originally selected Option 2
      onAnalysisComplete(data, 'v1');

    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "An error occurred during analysis.");
      alert(`Error: ${err.message}`);
    }
  };
  
  // This helper function handles the action inside the disclaimer message
  const handleProceedWithV1 = () => {
    analyzeBill('v1');
  };

  if (showHmoDisclaimer) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                <Card className="p-6 border-blue-400 bg-blue-50 text-center">
                    <AlertOctagon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Feature Scheduled for Next Release</h2>
                    <p className="text-slate-700 mb-6">
                        The full feature is scheduled for our next release. 
                        Our V1 analysis focuses on maximizing <b>transparency and pricing validation.</b>
                    </p>
                    <Button 
                        onClick={handleProceedWithV1}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Click here to return and check your itemized charges (Recommended)
                    </Button>
                    <Button 
                        onClick={() => setShowHmoDisclaimer(false)} 
                        variant="ghost" 
                        className="w-full mt-2 text-slate-600"
                    >
                        Go back to main options
                    </Button>
                </Card>
            </div>
        </div>
      );
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          {/* Updated Welcome Message */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome! What do you need <span className="text-blue-600">Fee-ver</span> to check on your bill?
          </h1>
          <p className="text-slate-600">This helps us focus the analysis.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Option 1: Analyze Price and Itemized Errors */}
          <Card
            onClick={() => analyzeBill('v1')}
            className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all p-6 border-2 flex flex-col justify-between"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-slate-900">Analyze Price and Itemized Errors</h2>
                  <p className="text-xs text-slate-500">Price integrity, duplicate and error check.</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                For cash payers, balance bill payers, or anyone who suspects an overcharge.
              </p>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Select
            </Button>
          </Card>

          {/* Option 2: Check Coverage Discrepancies (HMO/LOA) */}
          <Card 
            onClick={() => setShowHmoDisclaimer(true)}
            className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all p-6 border-2 flex flex-col justify-between opacity-70"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-slate-900">Check Coverage Discrepancies</h2>
                  <p className="text-xs text-slate-500">Advanced analysis for HMO/LOA bills.</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                Compare billed vs. covered amounts to find insurance payment errors.
              </p>
            </div>

            <Button
              disabled
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Scheduled for Next Release
            </Button>
          </Card>
        </div>

        <p className="text-xs text-slate-500 text-center mt-8">
          All analysis is performed securely using Qwen-VL-Max.
        </p>
      </div>
    </div>
  );
}