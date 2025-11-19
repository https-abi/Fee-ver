// lib/benchmark.ts

// Define the interface matching your database schema
export interface MedicalRate {
  code: string;
  description: string;
  rates: number;      // Benchmark Rate
  min_rates: number;
  max_rates: number;
}

// HARDCODED DATABASE (Based on Philippine Market Averages)
const BENCHMARK_DB: MedicalRate[] = [
  { code: "LAB-001", description: "Urinalysis", rates: 100, min_rates: 50, max_rates: 150 },
  { code: "LAB-002", description: "CBC", rates: 300, min_rates: 180, max_rates: 450 },
  { code: "LAB-003", description: "Complete Blood Count", rates: 300, min_rates: 180, max_rates: 450 },
  { code: "RAD-001", description: "Chest PA", rates: 475, min_rates: 350, max_rates: 600 },
  { code: "RAD-002", description: "Chest X-Ray", rates: 475, min_rates: 350, max_rates: 600 },
  { code: "RAD-003", description: "Chest and Lat Xray", rates: 1750, min_rates: 1000, max_rates: 2500 },
  { code: "LAB-004", description: "Antigen Test", rates: 750, min_rates: 600, max_rates: 1000 },
  { code: "RAD-004", description: "CT Scan", rates: 6000, min_rates: 4500, max_rates: 8000 },
];

export async function getBenchmarkData(scannedDescription: string): Promise<MedicalRate | null> {
  // Simulate DB Latency
  await new Promise(resolve => setTimeout(resolve, 100));

  const cleanDesc = scannedDescription.toLowerCase().trim();

  // Simple fuzzy-like search: Check if the DB description is inside the scanned text OR vice versa
  const match = BENCHMARK_DB.find(item => {
    const dbDesc = item.description.toLowerCase();
    return cleanDesc.includes(dbDesc) || dbDesc.includes(cleanDesc);
  });

  return match || null;
}