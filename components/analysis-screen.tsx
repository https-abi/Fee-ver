"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Copy, Eye, X, FileText, HelpCircle } from 'lucide-react';
import {
  Tooltip,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip as RechartsTooltip } from "recharts";

interface AnalysisScreenProps {
  billData: any;
  analysisType: "v1" | "v2";
  onComplete: () => void; 
  onBack: () => void;
  onReturnHome: () => void;
}

interface IssueDetail {
  type: "duplicate" | "benchmark";
  data: any;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6"];

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

  // Safe fallback if billData is missing
  const analysis = billData || {
    duplicates: [],
    benchmarkIssues: [],
    hmoItems: [],
    summary: { totalCharges: 0, flaggedAmount: 0, percentageFlagged: "0%" }
  };
  
  const hasIssues = analysis.summary.flaggedAmount > 0 || analysis.duplicates.length > 0 || analysis.benchmarkIssues.length > 0;

  // Prepare Chart Data
  const pieChartData = [
    ...analysis.duplicates.map((item: any, index: number) => ({
      name: `Duplicate: ${item.item}`,
      value: item.totalCharged,
      color: "#ef4444" // Red for duplicates
    })),
    ...analysis.benchmarkIssues.map((item: any, index: number) => ({
      name: `Overpriced: ${item.item}`,
      value: item.charged - item.benchmark, // Only graph the overcharged portion
      color: "#f97316" // Orange for overpricing
    }))
  ];

