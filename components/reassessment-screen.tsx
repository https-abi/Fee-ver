"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Mail, Loader2 } from "lucide-react";

interface DisputeKitScreenProps {
  billData: any;
  onBack: () => void;
}

const formatAmount = (amount: number) => `₱${(amount || 0).toLocaleString()}`;

// System prompt tailored for Qwen/Gemini-level professional text generation
// NOTE: This full prompt string will be sent to the backend route /api/generate-email
const GENERATION_SYSTEM_PROMPT = `
You are an expert financial mediator and professional correspondence writer. Your task is to generate a formal, polite, non-confrontational email template for a patient requesting a review and reassessment of their medical bill.

The patient is providing the following analysis data in JSON format, detailing anomalies:

[JSON_DATA_HERE]

Your email template MUST include the following sections:
1. Formal Salutation.
2. A polite statement requesting a review of the attached bill ([FILE_NAME_HERE]).
3. A clear, itemized list of all DUPLICATE CHARGES.
4. A clear, itemized list of all PRICE INTEGRITY AUDIT issues (charges above Fair Market Value Est.).
5. A summary of the Total Flagged Amount.
6. A concluding request for itemized documentation and a revised bill.
7. Closing placeholders for Name, Contact Details, and Patient ID.

Crucial Constraints:
- Use formal, professional tone (e.g., "respectfully inquire", "administrative matter").
- Use placeholder text (e.g., [DATE OF SERVICE END]) for non-numerical details.
- Use the provided amounts and item names exactly.
- Output ONLY the email content, suitable for copying/pasting.
`;

export default function ReassessmentScreen({ billData, onBack }: DisputeKitScreenProps) {
  const [emailTemplate, setEmailTemplate] = useState("Generating personalized email template...");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to call the local API route for email generation
  const generateEmailContent = async () => {
    setIsLoading(true);

    // 1. Prepare data payload
    const dataToSend = {
        summary: billData.summary,
        duplicates: billData.duplicates,
        benchmarkIssues: billData.benchmarkIssues,
        fileName: billData.fileName
    };

    // 2. Assemble the final prompt that the Dify LLM will receive
    const completeSystemPrompt = GENERATION_SYSTEM_PROMPT.replace("[FILE_NAME_HERE]", billData.fileName || "medical bill document");
    
    try {
        // 3. Call the local API route which forwards the request to Dify
        let response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analysis_data: dataToSend, // Sent as JSON data
                system_prompt: completeSystemPrompt // Sent as the prompt template
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `API returned status ${response.status}`);
        }

        // 4. Set the generated email from the Dify proxy response
        setEmailTemplate(data.email || "Failed to generate email content. Please try again or compose manually.");

    } catch (error) {
        console.error("Error generating email:", error);
        setEmailTemplate("Error generating email content. Please check the console or manually draft the dispute letter.");
    } finally {
        setIsLoading(false);
    }
  };

  // Run generation on component mount
  useEffect(() => {
    // We only run this once when the component mounts with the new billData
    if (billData) {
        generateEmailContent();
    }
  }, [billData]); 

  const handleCopy = () => {
    navigator.clipboard.writeText(emailTemplate).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
        // Fallback copy logic
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
              We've inserted all identified duplicate charges and price integrity issues directly into the body.
            </p>
          </Card>
        </div>

        {/* Email Template */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Email Template
          </h2>
          <div className="relative">
              {isLoading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
                      <div className="flex items-center text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          <span className="font-medium">Generating draft...</span>
                      </div>
                  </div>
              )}
              <Textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm border border-slate-300 rounded-lg"
                disabled={isLoading}
              />
          </div>
          
          <p className="text-xs text-slate-500 mt-3">
            **Action Required:** Please customize the bracketed placeholders (`[YOUR FULL NAME]`, `[DATE]`, etc.) before sending.
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
          <Button onClick={handleCopy} variant="outline" className="flex-1" disabled={isLoading}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied to Clipboard!" : "Copy Template"}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1" disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Download as Text
          </Button>
          <Button onClick={handleOpenEmail} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            <Mail className="w-4 h-4 mr-2" />
            Open in Email
          </Button>
        </div>
      </div>
    </div>
  );
}