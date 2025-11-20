# Database Integration Guide

This application integrates with an Alibaba RDS PostgreSQL database containing medical rates for benchmark analysis.

## Database Schema

The application expects a table named `medical_rates` with the following structure:

```sql
CREATE TABLE medical_rates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255), -- Currently NULL, can be populated later
    description TEXT NOT NULL,
    rates NUMERIC(10,2) NOT NULL, -- Standard rate
    min_rates DOUBLE PRECISION, -- Minimum acceptable rate
    max_rates DOUBLE PRECISION-- Maximum acceptable rate
);
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with your database credentials:

```env
# Alibaba RDS PostgreSQL Configuration
DB_HOST=your-rds-instance.rds.ap-southeast-1.rds.aliyuncs.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=true

# Dify API Configuration (existing)
DIFY_API_KEY=your_dify_api_key
DIFY_API_URL=https://api.dify.ai/v1
```

### 2. Database Initialization

The application uses PostgreSQL's fuzzy search capabilities. Initialize the required extensions by calling:

```bash
# Test connection and initialize database
curl "http://localhost:3000/api/database-test?action=test-connection"
curl "http://localhost:3000/api/database-test?action=init-database"
```

This will:

- Enable the `pg_trgm` extension for trigram fuzzy search
- Create GIN indexes for optimal search performance

### 3. Testing the Integration

You can test the fuzzy search functionality:

```bash
# Single search test
curl "http://localhost:3000/api/database-test?action=search&search=blood%20test"

# Batch search test
curl -X POST http://localhost:3000/api/database-test \
  -H "Content-Type: application/json" \
  -d '{"searchTerms": ["blood test", "x-ray", "consultation"]}'
```

## How It Works

### Fuzzy Search Algorithm

The application uses a two-tier search approach:

1. **Primary Search**: PostgreSQL trigram similarity with configurable threshold

   - Uses `similarity()` function with pg_trgm extension
   - Default threshold: 0.3 (30% similarity)
   - Returns results ordered by similarity score

2. **Fallback Search**: Partial text matching using ILIKE
   - Activates if fuzzy search returns no results
   - Uses pattern matching for broader coverage

### Benchmark Analysis

For each medical item in a bill:

1. **Search**: Query the database using the item description
2. **Match**: Find the best matching rate entry
3. **Analyze**: Compare charged amount vs. benchmark rates
4. **Flag**: Items are flagged as overpriced if:
   - Charged amount > `max_rates`, OR
   - Charged amount > `rates` by more than 20%

### Database Performance

- GIN indexes on description field for fast fuzzy search
- Connection pooling with 20 concurrent connections
- Automatic connection management and cleanup

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Check if your database allows connections from your server IP
2. **SSL Errors**: Ensure `DB_SSL=true` for Alibaba RDS instances
3. **Extension Not Found**: Run the database initialization endpoint
4. **Poor Search Results**: Consider adjusting the similarity threshold in the code

### Sample Data Structure

Example data for your `medical_rates` table:

```sql
INSERT INTO medical_rates (description, rates, min_rates, max_rates) VALUES
('Blood Chemistry Panel', 2500.00, 2000.00, 3500.00),
('Complete Blood Count (CBC)', 800.00, 600.00, 1200.00),
('Chest X-Ray', 1500.00, 1200.00, 2000.00),
('ECG/EKG', 1200.00, 900.00, 1800.00),
('Consultation Fee - Internal Medicine', 2000.00, 1500.00, 3000.00);
```

### Monitoring

Check logs for:

- Database connection status
- Search confidence scores
- Failed benchmark lookups
- Performance metrics
