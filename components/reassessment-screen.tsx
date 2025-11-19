"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Mail } from "lucide-react";

interface DisputeKitScreenProps {
  billData: any;
  onBack: () => void;
}

const formatAmount = (amount: number) => `₱${(amount || 0).toLocaleString()}`;

const generateEmailTemplate = (data: any) => {
  const issues = [];
  let totalFlaggedAmount = data.summary.flaggedAmount || 0;

  // --- 1. DUPLICATE CHARGES ---
  if (data.duplicates && data.duplicates.length > 0) {
    issues.push("1. DUPLICATE CHARGES");
    data.duplicates.forEach((item: any) => {
      issues.push(`- ${item.item} appears to be charged ${item.occurrences} times for a total of ${formatAmount(item.totalCharged)}.`);
    });
    issues.push(`\nQuery: Could you please confirm if multiple charges for these items are correct, or if this represents a billing system error?`);
  }

  // --- 2. PRICE INTEGRITY ISSUES ---
  if (data.benchmarkIssues && data.benchmarkIssues.length > 0) {
    if (issues.length > 0) issues.push("\n"); // Add spacing if duplicates exist
    issues.push("2. PRICE INTEGRITY AUDIT (Charges Above Fair Market Value)");
    data.benchmarkIssues.forEach((item: any) => {
      issues.push(`- ${item.item}: Charged ${formatAmount(item.charged)} (Fair Market Value Est.: ${formatAmount(item.benchmark)}) - Variance: ${item.variance}.`);
    });
    issues.push(`\nQuery: Could you provide justification for this price variance compared to regional fair market estimates?`);
  }

  if (issues.length === 0) {
    issues.push("No specific anomalies were found in the uploaded analysis data to automatically generate an itemized dispute list.");
    issues.push("Please review the bill manually or ensure the analysis ran correctly.");
    totalFlaggedAmount = data.summary.totalCharges || 0;
  }

  const issueList = issues.join('\n');
  const totalCharges = data.summary.totalCharges || 0;
  const balanceDue = data.summary.patientResponsibility || 0;


  return `Subject: Request for Bill Review and Itemization - Account [PATIENT ID HERE]

Dear Hospital Billing Department,

I am writing to respectfully inquire about charges on my recent medical bill dated [DATE OF SERVICE END]. Upon careful review using Fee-ver, a medical bill analysis tool, I have identified potential discrepancies requiring clarification.

The following charges appear to warrant further review:

${issueList}

---
ANALYSIS SUMMARY:
Gross Total Charges on Bill: ${formatAmount(totalCharges)}
Total Flagged Amount: ${formatAmount(totalFlaggedAmount)}
Patient Responsibility (Amount Due): ${formatAmount(balanceDue)}

I trust this is a simple administrative matter and appreciate your prompt attention.

Please advise regarding the queries above and provide:
1. Itemized documentation supporting the full charges.
2. A revised bill if corrections based on duplicates or price variances are needed.

Thank you for your cooperation. I look forward to your response within 5-7 business days.

Respectfully,
[YOUR FULL NAME]
[YOUR CONTACT DETAILS: Phone / Email]
[PATIENT ID: PID 271387 - Found on bill]
[ACCOUNT/BILL NUMBER: (Add if different from Patient ID)]`;
};

export default function ReassessmentScreen({ billData, onBack }: DisputeKitScreenProps) {
  const [emailTemplate, setEmailTemplate] = useState(generateEmailTemplate(billData));
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // navigator.clipboard.writeText is generally more reliable in modern browsers
    navigator.clipboard.writeText(emailTemplate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      // Fallback for older browsers, though execCommand is restricted in some modern contexts
      const textarea = document.createElement('textarea');
      textarea.value = emailTemplate;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    // Use the name of the file if available, otherwise default
    const fileName = billData?.fileName ? `dispute-kit-${billData.fileName.replace(/\.[^/.]+$/, "")}.txt` : "medical-bill-dispute-template.txt";
    const file = new Blob([emailTemplate], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent("Request for Bill Review and Itemization - Account [PATIENT ID HERE]");
    const body = encodeURIComponent(emailTemplate);
    // Use a placeholder email address
    window.location.href = `mailto:billing@hospital.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center justify-center h-[30px] w-[30px] rounded-full bg-slate-300 hover:bg-slate-200 font-medium text-sm mb-4"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-slate-800"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Prepare for Reassessment
          </h1>
          <p className="text-slate-600">
            Automatically draft a professional email based on the issues found.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Polite & Professional
            </p>
            <p className="text-sm text-slate-700">
              The template uses formal language and focuses on questions, not accusations, to ensure quick resolution.
            </p>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Data Included
            </p>
            <p className="text-sm text-slate-700">
              We've inserted all identified <b>duplicate charges</b> and <b>price integrity issues</b> directly into the body.
            </p>
          </Card>
        </div>

        {/* Email Template */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Email Template
          </h2>
          <Textarea
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm border border-slate-300 rounded-lg"
          />
          <p className="text-xs text-slate-500 mt-3">
            <b>Action Required:</b> Please customize the bracketed placeholders (`[YOUR FULL NAME]`, `[DATE]`, etc.) before sending.
          </p>
        </Card>

        {/* Instructions */}
        <Card className="mb-8 p-6 bg-amber-50 border-amber-200">
          <h3 className="font-semibold text-slate-900 mb-4">
            How to use this dispute kit:
          </h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="font-semibold text-amber-600 flex-shrink-0">
                1.
              </span>
              <span>
                Customize the template with your specific details (name, dates, patient ID)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-amber-600 flex-shrink-0">
                2.
              </span>
              <span>
                Find the hospital's billing email address on your bill or website
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-amber-600 flex-shrink-0">
                3.
              </span>
              <span>Copy or Open in Email, send the request, and save a record of the sent email.</span>
            </li>
          </ol>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied to Clipboard!" : "Copy Template"}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download as Text
          </Button>
          <Button onClick={handleOpenEmail} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            <Mail className="w-4 h-4 mr-2" />
            Open in Email
          </Button>
        </div>
      </div>
    </div>
  );
}