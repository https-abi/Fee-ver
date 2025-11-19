"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Share2,
  X,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";

interface AnalysisScreenProps {
  billData: any;
  analysisType: "v1" | "v2";
  onComplete: () => void;
  onBack: () => void;
  onReturnHome: () => void;
}

// Mock analysis data
const mockAnalysisV1 = {
  duplicates: [
    {
      item: "Consultation Fee",
      occurrences: 2,
      totalCharged: 2000,
      facility: "Metro Medical Center",
    },
    {
      item: "Blood Pressure Check",
      occurrences: 2,
      totalCharged: 600,
      facility: "Metro Medical Center",
    },
  ],
  benchmarkIssues: [
    {
      item: "MRI Scan",
      charged: 15000,
      benchmark: 12000,
      variance: "25% above benchmark",
      facility: "Sample Medical Center",
    },
  ],
  summary: {
    totalCharges: 45000,
    flaggedAmount: 8000,
    percentageFlagged: "17.8%",
  },
  hasDiscrepancies: false,
};

const mockAnalysisV2 = {
  ...mockAnalysisV1,
  hmoItems: [
    {
      item: "Laboratory Tests",
      covered: "Yes",
      coInsurance: "20%",
      patientResponsibility: 1200,
    },
    {
      item: "Physician Consultation",
      covered: "Yes",
      coInsurance: "0%",
      patientResponsibility: 0,
    },
  ],
  summary: {
    ...mockAnalysisV1.summary,
    totalCharges: 45000,
    flaggedAmount: 8000,
    hmoCovered: 28000,
    patientResponsibility: 17000,
  },
  hasDiscrepancies: false,
};

interface IssueDetail {
  type: "duplicate" | "benchmark";
  data: any;
}

