"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  X,
} from "lucide-react";
import {
  Tooltip,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Label, Tooltip as RechartsTooltip } from "recharts";

interface AnalysisScreenProps {
  billData: any;
  analysisType: "v1" | "v2";
  onComplete: () => void;
  onBack: () => void;
  onReturnHome: () => void;
}

// Mock analysis data
const mockAnalysisV1 = {
  duplicates: [],
  benchmarkIssues: [],
  hmoItems: [],
  summary: {
    totalCharges: 0,
    flaggedAmount: 0,
    percentageFlagged: "0%",
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
  const [isOpenDebug, setIsOpenDebug] = useState(false);
  
  const analysis = billData || mockAnalysisV1;

  const pieChartData = [
    ...analysis.duplicates.map((item: any, index: number) => ({
      name: item.item,
      value: item.totalCharged,
      color: ["#3b82f6", "#ef4444"][index % 2] 
    })),
    ...analysis.benchmarkIssues.map((item: any, index: number) => ({
      name: item.item,
      value: item.charged,
      color: "#10b981"
    }))
  ];
  
  if (pieChartData.length === 0 && analysis.summary.totalCharges > 0) {
     pieChartData.push({ name: "Valid Charges", value: analysis.summary.totalCharges, color: "#e2e8f0" });
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        
        {/* DEBUG REPORT */}
        {billData?.debugText && (
          <div className="mb-8">
             <Collapsible
              open={isOpenDebug}
              onOpenChange={setIsOpenDebug}
              className="border border-purple-200 bg-purple-50 rounded-lg"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-purple-900">
                        AI Vision Debug Report
                    </h3>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-purple-700 hover:text-purple-900 hover:bg-purple-100">
                    {isOpenDebug ? "Hide" : "Show"}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="px-4 pb-4">
                <div className="bg-black/5 rounded-md p-3 mt-2">
                    <pre className="whitespace-pre-wrap text-xs text-slate-700 font-mono overflow-x-auto">
                        {billData.debugText}
                    </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Summary Cards */}
        <div className="w-full mb-8 flex flex-col md:flex-row">
          <div
            className={`grid gap-4 w-full flex-1 ${
              analysisType === "v2" ? "grid-rows-3" : "grid-rows-2"
            }`}
          >
            {/*Total Charges*/}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Total Charges</p>
                <Tooltip content="The total amount of all charges listed on your bill before any insurance or discounts." />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ₱{(analysis.summary.totalCharges || 0).toLocaleString()}
              </p>
            </Card>
            {/*Flagged Amount*/}
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Flagged Amount</p>
                <Tooltip content="The total amount of charges identified as potential issues." />
              </div>
              <p className="text-2xl font-bold text-red-600">
                ₱{(analysis.summary.flaggedAmount || 0).toLocaleString()}
              </p>
              <p className="text-xs text-red-600 mb-2">
                {analysis.summary.percentageFlagged} of total
              </p>
            </Card>
            {/*If HMO Coverage Analysis*/}
            {analysisType === "v2" && (
              <Card className="p-6 border-green-200 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Your Responsibility</p>
                  <Tooltip content="The amount you're responsible for after coverage." />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₱{(analysis.summary.patientResponsibility || 0).toLocaleString()}
                </p>
              </Card>
            )}
          </div>
          {/* Charts */}
          <div className="flex-1 md:ml-6 mt-6 md:mt-0 flex items-center justify-center min-h-[400px]">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 w-full h-full flex flex-col justify-between">
              <h3 className="text-lg font-semibold text-slate-900 text-center">Detailed Analysis</h3>
              <div className="flex-grow flex items-center justify-center mb-5 min-h-[320px] max-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy={`${
                        analysisType === "v2" ? "40%" : "50%"
                      }`}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percentage = analysis.summary.totalCharges > 0 
                            ? ((data.value / analysis.summary.totalCharges) * 100).toFixed(1) 
                            : "0.0";
                          return (
                            <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200 pointer-events-none">
                              <p className="font-semibold text-slate-900 mb-1">{data.name}</p>
                              <p className="text-sm text-slate-600">Amount: ₱{data.value.toLocaleString()}</p>
                              <p className="text-sm text-slate-600">Percentage: {percentage}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'transparent' }}
                      wrapperStyle={{ outline: 'none', zIndex: 1000 }}
                      allowEscapeViewBox={{ x: true, y: true }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: '16px' }}
                      formatter={(value, entry, index) => {
                        const item = pieChartData[index];
                        const percentage = analysis.summary.totalCharges > 0 ? ((item.value / analysis.summary.totalCharges) * 100).toFixed(1) : "0.0";
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
                                ₱{((analysis.summary.totalCharges || 0) / 1000).toFixed(1)}k
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
                    Fair Price Estimate Check
                  </h3>
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
                        <p className="text-slate-600">Estimate</p>
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
          
          {analysis.duplicates.length === 0 && analysis.benchmarkIssues.length === 0 && (
             <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                <p className="font-medium text-slate-900">No major issues found!</p>
                <p className="text-sm">Your bill appears to be within normal ranges and contains no duplicates.</p>
             </div>
          )}
        </Card>

        {/* HMO Details (V2 only) - NOW DYNAMIC */}
        {analysisType === "v2" && analysis.hmoItems && (
          <Card className="mb-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                HMO Coverage Breakdown
              </h2>
            </div>
            <div className="space-y-3">
              {analysis.hmoItems.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No individual items found or extracted.</p>
              ) : (
                  analysis.hmoItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <p className="font-medium text-slate-900">{item.item}</p>
                           {item.covered === "Yes" ? (
                               <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">COVERED</Badge>
                           ) : (
                               <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">NOT COVERED</Badge>
                           )}
                        </div>
                      </div>
                      <div className="text-right">
                        {/* SHOW FAIR PRICE IF AVAILABLE AND NOT COVERED */}
                        {item.benchmarkPrice && item.covered === "No" ? (
                           <div className="flex flex-col items-end">
                               <p className="font-bold text-green-600 text-sm">
                                 PAYABLE: ₱{item.benchmarkPrice.toLocaleString()}
                               </p>
                               <p className="text-xs text-slate-400 line-through">
                                 CHARGE: ₱{item.amount.toLocaleString()}
                               </p>
                           </div>
                        ) : (
                           <p className="font-semibold text-slate-900">
                             {item.covered === "Yes" ? (
                                `Covered: ₱${item.amount.toLocaleString()}`
                             ) : (
                                `Payable: ₱${item.amount.toLocaleString()}`
                             )}
                           </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
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
          
            <Button
              onClick={onReturnHome}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              Finish Analysis
            </Button>
        </div>
      </div>

      {/* Issue Modal */}
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
                        Fair Price Estimate:
                      </span>
                      <span className="font-semibold text-slate-900">
                        ₱{selectedIssue.data.benchmark.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIssue(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}