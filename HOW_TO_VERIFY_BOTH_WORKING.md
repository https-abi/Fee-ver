# ✅ How to Verify Both Dify API & Database Are Working Together

## 🎯 Goal

Confirm that **both systems** are integrated and functioning:

1. ✅ **Dify API** - Extracts items from bill images
2. ✅ **PostgreSQL Database** - Provides benchmark prices for each item

---

## 🧪 Test Plan: 3 Levels

### Level 1: Individual Component Tests ⚡ (2 minutes)

### Level 2: Integration Test 🔗 (5 minutes)

### Level 3: End-to-End Test 🎯 (3 minutes)

---

## 📋 Level 1: Test Components Individually

### ✅ Test 1A: Database Connection

```bash
curl "http://localhost:3000/api/database-test?action=test-connection"
```

**Expected Response:**

```json
{ "success": true, "message": "Database connection successful" }
```

**Expected Console Log:**

```
🔌 Testing database connection...
   - Host: pgm-gs57vm39jru7m6vygo.pgsql.singapore.rds.aliyuncs.com
   - Port: 5432
   - Database: feever_db
   - User: feever_user
   - SSL: false
✅ Database connected successfully!
   - Server time: Thu Nov 20 2025 ...
   - PostgreSQL version: PostgreSQL 17.6
```

**✅ Pass Criteria:** Returns `success: true` and shows PostgreSQL version

---

### ✅ Test 1B: Database Fuzzy Search

```bash
curl "http://localhost:3000/api/database-test?action=search&search=blood%20test"
```

**Expected Response:**

```json
{
  "searchTerm": "blood test",
  "result": {
    "found": true,
    "rate": {
      "id": 1698,
      "description": "OCCULT BLOOD TEST",
      "rates": 120,
      "min_rates": 96,
      "max_rates": 144
    },
    "confidence": 0.6111111
  }
}
```

**Expected Console Log:**

```
🔍 [DB Search] Starting fuzzy search...
   - Search term: "blood test"
   - Threshold: 0.3
   ✅ Database connection acquired
   - Cleaned term: "blood test"
   📊 Running primary fuzzy search query...
   - Query returned 1 results
   ✅ Match found!
      - Matched description: "OCCULT BLOOD TEST"
      - Similarity score: 61.1%
      - Rate: ₱120
      - Range: ₱96 - ₱144
   ✅ Database connection released
```

**✅ Pass Criteria:** Returns `found: true` with benchmark data and confidence score

---

### ✅ Test 1C: Database Multiple Items (Simulates Dify Output)

```bash
curl -X POST http://localhost:3000/api/database-test \
  -H "Content-Type: application/json" \
  -d '{"searchTerms": ["blood test", "chest x-ray", "ecg", "consultation"]}'
```

**Expected Console Log:**

```
🔍 [DB Search] Starting fuzzy search...
   - Search term: "blood test"
   ✅ Match found!

🔍 [DB Search] Starting fuzzy search...
   - Search term: "chest x-ray"
   ✅ Match found!

🔍 [DB Search] Starting fuzzy search...
   - Search term: "ecg"
   ✅ Match found!

🔍 [DB Search] Starting fuzzy search...
   - Search term: "consultation"
   ✅ Match found!
```

**✅ Pass Criteria:** Shows **4 separate database searches**, one for each term

---

## 🔗 Level 2: Integration Test (Dify + Database Together)

### Prerequisites:

- You need a **medical bill image** (any bill with itemized charges)
- Can be PNG, JPG, or JPEG format

### Steps:

#### Step 1: Open Browser

```
http://localhost:3000
```

#### Step 2: Upload Bill

1. Click upload area
2. Select your medical bill image
3. Accept terms of service
4. Click "Continue"

#### Step 3: Start Analysis

1. Click "Analyze Price and Itemized Errors" (green button)
2. Click "Select"

#### Step 4: Watch Terminal Console 👀

You should see this **exact sequence**:

```
============================================================
🚀 Starting Medical Bill Analysis
============================================================

📋 Request Details:
   - File: your_bill.jpg           ← ✅ Dify receives file
   - User: user-1732122485123

🔧 Configuration:
   - Dify URL: http://47.84.54.52/v1  ← ✅ Dify configured
   - API Key configured: true

📤 Step 1: Uploading file to Dify...
✅ File uploaded successfully - ID: file_xxxxx  ← ✅ Dify accepts file

🤖 Step 2: Running Dify OCR Workflow...
✅ Workflow completed successfully  ← ✅ Dify extracted items

🔍 Step 3: Parsing workflow output...
   📝 Using standard format (charges/deductions)
✅ OCR Parsing complete:
   - Charges found: X             ← ✅ Dify found X items
   - Deductions found: Y

🔄 Step 4: Transforming data and running analysis...
📊 Starting benchmark analysis for X charges...

🔍 Analyzing: "FIRST ITEM FROM DIFY" (Charged: ₱XXX)
                ↑
                └─ ✅ THIS CAME FROM DIFY!

🔍 [DB Search] Starting fuzzy search...
   - Search term: "FIRST ITEM FROM DIFY"  ← ✅ Database receives item
   ✅ Database connection acquired
   📊 Running primary fuzzy search query...
   - Query returned 1 results
   ✅ Match found!                         ← ✅ Database found match!
      - Matched description: "..."
      - Similarity score: XX.X%
      - Rate: ₱XXX
   ✅ Database connection released

💊 [Benchmark Analysis] Analyzing: "FIRST ITEM FROM DIFY"
   - Charged: ₱XXX
   📊 Benchmark Analysis Results:          ← ✅ Database + Dify working!
      - Benchmark price: ₱XXX
      - Variance: XX.X% above estimate
      - Is overpriced: YES/NO

  ✅ Database match found!
     - Benchmark: ₱XXX
     - Confidence: XX.X%

--- THEN REPEATS FOR EVERY ITEM ---

🔍 Analyzing: "SECOND ITEM FROM DIFY" (Charged: ₱XXX)
  🔍 [DB Search] Starting fuzzy search...
  ✅ Match found!

🔍 Analyzing: "THIRD ITEM FROM DIFY" (Charged: ₱XXX)
  🔍 [DB Search] Starting fuzzy search...
  ✅ Match found!

... continues for ALL items ...

📊 Final Calculations:
   - Total Charges: ₱XX,XXX
   - Flagged Amount: ₱X,XXX
   - Percentage Flagged: XX.X%

============================================================
✅ Analysis Complete!
============================================================
```

---

## ✅ Pass/Fail Checklist

### ✅ Dify API is Working:

- [ ] `✅ File uploaded successfully - ID: file_xxxxx`
- [ ] `✅ Workflow completed successfully`
- [ ] `✅ OCR Parsing complete: Charges found: X`
- [ ] Shows item descriptions extracted from your bill

### ✅ Database is Working:

- [ ] `🔍 [DB Search] Starting fuzzy search...` appears for EACH item
- [ ] `✅ Database connection acquired` for each search
- [ ] `✅ Match found!` with similarity scores
- [ ] `✅ Database connection released` for each search
- [ ] Shows benchmark prices and ranges

### ✅ Integration is Working (Both Together):

- [ ] Number of "Analyzing:" matches "Charges found:"
- [ ] Each item from Dify gets its own database search
- [ ] Confidence scores are displayed (30-100%)
- [ ] Overpriced items are flagged with reasons
- [ ] Final summary shows flagged amounts

---

## 🎯 Level 3: Visual Verification

### Check the Analysis Screen:

After analysis completes, you should see in the browser:

#### 1. **Summary Cards**

```
Total Charges: ₱XX,XXX
Flagged Amount: ₱X,XXX  ← From database benchmarks
```

#### 2. **Itemized Bill Breakdown**

Each item shows:

- Item description (from Dify)
- Charged amount (from Dify)
- Benchmark price (from Database) ← **This proves both working!**
- "Supposed payable: ₱XXX" (from Database)

#### 3. **Issues Found Section**

**Above Average Prices:**

- Shows items flagged by database comparison
- Shows variance % (database calculation)
- Shows confidence scores (database match quality)
- Shows FMV Est. and price ranges (from database)

---

## 🚨 Troubleshooting

### ❌ Problem: Dify Not Working

**Symptoms:**

```
❌ Dify Upload Error: 401 Unauthorized
```

**Fix:**

1. Check `.env.local` has correct `DIFY_API_KEY`
2. Verify `DIFY_API_URL` is accessible
3. Test manually: `curl -H "Authorization: Bearer YOUR_KEY" http://47.84.54.52/v1`

---

### ❌ Problem: Database Not Working

**Symptoms:**

```
❌ Database connection failed!
⚠️  No database match found for "..."  (for ALL items)
```

**Fix:**