export default function AnalysisScreen({
  billData,
  analysisType,
  onComplete,
  onBack,
  onReturnHome,
}: AnalysisScreenProps) {
  const [copied, setCopied] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);
  const analysis = analysisType === "v1" ? mockAnalysisV1 : mockAnalysisV2;

  // Prepare pie chart data based on individual items
  const pieChartData = [
    // Add individual duplicate items
    ...analysis.duplicates.map((item: any, index: number) => ({
      name: item.item,
      value: item.totalCharged,
      color: ["#3b82f6", "#ef4444"][index] // Blue for Consultation Fee, Red for BP Check
    })),
    // Add individual benchmark issue items
    ...analysis.benchmarkIssues.map((item: any, index: number) => ({
      name: item.item,
      value: item.charged,
      color: "#10b981" // Green for MRI Scan
    }))
  ];

  // Prepare bar chart data for detailed view
  const barChartData = [
    { name: "Total Charges", value: analysis.summary.totalCharges, color: "#6366f1" },
    { name: "Flagged Amount", value: analysis.summary.flaggedAmount, color: "#ef4444" },
    ...(analysisType === "v2" ? [{ name: "Your Responsibility", value: (analysis.summary as any).patientResponsibility, color: "#10b981" }] : []),
    ...(analysisType === "v2" ? [{ name: "HMO Covered", value: (analysis.summary as any).hmoCovered || 0, color: "#8b5cf6" }] : []),
    { name: "Duplicates", value: analysis.duplicates.reduce((sum, item) => sum + item.totalCharged, 0), color: "#f59e0b" },
    { name: "Above Benchmark", value: analysis.benchmarkIssues.reduce((sum, item) => sum + item.charged, 0), color: "#ec4899" },
  ];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const returnHome = () => {
    onReturnHome();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
            Analysis Report
          </h1>
          <p className="text-slate-600">
            {analysisType === "v1"
              ? "Direct Payment Analysis"
              : "HMO Coverage Analysis"}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="w-full mb-8 flex ">
          <div
            className={`grid gap-4 w-full flex-1 ${
              analysisType === "v2" ? "grid-rows-3" : "grid-rows-2"
            }`}
          >
            {/*Total Charges*/}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Total Charges</p>
                <Tooltip content="The total amount charged on your medical bill before any reductions or insurance coverage." />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ₱{analysis.summary.totalCharges.toLocaleString()}
              </p>
            </Card>
            {/*Flagged Amount*/}
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-center justify-between ">
                <p className="text-sm text-slate-600">Flagged Amount</p>
                <Tooltip content="The total amount of charges we identified as potentially problematic, including duplicates and prices above benchmark rates." />
              </div>
              <p className="text-2xl font-bold text-red-600">
                ₱{analysis.summary.flaggedAmount.toLocaleString()}
              </p>
              <p className="text-xs text-red-600 mb-2">
                {analysis.summary.percentageFlagged} of total
              </p>
            </Card>
            {/*If HMO Coverage Analysis*/}
            {analysisType === "v2" && (
              <Card className="p-6 border-green-200 bg-green-50 h-40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Your Responsibility</p>
                  <Tooltip content="The amount you're responsible for after insurance coverage and co-insurance percentages are applied." />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₱
                  {(
                    analysis.summary as any
                  ).patientResponsibility?.toLocaleString()}
                </p>
              </Card>
            )}
          </div>
          {/* Charts */}
          <div className="flex-1 ml-6">
            {/* Pie Chart (Detailed Analysis) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Detailed Analysis</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      formatter={(value, entry, index) => {
                        const item = pieChartData[index];
                        const percentage = ((item.value / analysis.summary.totalCharges) * 100).toFixed(1);
                        return (
                          <span className="text-slate-700 text-sm">
                            {item.name}: {percentage}%
                          </span>
                        );
                      }}
                    />
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox && viewBox.cx !== undefined && viewBox.cy !== undefined) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="central">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-xl font-bold">
                                ₱{(analysis.summary.totalCharges / 1000).toFixed(1)}k
                              </tspan>
                              <tspan x={viewBox.cx} y={viewBox.cy + 20} className="fill-slate-600 text-sm">
                                Total
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Found */}
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Issues Found</h2>
          </div>

          {/* Duplicate Items */}
          {analysis.duplicates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-slate-900">
                    Duplicate Charges
                  </h3>
                  <Tooltip content="The same service appears to be charged multiple times on your bill. This is often a billing system error." />
                </div>
              </div>
              <div className="space-y-3">
                {analysis.duplicates.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() =>
                      setSelectedIssue({ type: "duplicate", data: item })
                    }
                    className="flex justify-between items-start p-3 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:shadow-md hover:border-orange-400 transition-all"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.item}</p>
                      <p className="text-sm text-slate-600">
                        Charged {item.occurrences} times
                      </p>
                    </div>
                    <p className="font-semibold text-orange-600">
                      ₱{item.totalCharged.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benchmark Issues */}
          {analysis.benchmarkIssues.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-slate-900">
                    Above Benchmark (Fee-ver Check)
                  </h3>
                  <Tooltip content="These charges are 20% or more above the typical prices in your region. This doesn't mean they're wrong, but worth questioning." />
                </div>
              </div>
              <div className="space-y-3">
                {analysis.benchmarkIssues.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() =>
                      setSelectedIssue({ type: "benchmark", data: item })
                    }
                    className="p-4 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:shadow-md hover:border-red-400 transition-all"
                  >
                    <p className="font-medium text-slate-900 mb-2">
                      {item.item}
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Charged</p>
                        <p className="font-semibold text-slate-900">
                          ₱{item.charged.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Benchmark</p>
                        <p className="font-semibold text-slate-900">
                          ₱{item.benchmark.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Variance</p>
                        <p className="font-semibold text-red-600">
                          {item.variance}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* HMO Details (V2 only) */}
        {analysisType === "v2" && (
          <Card className="mb-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                HMO Coverage Breakdown
              </h2>
            </div>
            <div className="space-y-3">
              {(analysis as any).hmoItems?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.item}</p>
                    <p className="text-sm text-slate-600">
                      {item.covered === "Yes" ? "Covered" : "Not covered"} •{" "}
                      {item.coInsurance} co-insurance
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    ₱{item.patientResponsibility.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Data Privacy Notice */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            This analysis was completed 100% on your device. Your medical bill
            was never sent to any server.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleCopy} className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy Report"}
          </Button>
          {analysis.hasDiscrepancies ? (
            <Button
              onClick={onComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply for Reassessment →
            </Button>
          ) : (
            <Button
              onClick={returnHome}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Finish
            </Button>
          )}
        </div>
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {selectedIssue.data.item}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {selectedIssue.type === "duplicate"
                      ? "Duplicate Charge Issue"
                      : "Pricing Variance Issue"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Issue Details */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Issue Breakdown
                </h3>
                {selectedIssue.type === "duplicate" ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        Number of Occurrences:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {selectedIssue.data.occurrences}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        Total Amount Charged:
                      </span>
                      <span className="font-semibold text-orange-600">
                        ₱{selectedIssue.data.totalCharged.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Facility:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedIssue.data.facility}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm text-slate-600 mb-2">
                        Recommendation:
                      </p>
                      <p className="text-sm text-slate-900">
                        Only one instance of this charge should appear on your
                        bill. Contact the facility to request removal of
                        duplicate entries.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Charged Amount:</span>
                      <span className="font-semibold text-slate-900">
                        ₱{selectedIssue.data.charged.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        Regional Benchmark:
                      </span>
                      <span className="font-semibold text-slate-900">
                        ₱{selectedIssue.data.benchmark.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Variance:</span>
                      <span className="font-semibold text-red-600">
                        {selectedIssue.data.variance}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Facility:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedIssue.data.facility}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm text-slate-600 mb-2">
                        Recommendation:
                      </p>
                      <p className="text-sm text-slate-900">
                        This charge is significantly above regional averages.
                        Request an itemized breakdown and compare with other
                        facilities' rates.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Highlight Placeholder */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Bill Reference
                </h3>
                <div className="bg-slate-100 rounded-lg p-8 text-center border-2 border-dashed border-slate-300">
                  <p className="text-slate-600 mb-2">
                    📄 PDF Viewer with Highlighted Text
                  </p>
                  <p className="text-sm text-slate-500">
                    Relevant section of your bill will be highlighted here
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIssue(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    // Copy to clipboard for dispute template
                    const issueText = `${selectedIssue.data.item}: ${
                      selectedIssue.type === "duplicate"
                        ? `Charged ${selectedIssue.data.occurrences} times for ₱${selectedIssue.data.totalCharged}`
                        : `₱${selectedIssue.data.charged} (Benchmark: ₱${selectedIssue.data.benchmark})`
                    }`;
                    navigator.clipboard.writeText(issueText);
                    alert("Issue details copied to clipboard");
                  }}
                >
                  Copy to Reassessment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
