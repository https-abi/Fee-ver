'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, FileCheck, ChevronDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TriageScreenProps {
  // Receives the file from the parent
  uploadData: { file: File; contributeData: boolean };
  // Callbacks to manage global state
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any, type: 'v1' | 'v2') => void;
}

const PROMPT_DIRECT = `
System Prompt for qwen-vl-max (Direct Payment):
You are an expert medical bill analyzer. 
STEP 1: VISUAL OBSERVATION
Start by providing a "DEBUG REPORT": Describe the document layout, visible headers, hospital name (if any), and the general structure of the charges. State clearly what kind of document this is.

STEP 2: DATA EXTRACTION
Extract the billing information into a valid JSON object.
Format: { "items": [{"description": "string", "price": number}], "total": number }.
Rules:
1. Prioritize "Hospital Charges", "Professional Fees", "Medicines".
2. Strip currency symbols.
3. Use total line amount (quantity * unit price).
4. EXCLUDE "Payment", "Discount", "Deposit", "Balance Forward", or "Total" lines from the items list.
5. Output the valid JSON block at the end of your response.
`;

const PROMPT_HMO = `
System Prompt for qwen-vl-max (HMO/Insurance):
You are an expert medical bill analyzer for HMO claims.
STEP 1: VISUAL OBSERVATION
Start by providing a "DEBUG REPORT": Describe the document. Look specifically for columns labeled "PhilHealth", "HMO", "Discount", "Medicare", or "Insurance".

STEP 2: DATA EXTRACTION
Extract the billing information into a valid JSON object with a DETAILED breakdown per item.
Format: 
{ 
  "items": [
    {
      "description": "string", 
      "total_charge": number, 
      "hmo_amount": number, 
      "patient_amount": number 
    }
  ]
}

Rules:
1. "total_charge": The GROSS amount for the item (leftmost charge column).
2. "hmo_amount": The SUM of any columns labeled PhilHealth, HMO, LOA, or Discount.
3. "patient_amount": The "Excess" or "Amount Due". 
4. CALCULATION RULE: If you see "total_charge" and "hmo_amount" but no explicit "patient_amount", CALCULATE it: patient_amount = total_charge - hmo_amount.
5. DO NOT include "Payment", "Discount", "Deposit" or "Total" lines as items. Only list actual services/medicines.
6. Output the valid JSON block at the end of your response.
`;

export default function TriageScreen({ uploadData, onAnalysisStart, onAnalysisComplete }: TriageScreenProps) {
  const [showHmoDropdown, setShowHmoDropdown] = useState(false);
  const [selectedHmo, setSelectedHmo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hmoProviders = [
    { full: 'United Coconut Planters Life Assurance Corporation', short: 'Cocolife' },
    { full: 'Asalus Corporation', short: 'Intellicare' },
    { full: 'Maxicare Healthcare Corporation', short: 'Maxicare' },
    { full: 'MediCard Philippines, Inc.', short: 'MediCard' },
    { full: 'Medicare Plus, Inc.', short: 'Medicare' },
    { full: 'Philippine Health Insurance Corporation', short: 'PhilHealth' },
    { full: 'Value Care Health Systems, Inc.', short: 'Valuecare' }
  ];

  const handleHmoSelect = (provider: typeof hmoProviders[0]) => {
    setSelectedHmo(provider.short);
    setShowHmoDropdown(false);
  };

  const analyzeBill = async (type: 'v1' | 'v2') => {
    if (!uploadData?.file) {
      setError("File missing. Please restart the process.");
      return;
    }

    setError(null);
    onAnalysisStart(); // Trigger Loader Screen

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('user', 'user-' + Date.now());
      formData.append('contributeData', String(uploadData.contributeData));

      // Select prompt based on button pressed
      const prompt = type === 'v1' ? PROMPT_DIRECT : PROMPT_HMO;
      formData.append('prompt', prompt);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze document.');
      }

      // Add HMO provider info if v2
      const finalResult = {
        ...data,
        hmoProvider: type === 'v2' ? selectedHmo : undefined
      };

      onAnalysisComplete(finalResult, type);

    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "An error occurred during analysis.");
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">How did you pay?</h1>
          <p className="text-slate-600">This helps us analyze your bill correctly</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Option 1: Cash Payment */}
          <Card
            onClick={() => analyzeBill('v1')}
            className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all p-6 border-2 flex flex-col justify-between"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-slate-900">Direct Payment</h2>
                  <p className="text-xs text-slate-500">Quick analysis of your out-of-pocket costs</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                I have settled the bill directly with the provider, without the use of an HMO.
              </p>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Select This
            </Button>
          </Card>

          {/* Option 2: HMO with LOA */}
          <Card className="p-6 border-2 flex flex-col justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-slate-900">HMO with LOA</h2>
                  <p className="text-xs text-slate-500">Advanced analysis with insurance coverage details</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                I used a Health Mandated Organization (HMO) and have my Letter of Authorization (LOA)
              </p>

              <div className="relative mb-6">
                <button
                  onClick={() => setShowHmoDropdown(!showHmoDropdown)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg flex items-center justify-between hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <span className={selectedHmo ? 'text-slate-900' : 'text-slate-500'}>
                    {selectedHmo || 'Select your HMO provider'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showHmoDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showHmoDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                    {hmoProviders.map((provider) => (
                      <button
                        key={provider.short}
                        onClick={() => handleHmoSelect(provider)}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-slate-100 ${selectedHmo === provider.short ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-slate-900'
                          }`}
                      >
                        <p className="font-medium">{provider.full}</p>
                        <p className="text-xs text-slate-500">({provider.short})</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => analyzeBill('v2')}
              disabled={!selectedHmo}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Select This
            </Button>
          </Card>
        </div>

        <p className="text-xs text-slate-500 text-center mt-8">
          Both analyses are conducted 100% on your device (via secure API).
        </p>
      </div>
    </div>
  );
}