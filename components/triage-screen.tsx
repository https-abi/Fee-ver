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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Cash Payment */}
          <Card
            onClick={() => onSelect('v1')}
            className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all p-6 border-2"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Direct Payment</h2>
              <p className="text-slate-600 text-sm mb-4">
                I paid cash or this is my final balance
              </p>
              <p className="text-xs text-slate-500 mb-4">Quick analysis of your out-of-pocket costs</p>
              <Button className="w-full bg-green-600 hover:bg-green-700 mt-auto">
                Select This
              </Button>
            </div>
          </Card>

          {/* Option 2: HMO with LOA */}
          <Card
            onClick={() => onSelect('v2')}
            className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all p-6 border-2"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">HMO with LOA</h2>
              <p className="text-slate-600 text-sm mb-4">
                I used an HMO and have my Letter of Authorization
              </p>
              <p className="text-xs text-slate-500 mb-4">Advanced analysis with insurance coverage details</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">
                Select This
              </Button>
            </div>
          </Card>
        </div>

        <p className="text-xs text-slate-500 text-center mt-8">
          Both analyses are conducted 100% on your device. Your data never leaves your browser.
        </p>
      </div>
    </div>
  );
}
