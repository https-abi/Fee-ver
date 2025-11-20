# System Architecture: Database + Dify Integration

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                     (Next.js Frontend)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /api/analyze (Next.js API)                    │
│                                                                   │
│  1. Receive File Upload                                          │
│     └─ Log: Request details                                      │
│                                                                   │
│  2. Upload to Dify API ──────────────┐                          │
│     └─ Log: Upload status            │                          │
│                                       ▼                          │
│                            ┌─────────────────────┐              │
│                            │    Dify AI API      │              │
│  3. Run OCR Workflow       │  (Qwen-VL-Max)      │              │
│     └─ Log: Workflow status│                     │              │
│                            │  - Image Upload     │              │
│                            │  - OCR Extraction   │              │
│     ┌──────────────────────│  - JSON Output      │              │
│     │                      └─────────────────────┘              │
│     ▼                                                            │
│  4. Parse Response                                               │
│     └─ Log: Charges & deductions found                          │
│                                                                   │
│  5. For Each Charge ──────────────────┐                         │
│     └─ Log: Item details              │                         │
│                                        ▼                         │
│                         ┌──────────────────────────┐            │
│                         │  Database Module         │            │
│                         │  (lib/medical-rates.ts)  │            │
│     ┌───────────────────│                          │            │
│     │                   │  - Fuzzy Search          │            │
│     │                   │  - Benchmark Analysis    │            │
│     │                   │  - Confidence Scoring    │            │
│     │                   └────────┬─────────────────┘            │
│     │                            │                              │
│     │                            ▼                              │
│     │              ┌──────────────────────────┐                │
│     │              │  PostgreSQL Database      │                │
│     │              │  (Alibaba RDS)            │                │
│     │              │                           │                │
│     │              │  medical_rates table:     │                │
│     │              │  - description (TEXT)     │                │
│     │              │  - rates (NUMERIC)        │                │
│     │              │  - min_rates (NUMERIC)    │                │
│     │              │  - max_rates (NUMERIC)    │                │
│     │              │                           │                │
│     │              │  Extensions:              │                │
│     │              │  - pg_trgm (fuzzy search) │                │
│     │              │  - GIN index              │                │
│     │              └────────┬─────────────────┘                │
│     │                       │                                   │
│     ├─ Log: DB connection  │                                   │
│     ├─ Log: Search query   │                                   │
│     ├─ Log: Match results  │                                   │
│     └─ Log: Benchmark calc │                                   │
│                             │                                   │
│  6. Detect Duplicates      ◄┘                                  │
│     └─ Log: Duplicate items                                     │
│                                                                   │
│  7. Calculate Totals                                             │
│     └─ Log: Final summary                                       │
│                                                                   │
│  8. Return Analysis                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYSIS SCREEN                             │
│                                                                   │
│  - Summary Cards (Totals, Flagged Amount)                        │
│  - Pie Chart (Visual breakdown)                                  │
│  - Itemized Bill Breakdown                                       │
│  - Issues Found (Duplicates, Overpriced)                         │
│  - Confidence Scores                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Sequence

### Step 1: File Upload

```
User → Upload Screen → API Route
                        └─ FormData with:
                           - file (image)
                           - user (ID)
                           - prompt (analysis instructions)
```

### Step 2: Dify Processing

```
API Route → Dify API
            ├─ POST /files/upload
            │  └─ Returns: file_id
            │
            └─ POST /workflows/run
               ├─ Input: file_id, prompt
               └─ Returns: { charges: [...], deductions: [...] }
```

### Step 3: Database Lookup (Per Charge)

```
For each charge:
  API Route → medical-rates.ts → PostgreSQL
              └─ searchMedicalRates(description)
                 ├─ Fuzzy Search (pg_trgm)
                 │  └─ similarity(description, search_term)
                 │
                 └─ Fallback (if no match)
                    └─ ILIKE pattern match

                 Returns:
                 {
                   found: boolean,
                   rate: {
                     rates: number,
                     min_rates: number,
                     max_rates: number
                   },
                   confidence: number
                 }
```

### Step 4: Benchmark Analysis

```
getBenchmarkAnalysis(description, charged_amount)
  ├─ Compare: charged_amount vs database.rates
  ├─ Calculate: variance percentage
  ├─ Determine: isOverpriced
  │  └─ If charged > max_rates OR
  │     If charged > rates + 20%
  │
  └─ Return:
     {
       hasBenchmark: true,
       benchmarkPrice: number,
       variance: string,
       isOverpriced: boolean,
       confidence: number
     }
```

### Step 5: Final Analysis

```
Collect all results:
  ├─ Benchmark Issues (overpriced items)
  ├─ Duplicates (items charged multiple times)
  ├─ HMO Items (all charges + deductions)
  │
  └─ Calculate Summary:
     ├─ totalCharges
     ├─ flaggedAmount
     ├─ percentageFlagged
     └─ patientResponsibility
```

## 📊 Database Query Flow

### Primary Fuzzy Search

