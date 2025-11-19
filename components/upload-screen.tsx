'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

interface UploadScreenProps {
  onComplete: (data: any) => void;
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
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file');
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
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a PDF file');
    }
  };

  const handleSubmit = () => {
    if (!file || !consentChecked) {
      setError('Please upload a file and accept the consent');
      return;
    }

    // Simulate file processing
    const reader = new FileReader();
    reader.onload = () => {
      onComplete({
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        contributeData: contributeData,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg">
        <div className="p-6">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Fee-ver</h1>
            <p className="text-slate-600">Check your bill's temperature.<br></br>Catch hidden fees before you pay.</p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors mb-6"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Upload your medical bill</p>
            <p className="text-sm text-slate-500">PDF only • Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg mb-6">
              <FileText className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">{file.name}</p>
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
                onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm text-slate-700 cursor-pointer">
                <button
                  onClick={() => setShowTosModal(true)}
                  className="font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Terms of Service & Privacy Policy
                </button> and consent to having my
                document processed.
              </label>
            </div>
            <p className="text-xs text-slate-600 ml-6">
              Your document is processed securely and never shared without your consent. We comply with RA 10173.
            </p>
          </div>

          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={contributeData}
                onCheckedChange={(checked) => setContributeData(checked as boolean)}
                className="mt-1"
              />
              <label className="text-sm text-slate-700 cursor-pointer">
                <span className="font-semibold text-slate-700">(Optional) Help Improve Fee-ver</span> and share anonymized pricing data to strengthen our database.
              </label>
            </div>
            <p className="text-xs text-slate-600 ml-6">
              Completely optional and anonymous.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || !consentChecked}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
          >
            Continue to Analysis
          </Button>
        </div>
      </Card>

      {showTosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">Terms of Service & Privacy Policy</h2>
              <button
                onClick={() => setShowTosModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-slate-700 text-sm">
              <section>
                <h3 className="font-bold text-slate-900 mb-2">Data Protection & Privacy (RA 10173)</h3>
                <p>
                  Fee-ver is committed to protecting your personal data in compliance with the Data Privacy Act of 2012 (RA 10173). We are transparent about how we handle your medical bill information.
                </p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 mb-2">Your Rights</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Right to be informed about data collection and usage</li>
                  <li>Right to access your personal data</li>
                  <li>Right to correct inaccurate data</li>
                  <li>Right to delete your data upon request</li>
                  <li>Right to object to unauthorized processing</li>
                </ul>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 mb-2">How We Use Your Data</h3>
                <p>
                  Your medical bill is processed 100% on your device. We do not store or transmit your bill data without explicit consent. Any anonymized pricing insights you choose to share help improve our fee benchmarking database.
                </p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 mb-2">Data Security</h3>
                <p>
                  All processing happens locally in your browser. Your sensitive health and financial information never leaves your device unless you explicitly choose to contribute anonymized data.
                </p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 mb-2">Contact Us</h3>
                <p>
                  For privacy concerns or to exercise your rights under RA 10173, please contact our Data Protection Officer at privacy@fever.com
                </p>
              </section>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
