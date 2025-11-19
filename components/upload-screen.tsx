'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface UploadScreenProps {
  onComplete: (data: any) => void;
}

export default function UploadScreen({ onComplete }: UploadScreenProps) {
  const [file, setFile] = useState<File | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Fee-ver</h1>
            <p className="text-slate-600">Analyze your medical bills with confidence</p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors mb-6"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">Upload your medical bill</p>
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
                I agree to the{' '}
                <span className="font-semibold text-blue-600">Terms of Service & Privacy Policy</span> and consent to
                having my document processed.
              </label>
            </div>
            <p className="text-xs text-slate-600 ml-6">
              Your document is processed securely and never shared without your consent. We comply with RA 10173.
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
    </div>
  );
}