```sql
SELECT
  id, code, description, rates, min_rates, max_rates,
  similarity(LOWER(description), $1) as sim_score
FROM medical_rates
WHERE similarity(LOWER(description), $1) > $2
ORDER BY similarity(LOWER(description), $1) DESC
LIMIT 1;
```

**Parameters:**

- `$1` = cleaned search term (lowercase, trimmed)
- `$2` = threshold (default: 0.3)

**Example:**

```
Search: "blood test cbc"
Matches: "Complete Blood Count" (87.3% similarity)
```

### Fallback Search (if primary fails)

```sql
SELECT
  id, code, description, rates, min_rates, max_rates,
  0.5 as sim_score
FROM medical_rates
WHERE LOWER(description) ILIKE '%' || $1 || '%'
ORDER BY LENGTH(description) ASC
LIMIT 1;
```

**Example:**

```
Search: "blood"
Matches: "Blood Test" (50% confidence - fallback)
```

## 🎯 Decision Logic

### Overpricing Detection

```
Is item overpriced?
  ├─ charged_amount > max_rates? → YES
  │
  └─ charged_amount > benchmark_price?
     └─ variance > 20%? → YES
        └─ else → NO
```

**Example:**

```
Item: "CBC"
Charged: ₱1,200
Benchmark: ₱800
Max Rate: ₱1,000

Analysis:
  ├─ ₱1,200 > ₱1,000 (max_rates) → TRUE
  └─ Variance: 50% above benchmark
     └─ Result: OVERPRICED ⚠️
```

### Duplicate Detection

```
Group charges by:
  description.toLowerCase().trim()

If count > 1:
  └─ Flag as duplicate
     ├─ occurrences: count
     └─ totalCharged: sum(amounts)
```

## 🔌 Connection Management

### Database Pool

```javascript
Pool Configuration:
  ├─ max: 20 connections
  ├─ idleTimeoutMillis: 30000
  ├─ connectionTimeoutMillis: 2000
  └─ ssl: enabled (for Alibaba RDS)

Connection Lifecycle:
  1. acquire() → ✅ Connection acquired
  2. query()   → 📊 Execute query
  3. release() → ✅ Connection released
```

### Error Handling

```
Try:
  └─ Database operation
     ├─ Success → Log details, return result
     └─ Error → Log error, use fallback logic

Fallback for items > ₱10,000:
  └─ Use 80% of charged amount as benchmark
```

## 📝 Logging Points

### Request Level

```
🚀 Analysis Started
   ├─ 📋 Request details
   ├─ 🔧 Configuration check
   └─ 📤 File upload to Dify
```

### Processing Level

```
🤖 OCR Workflow
   ├─ ✅ Upload success
   ├─ ✅ Workflow complete
   └─ 🔍 Parsing results
```

### Item Level (per charge)

```
🔍 Analyzing item
   ├─ 🔍 [DB Search] Query
   │  ├─ ✅ Connection acquired
   │  ├─ 📊 Query executed
   │  ├─ ✅ Match found
   │  └─ ✅ Connection released
   │
   └─ 💊 [Benchmark] Analysis
      ├─ 📊 Price comparison
      ├─ ⚠️ Overpriced? (if yes)
      └─ ✅ Within range (if no)
```

### Summary Level

```
📊 Final Calculations
   ├─ 💰 Total charges
   ├─ 💰 Flagged amount
   ├─ 💰 Patient responsibility
   └─ ✅ Analysis complete
```

## 🎨 Visual Status Flow

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Upload to Dify   │ ✅ File uploaded
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Run OCR          │ ✅ Workflow complete
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Parse Results    │ ✅ Parsing complete
└────┬─────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ For Each Charge:                 │
│  ┌────────────────┐              │
│  │ DB Search      │ ✅ Match found │
│  └───┬────────────┘              │
│      │                            │
│      ▼                            │
│  ┌────────────────┐              │
│  │ Benchmark      │ ⚠️ Overpriced │
│  └────────────────┘              │
└────┬───────────────────────────┘
     │
     ▼
┌──────────────────┐
│ Check Duplicates │ ⚠️ X duplicates
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Calculate Totals │ 📊 Summary ready
└────┬─────────────┘
     │
     ▼
┌──────────┐
│   DONE   │ ✅ Complete!
└──────────┘
```

## 🔍 Key Components

| Component          | Purpose                | Logs                          |
| ------------------ | ---------------------- | ----------------------------- |
| `analyze/route.ts` | Main API endpoint      | All steps, errors             |
| `medical-rates.ts` | DB queries, benchmarks | Search, matches, calculations |
| `db.ts`            | Connection management  | Connect, disconnect, errors   |
| Dify API           | OCR processing         | Upload, workflow status       |
| PostgreSQL         | Benchmark data         | Query results, connection     |

## 💡 Performance Tips

1. **Connection pooling** reduces overhead
2. **GIN indexes** speed up fuzzy search
3. **Threshold tuning** balances accuracy vs coverage
4. **Fallback search** ensures broad coverage
5. **Confidence scores** guide manual review

---

**This architecture ensures reliability, transparency, and debuggability!**
