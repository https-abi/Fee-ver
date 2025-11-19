'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const phrases = [
  'Analyzing your medical bill...',
  'Checking for duplicate charges...',
  'Comparing against PhilHealth benchmarks...',
  'Identifying overcharged items...',
  'Processing your bill data...',
  'Cross-referencing facility rates...',
  'Calculating fee discrepancies...',
  'Preparing your analysis report...',
];

export default function LoaderScreen() {
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Analyzing Your Bill
          </h2>
          <p className="text-lg text-slate-600 h-8">
            {phrases[currentPhrase]}
          </p>
        </div>
      </div>
    </div>
  );
}
