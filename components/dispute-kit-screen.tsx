'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Mail } from 'lucide-react';

interface DisputeKitScreenProps {
  billData: any;
  onBack: () => void;
}

const generateEmailTemplate = () => {
  return `Subject: Request for Bill Review and Itemization - Polite Inquiry

Dear Hospital Billing Department,

I am writing to respectfully inquire about charges on my recent medical bill dated [DATE]. Upon careful review with the help of a medical bill analysis tool, I have identified several items that require clarification.

The following charges appear to warrant further review:

1. DUPLICATE CHARGES
   - Consultation Fee appears to be charged twice (₱2,000)
   - Blood Pressure Check appears to be charged twice (₱600)
   
   Query: Could you please confirm whether these services were provided twice, or if this represents a billing error?

2. CHARGES ABOVE BENCHMARK RATES
   - MRI Scan: ₱15,000 (benchmark rate in our area: ₱12,000)
   
   Query: Could you provide justification for the variance from standard rates in our region?

TOTAL FLAGGED AMOUNT: ₱8,000 (17.8% of total bill)

I trust this is a simple administrative matter. I am happy to discuss this with your billing department at your earliest convenience.

Please advise:
1. Confirmation of whether duplicate charges should appear on my statement
2. Itemized explanation for charges above benchmark rates
3. A revised bill if corrections are needed

Thank you for your prompt attention to this matter. I look forward to your response.

Respectfully,
[YOUR NAME]
[YOUR CONTACT DETAILS]
[PATIENT ID]`;
};

export default function DisputeKitScreen({ onBack }: DisputeKitScreenProps) {
  const [emailTemplate, setEmailTemplate] = useState(generateEmailTemplate());
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([emailTemplate], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'medical-bill-dispute-template.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dispute Kit</h1>
          <p className="text-slate-600">
            Professionally crafted template to politely question flagged charges
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm font-semibold text-slate-900 mb-1">How it works</p>
            <p className="text-sm text-slate-700">
              We've prepared a professional email template that politely questions the flagged charges without being confrontational.
            </p>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm font-semibold text-slate-900 mb-1">Privacy First</p>
            <p className="text-sm text-slate-700">
              This template is generated on your device. You control what you send and to whom.
            </p>
          </Card>
        </div>

        {/* Email Template */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Email Template</h2>
          <Textarea
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            className="w-full h-64 p-4 font-mono text-sm border border-slate-300 rounded-lg"
          />
          <p className="text-xs text-slate-500 mt-3">
            Feel free to customize this template to match your personal style and add your specific details.
          </p>
        </Card>

        {/* Instructions */}
        <Card className="mb-8 p-6 bg-amber-50 border-amber-200">
          <h3 className="font-semibold text-slate-900 mb-4">How to use this dispute kit:</h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="font-semibold text-amber-600 flex-shrink-0">1.</span>
              <span>Customize the template with your specific details (name, dates, bill amount)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-amber-600 flex-shrink-0">2.</span>
              <span>Find the billing department contact information from your hospital bill</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-amber-600 flex-shrink-0">3.</span>
              <span>Send the email and keep a copy for your records</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-amber-600 flex-shrink-0">4.</span>
              <span>Follow up in 5-7 business days if you don't receive a response</span>
            </li>
          </ol>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied to Clipboard!' : 'Copy Template'}
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as Text
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            Open in Email
          </Button>
        </div>

        {/* Data Privacy Note */}
        <Card className="p-4 bg-slate-100 border-slate-300">
          <p className="text-xs text-slate-700">
            <span className="font-semibold">Optional Data Contribution:</span> Help us build the most accurate benchmark database. After you resolve your billing dispute, consider contributing anonymized data {'{'} item, price, facility {'}'} to our community database. This makes MediScan better for everyone—completely optional and anonymous.
          </p>
        </Card>
      </div>
    </div>
  );
}
