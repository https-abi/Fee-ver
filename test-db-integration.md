# Testing Database & Dify Integration

This document explains how to test that the database fuzzy search and Dify API are working together properly.

## Console Log Legend

When you run an analysis, you should see these console logs:

### 1. **Analysis Start** 🚀

```
============================================================
🚀 Starting Medical Bill Analysis
============================================================

📋 Request Details:
   - File: medical_bill.jpg
   - User: user-1234567890
   - Has custom prompt: true

🔧 Configuration:
   - Dify URL: http://47.84.54.52/v1
   - API Key configured: true
```

### 2. **Dify Upload** 📤

```
📤 Step 1: Uploading file to Dify...
✅ File uploaded successfully - ID: abc123xyz
```

### 3. **OCR Processing** 🤖

```
🤖 Step 2: Running Dify OCR Workflow...
✅ Workflow completed successfully
```

### 4. **Parsing Results** 🔍

```
🔍 Step 3: Parsing workflow output...
   📝 Using standard format (charges/deductions)
✅ OCR Parsing complete:
   - Charges found: 15
   - Deductions found: 3
```

### 5. **Database Benchmark Analysis** 📊

```
🔄 Step 4: Transforming data and running analysis...
📊 Starting benchmark analysis for 15 charges...

🔍 Analyzing: "Blood Chemistry Panel" (Charged: ₱3,500)

🔍 [DB Search] Starting fuzzy search...
   - Search term: "Blood Chemistry Panel"
   - Threshold: 0.3
   ✅ Database connection acquired
   - Cleaned term: "blood chemistry panel"
   📊 Running primary fuzzy search query...
   - Query returned 1 results
   ✅ Match found!
      - Matched description: "Blood Chemistry Panel"
      - Similarity score: 100.0%
      - Rate: ₱2,500
      - Range: ₱2,000 - ₱3,000
   ✅ Database connection released

💊 [Benchmark Analysis] Analyzing: "Blood Chemistry Panel"
   - Charged: ₱3,500
   📊 Benchmark Analysis Results:
      - Benchmark price: ₱2,500
      - Min price: ₱2,000
      - Max price: ₱3,000
      - Variance: 40.0% above estimate
      - Is overpriced: YES ⚠️
      - Confidence: 100.0%

  ✅ Database match found!
     - Benchmark: ₱2,500
     - Range: ₱2,000 - ₱3,000
     - Confidence: 100.0%
     - Variance: 40.0% above estimate
     ⚠️  FLAGGED AS OVERPRICED
     - Overcharged amount: ₱500
```

### 6. **No Database Match** ⚠️

```
🔍 Analyzing: "Custom Procedure XYZ" (Charged: ₱5,000)

🔍 [DB Search] Starting fuzzy search...
   - Search term: "Custom Procedure XYZ"
   ⚠️  No fuzzy match found, trying fallback search...
   - Fallback query returned 0 results
   ❌ No matches found in database
   ✅ Database connection released

  ⚠️  No database match found for "Custom Procedure XYZ"
```

### 7. **Duplicate Detection** 🔍

```
🔍 Checking for duplicate charges...
   ⚠️  Duplicate found: "ECG/EKG"
      - Occurrences: 2
      - Total charged: ₱2,400
   📊 Total duplicates: 1
```

### 8. **Final Summary** 📊

```
📊 Final Calculations:
   - Total Charges: ₱45,000
   - HMO Covered: ₱20,000
   - Patient Responsibility: ₱25,000
   - Flagged Amount: ₱5,500
   - Percentage Flagged: 12.2%

============================================================
✅ Analysis Complete!
============================================================
```

## Testing Steps

### Step 1: Test Database Connection

```bash
curl "http://localhost:3000/api/database-test?action=test-connection"
```

**Expected Output:**

```
🔌 Testing database connection...
   - Host: pgm-gs57vm39jru7m6vygo.pgsql.singapore.rds.aliyuncs.com
   - Port: 5432
   - Database: feever_db
   - User: feever_user
   - SSL: true
✅ Database connected successfully!
   - Server time: 2025-11-20 10:30:45
   - PostgreSQL version: PostgreSQL 14.x
```

### Step 2: Initialize Database

```bash
curl "http://localhost:3000/api/database-test?action=init-database"
```

**Expected Output:**

```
🔧 Initializing database extensions...
   📦 Enabling pg_trgm extension...
   ✅ pg_trgm extension enabled
   📊 Creating GIN index on medical_rates.description...
   ✅ GIN index created
   📊 Total medical rates in database: 150
✅ Database initialized successfully
```

### Step 3: Test Fuzzy Search

```bash
curl "http://localhost:3000/api/database-test?action=search&search=blood%20test"
```

### Step 4: Upload and Analyze a Bill

1. Go to http://localhost:3000
2. Upload a medical bill image
3. Select "Analyze Price and Itemized Errors"
4. Check your terminal/console logs for the detailed output

## What to Look For

### ✅ **Successful Integration Signs:**

1. All database connections acquire and release properly
2. Fuzzy search returns matches with confidence scores
3. Benchmark analysis flags overpriced items correctly
4. Final calculations show flagged amounts and percentages
5. No database connection errors

### ⚠️ **Potential Issues:**

1. **"Database connection failed"** - Check .env.local credentials
2. **"pg_trgm extension not found"** - Run init-database endpoint
3. **"No matches found in database"** - Database may be empty or search term too different
4. **"Dify Upload Failed"** - Check DIFY_API_KEY and DIFY_API_URL

## Understanding Confidence Scores

- **100%** = Exact match
- **70-99%** = Very similar (trigram match)
- **50%** = Fallback ILIKE match
- **<50%** = Low confidence, may need manual review

## Performance Monitoring

Watch for these performance indicators in logs:

- Database query response time
- Number of successful matches vs. fallbacks
- Percentage of items flagged as overpriced
- Duplicate detection accuracy
