'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, FileCheck } from 'lucide-react';

interface TriageScreenProps {
  onSelect: (type: 'v1' | 'v2') => void;
}

export default function TriageScreen({ onSelect }: TriageScreenProps) {
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
                I paid cash or this is my final balance
              </p>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Select This
            </Button>
          </Card>

          {/* Option 2: HMO with LOA */}
          <Card
            onClick={() => onSelect('v2')}
            className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all p-6 border-2 flex flex-col justify-between"
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
                I used an HMO and have my Letter of Authorization
              </p>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
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
