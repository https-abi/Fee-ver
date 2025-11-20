'use client'

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, X, Check, ShieldCheck } from 'lucide-react';

interface UploadScreenProps {
  onComplete: (data: { file: File; contributeData: boolean }) => void;
}

export default function UploadScreen({ onComplete }: UploadScreenProps) {
  const [file, setFile] = useState<File | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contributeData, setContributeData] = useState(false)
  const [showTosModal, setShowTosModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // NOTE: PDF support is currently removed per user request. This list keeps images only.
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please upload a PNG, JPG, or JPEG file')
        setFile(null)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Please drop a PNG, JPG, or JPEG file')
      }
    }
  }

  const handleContinue = () => {
    if (!file || !consentChecked) {
      setError('Please upload a file and accept the consent')
      return
    }
    onComplete({ file, contributeData });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
      {/* Reduced max-width from max-w-lg to max-w-md for a tighter card */}
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <div className="p-6"> {/* Reduced padding from p-8 to p-6 */}
          <div className="text-center mb-6"> {/* Reduced margin from mb-8 to mb-6 */}
            <div className="flex justify-center mb-3">
                <div className="bg-blue-100 p-2 rounded-full"> {/* Reduced padding */}
                    <ShieldCheck className="w-6 h-6 text-blue-700" /> {/* Smaller icon */}
                </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Fee-ver</h1> {/* Slightly smaller font */}
            <p className="text-slate-600 text-xs leading-relaxed max-w-xs mx-auto">
              Identify overcharges, duplicate entries, and pricing anomalies with AI-powered verification.
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group ${file ? 'border-green-500 bg-green-50/50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'}`}
          >
            {file ? (
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="bg-green-100 p-2 rounded-full mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-green-800">File Ready</p>
              </div>
            ) : (
              <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-200">
                  <div className="bg-slate-100 p-2 rounded-full mb-2 group-hover:bg-blue-100">
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-0.5">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Supported formats: PNG, JPG, JPEG (Max 10MB)
                  </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="bg-blue-50 p-1.5 rounded">
                 <FileText className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-800 py-2">
              <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) =>
                  setConsentChecked(checked as boolean)
                }
                className="mt-0.5 border-slate-400 size-3.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label
                htmlFor="consent"
                className="text-[11px] text-slate-600 leading-snug cursor-pointer select-none"
              >
                I agree to the{' '}
                <button
                  onClick={(e) => { e.preventDefault(); setShowTosModal(true); }}
                  className="font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-2"
                >
                  Terms of Service & Privacy Policy
                </button> and consent to automated document processing.
              </label>
            </div>
            
            <Button
                onClick={handleContinue}
                disabled={!file || !consentChecked}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 text-sm shadow-md shadow-slate-200 disabled:opacity-50 disabled:shadow-none transition-all"
            >
                Start
            </Button>
            
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Secure processing via Dify AI • No data stored permanently
            </p>
          </div>
        </div>
      </Card>

      {showTosModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm max-h-[80vh] flex flex-col bg-white shadow-2xl">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Legal Information
              </h2>
              <button
                onClick={() => setShowTosModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-slate-600 text-[11px] leading-relaxed overflow-y-auto">
              <section>
                <h3 className="font-bold text-slate-900 mb-1 text-xs">1. Data Processing Agreement</h3>
                <p>By uploading a document, you grant Fee-ver temporary permission to process the file using AI models solely for the purpose of extraction and analysis. Files are not retained after the session ends.</p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 mb-1 text-xs">2. Privacy & Compliance</h3>
                <p>We adhere to the Data Privacy Act of 2012 (RA 10173). Your medical data is treated with strict confidentiality and is encrypted during transit.</p>
              </section>
              <section>
                 <h3 className="font-bold text-slate-900 mb-1 text-xs">3. Disclaimer</h3>
                 <p>This tool provides estimates based on market averages. It does not constitute legal or official medical billing advice. Discrepancies should be verified with your healthcare provider.</p>
              </section>
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                <Button onClick={() => setShowTosModal(false)} className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 h-8 text-xs">
                    Close
                </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}