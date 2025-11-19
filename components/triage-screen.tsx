'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, FileCheck, ChevronDown } from 'lucide-react';

interface TriageScreenProps {
  onSelect: (type: 'v1' | 'v2', hmoProvider?: string) => void;
}

export default function TriageScreen({ onSelect }: TriageScreenProps) {
  const [showHmoDropdown, setShowHmoDropdown] = useState(false);
  const [selectedHmo, setSelectedHmo] = useState<string | null>(null);

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

  const handleProceedWithHmo = () => {
    if (selectedHmo) {
      onSelect('v2', selectedHmo);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">How did you pay?</h1>
          <p className="text-slate-600">This helps us analyze your bill correctly</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Option 1: Cash Payment */}
          <Card
            onClick={() => onSelect('v1')}
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
          <Card
            className="p-6 border-2 flex flex-col justify-between"
          >
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
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-slate-100 ${
                          selectedHmo === provider.short ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-slate-900'
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
              onClick={handleProceedWithHmo}
              disabled={!selectedHmo}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Select This
            </Button>
          </Card>
        </div>

        <p className="text-xs text-slate-500 text-center mt-8">
          Both analyses are conducted 100% on your device. Your data never leaves your browser.
        </p>
      </div>
    </div>
  );
}