1. Run: `curl "http://localhost:3000/api/database-test?action=test-connection"`
2. Check `.env.local` database credentials
3. Verify `DB_SSL=false` (not true)
4. Check database has data: Should show `Total medical rates in database: 9776`

---

### ❌ Problem: Dify Works but Database Doesn't Connect

**Symptoms:**

```
✅ File uploaded successfully
✅ Workflow completed successfully
✅ OCR Parsing complete: Charges found: 15

🔍 Analyzing: "Item 1"
  ❌ Error getting benchmark for "Item 1": connection timeout
  ⚠️  No database match found
```

**Fix:**

- Database connection is failing per item
- Check if database allows connections from your IP
- Verify database credentials in `.env.local`

---

### ❌ Problem: Database Works but Items Not Found

**Symptoms:**

```
✅ Database connected successfully
📊 Total medical rates in database: 9776

🔍 Analyzing: "Some Item"
  🔍 [DB Search] Starting fuzzy search...
  ⚠️  No fuzzy match found, trying fallback search...
  ❌ No matches found in database
```

**This is NORMAL if:**

- Item description is very unique/uncommon
- Database doesn't have that specific procedure
- Fuzzy matching threshold too strict

**Still Working:** Database is queried, just no match found

---

## 📊 Success Metrics

### Perfect Integration (100%):

```
✅ Dify extracts: 15 items
✅ Database queries: 15 searches (one per item)
✅ Database matches: 12 found, 3 not found (80% match rate is GOOD)
✅ Overpriced items: 3 flagged based on database benchmarks
✅ Analysis complete: All data shown to user
```

### What "Both Working" Looks Like:

**In Console:**

- See Dify file upload success
- See Dify OCR completion
- See database searches for EACH item Dify extracted
- See confidence scores from database

**In Browser:**

- See pie chart with flagged items
- See "Above Average Prices" section with database benchmarks
- See confidence scores on each flagged item
- See FMV Est. (Fair Market Value from database)

---

## 🎉 Quick Validation Script

Save this as `test-integration.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Fee-ver Integration..."
echo ""

echo "1️⃣  Testing Database Connection..."
DB_TEST=$(curl -s "http://localhost:3000/api/database-test?action=test-connection")
if echo "$DB_TEST" | grep -q '"success":true'; then
    echo "   ✅ Database Connected"
else
    echo "   ❌ Database Failed"
    exit 1
fi

echo ""
echo "2️⃣  Testing Database Search..."
SEARCH_TEST=$(curl -s "http://localhost:3000/api/database-test?action=search&search=blood%20test")
if echo "$SEARCH_TEST" | grep -q '"found":true'; then
    echo "   ✅ Database Search Working"
else
    echo "   ❌ Database Search Failed"
    exit 1
fi

echo ""
echo "3️⃣  Testing Dify Configuration..."
if grep -q "DIFY_API_KEY" .env.local && grep -q "DIFY_API_URL" .env.local; then
    echo "   ✅ Dify Configured"
else
    echo "   ❌ Dify Not Configured"
    exit 1
fi

echo ""
echo "🎉 All Systems Ready!"
echo "📋 Next: Upload a bill at http://localhost:3000"
```

Run: `bash test-integration.sh`

---

## 💡 Summary: How to Know Both Are Working

### ✅ Dify is Working When:

1. File uploads successfully
2. Workflow completes
3. Items are extracted with descriptions and prices

### ✅ Database is Working When:

1. Connection test passes
2. Search returns results
3. Each item triggers a database query

### ✅ **BOTH** are Working Together When:

1. ✅ Dify extracts N items
2. ✅ You see N database searches in console
3. ✅ Matches show confidence scores from database
4. ✅ Overpriced items are flagged using database benchmarks
5. ✅ Analysis screen shows "FMV Est." prices from database

**The key indicator: Count the items Dify finds, then count the database searches. They should match!**

---

## 📚 Quick Reference

| Component        | Test Endpoint                                 | Expected Log                        |
| ---------------- | --------------------------------------------- | ----------------------------------- |
| Database         | `/api/database-test?action=test-connection`   | `✅ Database connected`             |
| DB Search        | `/api/database-test?action=search&search=...` | `✅ Match found!`                   |
| Full Integration | Upload bill via UI                            | `🔍 Analyzing: "..."` for each item |
| Dify API         | (tested automatically during upload)          | `✅ File uploaded`                  |
| Both Together    | Upload bill + watch console                   | Database search per Dify item       |

**Now go test it! Upload a bill and watch both systems work together!** 🚀✨