  // Add "Valid" portion to chart
  const validAmount = analysis.summary.totalCharges - analysis.summary.flaggedAmount;
  if (validAmount > 0) {
      pieChartData.push({ name: "Valid Charges", value: validAmount, color: "#e2e8f0" });
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAmount = (amount: number) => `₱${(amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onReturnHome}
            className="flex items-center justify-center h-[30px] w-[30px] rounded-full bg-slate-300 hover:bg-slate-200 font-medium text-sm mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="M15 18L9 12L15 6" /></svg>
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analysis Report</h1>
          <p className="text-slate-600">
            {analysisType === "v1" ? "Direct Payment Analysis" : "HMO Coverage Analysis"}
          </p>
        </div>

        {/* DEBUG REPORT TOGGLE */}
        {analysis?.debugText && (
          <div className="mb-8">
            <Collapsible open={isOpenDebug} onOpenChange={setIsOpenDebug} className="border border-purple-200 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">Analysis Logic</h3>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-purple-700 hover:text-purple-900 hover:bg-purple-100">
                    {isOpenDebug ? "Hide" : "Show"}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="px-4 pb-4">
                <div className="bg-white/50 rounded-md p-3 mt-2 border border-purple-100">
                  <p className="text-xs text-slate-700 font-mono">{analysis.debugText}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Summary Cards */}
        <div className="w-full mb-8 flex flex-col md:flex-row gap-6">
          <div className={`flex flex-col gap-3 w-full md:w-1/2`}>
            <Card className="p-4 flex flex-col justify-center flex-1 gap-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-600">Total Charges</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatAmount(analysis.summary.totalCharges)}
              </p>
            </Card>
            <Card className={`p-4 flex flex-col justify-center border-l-4 flex-1 gap-2 ${hasIssues ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-600">Potential Savings / Flagged</p>
                <Tooltip content="The total amount of charges identified as potential issues." />
              </div>
              <p className={`text-2xl font-bold ${hasIssues ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(analysis.summary.flaggedAmount)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {analysis.summary.percentageFlagged} of bill flagged
              </p>
            </Card>
          </div>

          {/* Chart */}
          <div className="flex-1 md:w-1/2 flex items-center justify-center">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                        data={pieChartData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={50} 
                        outerRadius={70} 
                        paddingAngle={2} 
                        dataKey="value" 
                        stroke="none"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatAmount(value)} />
                    <Label content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="central">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-lg font-bold">
                                {analysis.summary.percentageFlagged}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy as number) + 20} className="fill-slate-500 text-xs">Issues</tspan>
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

        {/* Itemized Bill Table */}
        <Card className="mb-8 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-slate-900" />
              <h2 className="text-xl font-bold text-slate-900">Itemized Bill Breakdown</h2>
            </div>
          </div>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[40%]">Item Description</TableHead>
                  <TableHead className="text-right">Billed Price</TableHead>
                  <TableHead className="text-right">Standard Rate</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.hmoItems && analysis.hmoItems.length > 0 ? (
                  analysis.hmoItems.map((item: any, idx: number) => {
                    // Determine status based on benchmark logic
                    const isOvercharged = item.benchmarkPrice && item.amount > (item.benchmarkPrice * 1.5); // 50% buffer for red flag
                    
                    return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {item.item}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        {formatAmount(item.amount)}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {item.benchmarkPrice ? (
                           <span className="text-slate-500 text-xs">Avg: {formatAmount(item.benchmarkPrice)}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isOvercharged ? (
                           <Badge variant="destructive">Overpriced</Badge>
                        ) : (
                           <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )})
                ) : (
                   <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                      No itemized data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Issues Found Section */}
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Issues Found</h2>
          </div>

          {/* Duplicate Items */}
          {analysis.duplicates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-slate-900">Duplicate Charges</h3>
              </div>
              <div className="space-y-3">
                {analysis.duplicates.map((item: any, idx: number) => (
                   <div key={idx} onClick={() => setSelectedIssue({ type: "duplicate", data: item })}
                    className="flex justify-between items-start p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:shadow-md transition-all">
                    <div>
                      <p className="font-medium text-slate-900">{item.item}</p>
                      <p className="text-sm text-slate-600">Charged {item.occurrences} times</p>
                    </div>
                    <p className="font-semibold text-red-600">{formatAmount(item.totalCharged)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Integrity Audit */}
          {analysis.benchmarkIssues.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-slate-900">Price Integrity Alerts</h3>
              </div>
              <div className="space-y-3">
                {analysis.benchmarkIssues.map((item: any, idx: number) => (
                  <div key={idx} onClick={() => setSelectedIssue({ type: "benchmark", data: item })}
                    className="p-4 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:shadow-md transition-all">
                    <div className="flex justify-between">
                        <p className="font-medium text-slate-900 mb-2">{item.item}</p>
                        {item.facility && <span className="text-xs text-slate-500">{item.facility}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Charged</p>
                        <p className="font-semibold text-slate-900">{formatAmount(item.charged)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Standard Rate</p>
                        <p className="font-semibold text-slate-900">{formatAmount(item.benchmark)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Difference</p>
                        <p className="font-semibold text-orange-600">{item.variance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Footer Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleCopy} className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy Report"}
          </Button>

          {hasIssues ? (
            <Button onClick={onComplete} className="flex-1 bg-blue-900 hover:bg-blue-800 text-white">
              Request for Reassessment →
            </Button>
          ) : (
            <Button onClick={onReturnHome} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              Finish Analysis
            </Button>
          )}
        </div>
      </div>
      
      {/* Issue Popup */}
       {selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">{selectedIssue.data.item}</h3>
                <button onClick={() => setSelectedIssue(null)}><X className="w-5 h-5" /></button>
            </div>
             {selectedIssue.type === 'benchmark' && (
                 <div className="space-y-4">
                     <div className="p-3 bg-orange-50 border border-orange-100 rounded-md">
                         <p className="text-sm text-orange-800 font-semibold">Price Warning</p>
                         <p className="text-sm mt-1 text-slate-700">This item costs <b>{formatAmount(selectedIssue.data.charged)}</b>, which is significantly higher than the market average of <b>{formatAmount(selectedIssue.data.benchmark)}</b>.</p>
                     </div>
                     <Button className="w-full" onClick={() => setSelectedIssue(null)}>Close</Button>
                 </div>
             )}
              {selectedIssue.type === 'duplicate' && (
                 <div className="space-y-4">
                     <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                         <p className="text-sm text-red-800 font-semibold">Duplicate Charge</p>
                         <p className="text-sm mt-1 text-slate-700">This item appears <b>{selectedIssue.data.occurrences} times</b> on the bill. Check if you actually received this service multiple times.</p>
                     </div>
                     <Button className="w-full" onClick={() => setSelectedIssue(null)}>Close</Button>
                 </div>
             )}
          </Card>
        </div>
       )}
    </div>
  );
}