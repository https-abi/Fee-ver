import { Pool } from "pg";

// Database configuration for Alibaba RDS PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export async function testConnection() {
  console.log("\n🔌 Testing database connection...");
  console.log(`   - Host: ${process.env.DB_HOST}`);
  console.log(`   - Port: ${process.env.DB_PORT}`);
  console.log(`   - Database: ${process.env.DB_NAME}`);
  console.log(`   - User: ${process.env.DB_USER}`);
  console.log(`   - SSL: ${process.env.DB_SSL}`);

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT NOW() as current_time, version() as pg_version"
    );
    console.log("✅ Database connected successfully!");
    console.log(`   - Server time: ${result.rows[0].current_time}`);
    console.log(
      `   - PostgreSQL version: ${result.rows[0].pg_version.split(",")[0]}`
    );
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("   Error details:", error);
    return false;
  }
}

export default pool;
