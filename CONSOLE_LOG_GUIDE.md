# Console Log Quick Reference

## 🎨 Symbol Guide

### Status Indicators

- 🚀 **Analysis Started** - Beginning of analysis process
- ✅ **Success** - Operation completed successfully
- ⚠️ **Warning** - Non-critical issue or fallback used
- ❌ **Error** - Critical failure
- 📊 **Processing** - Data being analyzed
- 🔍 **Searching** - Database query in progress
- 💊 **Benchmark** - Price comparison analysis
- 📤 **Upload** - Sending data to Dify
- 🤖 **AI Processing** - Dify workflow running
- 🔧 **Configuration** - System settings
- 📋 **Details** - Request information
- 🔌 **Connection** - Database connectivity
- 💰 **Financial** - Money calculations
- 🔄 **Transform** - Data conversion

### Analysis Steps

```
==========================================================
🚀 Starting Medical Bill Analysis
==========================================================

Step 1: 📤 Dify Upload
Step 2: 🤖 OCR Workflow
Step 3: 🔍 Parsing Output
Step 4: 🔄 Transform & Analyze
   └─ 📊 Benchmark Analysis (for each charge)
   └─ 🔍 Duplicate Check
   └─ 💰 Final Calculations

==========================================================
✅ Analysis Complete!
==========================================================
```

## 📖 Reading the Logs

### Example: Successful Match

```
🔍 Analyzing: "Blood Test" (Charged: ₱1,500)
   ↓
🔍 [DB Search] Starting fuzzy search...
   - Search term: "Blood Test"
   - Threshold: 0.3
   ↓
✅ Database connection acquired
   ↓
📊 Running primary fuzzy search query...
   - Query returned 1 results
   ↓
✅ Match found!
   - Matched description: "Complete Blood Count"
   - Similarity score: 75.0%
   - Rate: ₱800
   - Range: ₱600 - ₱1,200
   ↓
✅ Database connection released
   ↓
💊 [Benchmark Analysis] Analyzing: "Blood Test"
   - Charged: ₱1,500
   📊 Benchmark Analysis Results:
      - Benchmark price: ₱800
      - Variance: 87.5% above estimate
      - Is overpriced: YES ⚠️
```

### Example: No Match Found

```
🔍 Analyzing: "Unknown Item" (Charged: ₱5,000)
   ↓
🔍 [DB Search] Starting fuzzy search...
   ↓
⚠️ No fuzzy match found, trying fallback search...
   ↓
❌ No matches found in database
   ↓
⚠️ No database match found for "Unknown Item"
```

### Example: Duplicate Detection

```
🔍 Checking for duplicate charges...
   ↓
⚠️ Duplicate found: "Room Charge"
   - Occurrences: 2
   - Total charged: ₱10,000
   ↓
📊 Total duplicates: 1
```

## 🎯 What to Monitor

### Health Check ✅

Look for these in order:

1. ✅ File uploaded successfully
2. ✅ Workflow completed successfully
3. ✅ OCR Parsing complete
4. ✅ Database connection acquired (for each item)
5. ✅ Database connection released (for each item)
6. ✅ Analysis Complete!

### Performance Metrics 📊

- Charges found: X
- Deductions found: X
- Database matches: X out of Y
- Duplicates: X
- Flagged amount: ₱X,XXX
- Percentage flagged: X.X%

### Red Flags 🚨

Watch for:

- ❌ Database connection failed
- ❌ Dify Upload Error
- ❌ JSON Parse Error
- ⚠️ No database match (if frequent)
- ⚠️ Using fallback logic (if frequent)

## 🔬 Debugging Tips

### Issue: Everything shows "No database match"

**Check logs for:**

```
📊 Total medical rates in database: 0  ← Problem: Empty database!
```

**Solution:** Populate your database with medical rates

---

### Issue: Low confidence scores

**Check logs for:**

```
- Similarity score: 32.5%  ← Low match quality
- Confidence: 32.5%
```

**Solution:**

- Add more variations to database descriptions
- Lower threshold (edit `medical-rates.ts`)
- Check if search terms are too specific

---

### Issue: Database connection timeout

**Check logs for:**

```
❌ Database connection failed!
   Error details: connection timeout
```

**Solution:**

- Check DB_HOST in .env.local
- Verify IP whitelist in Alibaba RDS
- Check DB_SSL=true for RDS

---

### Issue: Dify API errors

**Check logs for:**

```
❌ Dify Upload Error: 401 Unauthorized
```

**Solution:**

- Verify DIFY_API_KEY in .env.local
- Check DIFY_API_URL is correct
- Test API key manually with curl

## 📈 Advanced Monitoring

### Count Database Hits

Look through logs and count:

- "✅ Match found!" = successful matches
- "❌ No matches found" = failed matches
- Calculate hit rate: (successful / total) × 100%

### Confidence Distribution

Track confidence scores:

- 80-100%: Excellent matches
- 50-79%: Good matches
- 30-49%: Questionable matches
- <30%: Below threshold (shouldn't appear)

### Overpricing Patterns

Monitor which types of items are frequently flagged:

- Look for "⚠️ FLAGGED AS OVERPRICED"
- Note the variance percentages
- Identify common overcharged items

## 🛠️ Quick Commands

```bash
# Watch logs in real-time (Linux/Mac)
npm run dev | grep -E "🚀|✅|❌|⚠️"

# Test database connection
curl "http://localhost:3000/api/database-test?action=test-connection"

# Test single search
curl "http://localhost:3000/api/database-test?action=search&search=blood"

# Check if database is initialized
curl "http://localhost:3000/api/database-test?action=init-database"
```

## 📝 Log File Organization

Logs are organized hierarchically:

```
Main Process
├─ Step 1: Dify Upload
├─ Step 2: OCR Workflow
├─ Step 3: Parsing
└─ Step 4: Analysis
   ├─ Charge 1
   │  ├─ DB Search
   │  └─ Benchmark Analysis
   ├─ Charge 2
   │  ├─ DB Search
   │  └─ Benchmark Analysis
   ├─ Duplicate Check
   └─ Final Calculations
```

## 🎓 Best Practices

1. **Always read logs top-to-bottom** - They tell a story
2. **Look for the ✅ checkmarks** - They confirm success
3. **Don't ignore ⚠️ warnings** - They indicate degraded performance
4. **❌ errors need immediate attention** - They block functionality
5. **Monitor confidence scores** - They indicate data quality
6. **Track flagged percentages** - They show system effectiveness
