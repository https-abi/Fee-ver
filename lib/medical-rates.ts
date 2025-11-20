import pool from "./db";

interface MedicalRate {
  id: number;
  code: string | null;
  description: string;
  rates: number;
  min_rates: number;
  max_rates: number;
}

interface BenchmarkResult {
  found: boolean;
  rate?: MedicalRate;
  confidence?: number;
}

/**
 * Search for medical rates using fuzzy matching on the description field
 * @param searchTerm - The medical item description to search for
 * @param threshold - Similarity threshold (0.1 to 1.0, higher = more strict)
 * @returns Promise<BenchmarkResult>
 */
export async function searchMedicalRates(
  searchTerm: string,
  threshold: number = 0.3
): Promise<BenchmarkResult> {
  console.log(`\n🔍 [DB Search] Starting fuzzy search...`);
  console.log(`   - Search term: "${searchTerm}"`);
  console.log(`   - Threshold: ${threshold}`);

  try {
    const client = await pool.connect();
    console.log(`   ✅ Database connection acquired`);

    // Clean and prepare search term
    const cleanSearchTerm = searchTerm.trim().toLowerCase();
    console.log(`   - Cleaned term: "${cleanSearchTerm}"`);

    try {
      console.log(`   📊 Running primary fuzzy search query...`);
      const query = `
        SELECT 
          id, 
          code, 
          description, 
          rates, 
          min_rates, 
          max_rates,
          similarity(LOWER(description), $1) as sim_score
        FROM medical_rates 
        WHERE similarity(LOWER(description), $1) > $2
        ORDER BY similarity(LOWER(description), $1) DESC 
        LIMIT 1;
      `;

      const result = await client.query(query, [cleanSearchTerm, threshold]);
      console.log(`   - Query returned ${result.rows.length} results`);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log(`   ✅ Match found!`);
        console.log(`      - Matched description: "${row.description}"`);
        console.log(
          `      - Similarity score: ${(row.sim_score * 100).toFixed(1)}%`
        );
        console.log(`      - Rate: ₱${parseFloat(row.rates).toLocaleString()}`);

        return {
          found: true,
          rate: {
            id: row.id,
            code: row.code,
            description: row.description,
            rates: parseFloat(row.rates) || 0,
            min_rates: parseFloat(row.min_rates) || 0,
            max_rates: parseFloat(row.max_rates) || 0,
          },
          confidence: row.sim_score,
        };
      }

      // Fallback: Try partial matching if fuzzy search fails
      console.log(`   ⚠️  No fuzzy match found, trying fallback search...`);
      const fallbackQuery = `
        SELECT 
          id, 
          code, 
          description, 
          rates, 
          min_rates, 
          max_rates,
          0.5 as sim_score
        FROM medical_rates 
        WHERE LOWER(description) ILIKE '%' || $1 || '%'
        ORDER BY LENGTH(description) ASC
        LIMIT 1;
      `;

      const fallbackResult = await client.query(fallbackQuery, [
        cleanSearchTerm,
      ]);
      console.log(
        `   - Fallback query returned ${fallbackResult.rows.length} results`
      );

      if (fallbackResult.rows.length > 0) {
        const row = fallbackResult.rows[0];
        console.log(`   ✅ Fallback match found!`);
        console.log(`      - Matched description: "${row.description}"`);
        console.log(`      - Confidence: 50% (fallback)`);

        return {
          found: true,
          rate: {
            id: row.id,
            code: row.code,
            description: row.description,
            rates: parseFloat(row.rates) || 0,
            min_rates: parseFloat(row.min_rates) || 0,
            max_rates: parseFloat(row.max_rates) || 0,
          },
          confidence: 0.5,
        };
      }

      console.log(`   ❌ No matches found in database`);
      return { found: false };
    } finally {
      client.release();
      console.log(`   ✅ Database connection released`);
    }
  } catch (error) {
    console.error(`   ❌ Database search error:`, error);
    return { found: false };
  }
}

/**
 * Get benchmark price for a medical item
 * @param itemDescription - Description of the medical item
 * @param chargedAmount - Amount being charged (for variance calculation)
 * @returns Promise with benchmark analysis
 */
export async function getBenchmarkAnalysis(
  itemDescription: string,
  chargedAmount: number
): Promise<{
  hasBenchmark: boolean;
  benchmarkPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  variance?: string;
  isOverpriced?: boolean;
  confidence?: number;
}> {
  console.log(`\n💊 [Benchmark Analysis] Analyzing: "${itemDescription}"`);
  console.log(`   - Charged: ₱${chargedAmount.toLocaleString()}`);

  const result = await searchMedicalRates(itemDescription);

  if (!result.found || !result.rate) {
    console.log(`   ⚠️  No benchmark available for this item`);
    return { hasBenchmark: false };
  }

  const rate = result.rate;
  const benchmarkPrice = rate.rates;
  const minPrice = rate.min_rates;
  const maxPrice = rate.max_rates;

  // Calculate variance
  const variance = ((chargedAmount - benchmarkPrice) / benchmarkPrice) * 100;
  const varianceText =
    variance > 0
      ? `${variance.toFixed(1)}% above estimate`
      : `${Math.abs(variance).toFixed(1)}% below estimate`;

  // Check if overpriced
  const isOverpriced =
    chargedAmount > maxPrice ||
    (chargedAmount > benchmarkPrice && variance > 20);

  return {
    hasBenchmark: true,
    benchmarkPrice,
    minPrice,
    maxPrice,
    variance: varianceText,
    isOverpriced,
    confidence: result.confidence,
  };
}

/**
 * Initialize database extensions (run this once during setup)
 */
export async function initializeDatabase() {
  console.log("\n🔧 Initializing database extensions...");

  try {
    const client = await pool.connect();

    try {
      console.log("   📦 Enabling pg_trgm extension...");
      await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
      console.log("   ✅ pg_trgm extension enabled");

      console.log("   📊 Creating GIN index on medical_rates.description...");
      await client.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_rates_description_gin 
        ON medical_rates USING gin (description gin_trgm_ops);
      `);
      console.log("   ✅ GIN index created");

      const testQuery = await client.query(`
        SELECT COUNT(*) as total_rates FROM medical_rates;
      `);
      console.log(
        `   📊 Total medical rates in database: ${testQuery.rows[0].total_rates}`
      );

      console.log("✅ Database initialized successfully");
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Error initializing database:");
    console.error(error);
    return false;
  }
}