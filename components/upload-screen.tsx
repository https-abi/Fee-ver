"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, X, Check } from 'lucide-react';

interface UploadScreenProps {
  onComplete: (data: { file: File; contributeData: boolean }) => void;
}

export default function UploadScreen({ onComplete }: UploadScreenProps) {
  const [file, setFile] = useState<File | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contributeData, setContributeData] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a PDF, PNG, JPG, or JPEG file");
        setFile(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please drop a PDF, PNG, JPG, or JPEG file");
      }
    }
  };

  const handleContinue = () => {
    if (!file || !consentChecked) {
      setError("Please upload a file and accept the consent");
      return;
    }
    onComplete({ file, contributeData });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg">
        <div className="p-6">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Fee-ver</h1>
            <p className="text-slate-600">
              Check your bill's temperature.<br></br>Catch hidden fees before
              you pay.
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors mb-6"
          >
            {file ? (
              <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
            ) : (
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            )}
            <p className="text-sm font-medium text-slate-700">
              {file ? "File uploaded!" : "Upload your medical bill"}
            </p>
            <p className="text-sm text-slate-500">PDF, PNG, JPG, or JPEG • Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg mb-6">
              <FileText className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  {file.name}
                </p>
                <p className="text-xs text-green-700">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) =>
                  setConsentChecked(checked as boolean)
                }
                className="mt-1"
              />
              <label
                htmlFor="consent"
                className="text-sm text-slate-700 cursor-pointer"
              >
                <span>I agree to the </span>
                <button
                  onClick={() => setShowTosModal(true)}
                  className="font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Terms of Service & Privacy Policy
                </button>{" "}
                and consent to having my document processed using AI.
              </label>
            </div>
            <p className="text-xs text-slate-600 ml-6">
              Your document is processed securely via Dify and never shared publicly.
            </p>
          </div>

          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={contributeData}
                onCheckedChange={(checked) =>
                  setContributeData(checked as boolean)
                }
                className="mt-1"
              />
              <label className="text-sm text-slate-700 cursor-pointer">
                <span className="font-semibold text-slate-700">
                  (Optional) Help Improve Fee-ver
                </span>{" "}
                and share anonymized pricing data.
              </label>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!file || !consentChecked}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
          >
            Continue
          </Button>
        </div>
      </Card>

      {showTosModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <Card className="w-full max-w-md max-h-[85vh] flex flex-col bg-white">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Terms & Privacy
              </h2>
              <button
                onClick={() => setShowTosModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-slate-700 text-xs overflow-y-auto flex-1">
              <section>
                <h3 className="font-bold text-slate-900 mb-1">
                  1. Data Processing
                </h3>
                <p>By uploading, you agree to have your document processed by AI models.</p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 mb-1">
                  2. Data Protection
                </h3>
                <p>Fee-ver complies with the Data Privacy Act. Your medical bill information is protected.</p>
              </section>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}