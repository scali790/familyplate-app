# Database Migration: Personalization System

## Overview

This migration adds the `dishVotes` table and extends the `userPreferences` table to support taste signals and personalization features.

**Migration Version:** `v2_personalization`
**Date:** 2025-12-29
**Author:** EasyPlate Team

---

## Migration Summary

### Changes
1. **Create new table:** `dish_votes` (7 columns, 3 indexes)
2. **Alter existing table:** `user_preferences` (+4 columns)

### Impact
- **Backward compatible:** ✅ Yes
- **Data loss risk:** ✅ None
- **Downtime required:** ✅ No
- **Rollback available:** ✅ Yes

---

## Step 1: Update Drizzle Schema

### File: `/home/ubuntu/easyplate/drizzle/schema.ts`

Add the following to the schema file:

```typescript
/**
 * Dish Votes Table
 * Stores individual user taste signals for personalization
 */
export const dishVotes = mysqlTable("dish_votes", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  dishName: varchar("dish_name", { length: 255 }).notNull(),
  liked: int("liked").notNull(), // 1 = thumbs up, 0 = thumbs down
  context: varchar("context", { length: 50 }).default("meal_plan").notNull(),
  metadata: text("metadata"), // JSON: optional extra data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DishVote = typeof dishVotes.$inferSelect;
export type NewDishVote = typeof dishVotes.$inferInsert;
```

Update the `userPreferences` table definition to add new fields:

```typescript
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  
  // Basic preferences
  familySize: int("family_size").notNull().default(2),
  cuisines: text("cuisines"),
  flavors: text("flavors"),
  dietaryRestrictions: text("dietary_restrictions"),
  
  // Localization (NEW FIELDS)
  language: varchar("language", { length: 5 }).default("en").notNull(),
  country: varchar("country", { length: 3 }).default("UAE").notNull(),
  units: varchar("units", { length: 10 }).default("metric").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Food preference frequencies
  meatFrequency: int("meat_frequency").notNull().default(3),
  chickenFrequency: int("chicken_frequency").notNull().default(3),
  fishFrequency: int("fish_frequency").notNull().default(3),
  vegetarianFrequency: int("vegetarian_frequency").notNull().default(2),
  veganFrequency: int("vegan_frequency").notNull().default(1),
  spicyFrequency: int("spicy_frequency").notNull().default(2),
  kidFriendlyFrequency: int("kid_friendly_frequency").notNull().default(2),
  healthyFrequency: int("healthy_frequency").notNull().default(3),
  
  // Derived taste profile (NEW FIELD)
  tasteProfile: text("taste_profile"), // JSON
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
```

---

## Step 2: Generate Migration with Drizzle Kit

### Command

```bash
cd /home/ubuntu/easyplate
pnpm drizzle-kit generate
```

This will generate a migration file in `/home/ubuntu/easyplate/drizzle/migrations/`.

### Expected Output

```
Drizzle Kit: Generating migration...
✓ Migration generated successfully
  - 0001_add_personalization_tables.sql
```

---

## Step 3: Raw SQL Migration Script

If you prefer to run SQL directly, use this script:

### File: `migration_v2_personalization.sql`

```sql
-- ============================================================
-- Migration: v2_personalization
-- Description: Add dish_votes table and extend user_preferences
-- Date: 2025-12-29
-- ============================================================

-- Start transaction for atomic migration
START TRANSACTION;

-- ============================================================
-- Part 1: Create dish_votes table
-- ============================================================

CREATE TABLE IF NOT EXISTS dish_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dish_name VARCHAR(255) NOT NULL,
  liked INT NOT NULL COMMENT '1 = thumbs up, 0 = thumbs down',
  context VARCHAR(50) NOT NULL DEFAULT 'meal_plan' COMMENT 'onboarding, meal_plan, regenerate',
  metadata TEXT NULL COMMENT 'JSON with cuisine, protein, spice_level, etc.',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_dish_votes_user_id (user_id),
  INDEX idx_dish_votes_dish_name (dish_name),
  INDEX idx_dish_votes_user_dish (user_id, dish_name),
  INDEX idx_dish_votes_context (context)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores individual user taste signals for personalization';

-- ============================================================
-- Part 2: Extend user_preferences table
-- ============================================================

-- Check if columns already exist (idempotent migration)
SET @language_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_preferences' 
    AND COLUMN_NAME = 'language'
);

SET @units_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_preferences' 
    AND COLUMN_NAME = 'units'
);

SET @currency_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_preferences' 
    AND COLUMN_NAME = 'currency'
);

SET @taste_profile_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_preferences' 
    AND COLUMN_NAME = 'taste_profile'
);

-- Add language column (after dietary_restrictions)
SET @sql_language = IF(
  @language_exists = 0,
  'ALTER TABLE user_preferences ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT "en" COMMENT "ISO 639-1 language code" AFTER dietary_restrictions',
  'SELECT "Column language already exists" AS message'
);
PREPARE stmt FROM @sql_language;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add units column (after country)
SET @sql_units = IF(
  @units_exists = 0,
  'ALTER TABLE user_preferences ADD COLUMN units VARCHAR(10) NOT NULL DEFAULT "metric" COMMENT "metric or imperial" AFTER country',
  'SELECT "Column units already exists" AS message'
);
PREPARE stmt FROM @sql_units;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add currency column (after units)
SET @sql_currency = IF(
  @currency_exists = 0,
  'ALTER TABLE user_preferences ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT "USD" COMMENT "ISO 4217 currency code" AFTER units',
  'SELECT "Column currency already exists" AS message'
);
PREPARE stmt FROM @sql_currency;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add taste_profile column (after healthy_frequency)
SET @sql_taste_profile = IF(
  @taste_profile_exists = 0,
  'ALTER TABLE user_preferences ADD COLUMN taste_profile TEXT NULL COMMENT "JSON with derived preference weights" AFTER healthy_frequency',
  'SELECT "Column taste_profile already exists" AS message'
);
PREPARE stmt FROM @sql_taste_profile;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- Part 3: Set default values based on country
-- ============================================================

-- Update units and currency based on existing country values
UPDATE user_preferences 
SET 
  units = CASE 
    WHEN country IN ('US', 'GB', 'LR', 'MM') THEN 'imperial'
    ELSE 'metric'
  END,
  currency = CASE 
    WHEN country = 'US' THEN 'USD'
    WHEN country = 'GB' THEN 'GBP'
    WHEN country = 'AE' THEN 'AED'
    WHEN country IN ('DE', 'FR', 'IT', 'ES', 'NL', 'BE') THEN 'EUR'
    WHEN country = 'JP' THEN 'JPY'
    WHEN country = 'CN' THEN 'CNY'
    WHEN country = 'IN' THEN 'INR'
    WHEN country = 'AU' THEN 'AUD'
    WHEN country = 'CA' THEN 'CAD'
    ELSE 'USD'
  END
WHERE units = 'metric' AND currency = 'USD'; -- Only update defaults

-- ============================================================
-- Part 4: Create migration tracking table (optional)
-- ============================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Record this migration
INSERT INTO schema_migrations (version, description) 
VALUES ('v2_personalization', 'Add dish_votes table and extend user_preferences for personalization')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

-- Commit transaction
COMMIT;

-- ============================================================
-- Verification queries
-- ============================================================

-- Verify dish_votes table was created
SELECT 
  TABLE_NAME, 
  TABLE_ROWS, 
  CREATE_TIME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'dish_votes';

-- Verify new columns in user_preferences
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_DEFAULT, 
  IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user_preferences' 
  AND COLUMN_NAME IN ('language', 'units', 'currency', 'taste_profile');

-- Count existing user preferences (should be unchanged)
SELECT COUNT(*) AS user_count FROM user_preferences;

SELECT 'Migration v2_personalization completed successfully!' AS status;
```

---

## Step 4: Apply Migration

### Option A: Using Drizzle Kit (Recommended)

```bash
cd /home/ubuntu/easyplate
pnpm drizzle-kit migrate
```

### Option B: Using Raw SQL

```bash
# Connect to database
mysql -h <host> -u <user> -p <database> < migration_v2_personalization.sql

# Or using environment variable
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < migration_v2_personalization.sql
```

### Option C: Using Node.js Script

Create `/home/ubuntu/easyplate/scripts/migrate.ts`:

```typescript
import { getDb } from "../server/db";
import fs from "fs";
import path from "path";

async function runMigration() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "../migration_v2_personalization.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  try {
    console.log("Running migration v2_personalization...");
    
    // Split by semicolon and execute each statement
    const statements = sql.split(";").filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      await db.execute(statement);
    }
    
    console.log("✓ Migration completed successfully!");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
```

Run with:

```bash
cd /home/ubuntu/easyplate
pnpm tsx scripts/migrate.ts
```

---

## Step 5: Verification

### Verify Tables Exist

```sql
SHOW TABLES LIKE 'dish_votes';
SHOW TABLES LIKE 'user_preferences';
```

### Verify dish_votes Schema

```sql
DESCRIBE dish_votes;
```

Expected output:

```
+------------+--------------+------+-----+-------------------+
| Field      | Type         | Null | Key | Default           |
+------------+--------------+------+-----+-------------------+
| id         | int          | NO   | PRI | NULL              |
| user_id    | int          | NO   | MUL | NULL              |
| dish_name  | varchar(255) | NO   | MUL | NULL              |
| liked      | int          | NO   |     | NULL              |
| context    | varchar(50)  | NO   | MUL | meal_plan         |
| metadata   | text         | YES  |     | NULL              |
| created_at | timestamp    | NO   |     | CURRENT_TIMESTAMP |
+------------+--------------+------+-----+-------------------+
```

### Verify user_preferences New Columns

```sql
DESCRIBE user_preferences;
```

Look for these new columns:

```
+---------------+-------------+------+-----+---------+
| Field         | Type        | Null | Key | Default |
+---------------+-------------+------+-----+---------+
| language      | varchar(5)  | NO   |     | en      |
| units         | varchar(10) | NO   |     | metric  |
| currency      | varchar(3)  | NO   |     | USD     |
| taste_profile | text        | YES  |     | NULL    |
+---------------+-------------+------+-----+---------+
```

### Verify Indexes

```sql
SHOW INDEX FROM dish_votes;
```

Expected indexes:
- `PRIMARY` on `id`
- `idx_dish_votes_user_id` on `user_id`
- `idx_dish_votes_dish_name` on `dish_name`
- `idx_dish_votes_user_dish` on `user_id, dish_name`

### Test Insert

```sql
-- Test inserting a dish vote
INSERT INTO dish_votes (user_id, dish_name, liked, context, metadata) 
VALUES (1, 'Test Pizza', 1, 'onboarding', '{"cuisine":"Italian"}');

-- Verify insert
SELECT * FROM dish_votes WHERE dish_name = 'Test Pizza';

-- Clean up test data
DELETE FROM dish_votes WHERE dish_name = 'Test Pizza';
```

---

## Step 6: Rollback Procedure

If you need to undo this migration:

### Rollback SQL Script

```sql
-- ============================================================
-- Rollback: v2_personalization
-- WARNING: This will delete all dish votes data!
-- ============================================================

START TRANSACTION;

-- Drop dish_votes table
DROP TABLE IF EXISTS dish_votes;

-- Remove new columns from user_preferences
ALTER TABLE user_preferences 
  DROP COLUMN IF EXISTS taste_profile,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS units,
  DROP COLUMN IF EXISTS language;

-- Remove migration record
DELETE FROM schema_migrations WHERE version = 'v2_personalization';

COMMIT;

SELECT 'Rollback v2_personalization completed!' AS status;
```

### Rollback Command

```bash
mysql -h <host> -u <user> -p <database> < rollback_v2_personalization.sql
```

---

## Step 7: Post-Migration Tasks

### 1. Update TypeScript Types

Ensure your app imports the new types:

```typescript
import { dishVotes, type DishVote, type NewDishVote } from "../drizzle/schema";
```

### 2. Update API Routers

Add the new endpoints to `/home/ubuntu/easyplate/server/routers.ts` (see API_SPECIFICATION_DISH_VOTES.md).

### 3. Update Frontend

- Add language/country detection to onboarding
- Create "Confirm Your Style" taste calibration screen
- Update meal voting to save dish votes

### 4. Test End-to-End

- [ ] Create new user account
- [ ] Complete onboarding with taste calibration
- [ ] Verify dish votes are saved
- [ ] Generate meal plan
- [ ] Vote on meals
- [ ] Verify taste profile is computed
- [ ] Regenerate meal and verify personalization

---

## Troubleshooting

### Error: "Table 'dish_votes' already exists"

**Solution:** Migration is idempotent. This is safe to ignore, or drop the table and re-run.

### Error: "Duplicate column name 'language'"

**Solution:** Column already exists. The migration script checks for this and skips if present.

### Error: "Database not available"

**Solution:** Check `DATABASE_URL` environment variable is set correctly.

### Error: "Access denied"

**Solution:** Ensure database user has `CREATE`, `ALTER`, and `INSERT` privileges.

---

## Performance Considerations

### Estimated Migration Time

- **Small database** (<1000 users): ~1-2 seconds
- **Medium database** (1000-10000 users): ~5-10 seconds
- **Large database** (>10000 users): ~30-60 seconds

### Locking Behavior

- `CREATE TABLE`: No lock on existing tables
- `ALTER TABLE`: Brief metadata lock on `user_preferences` (typically <1 second)
- **Downtime:** None expected for normal-sized databases

### Index Creation

Indexes are created during table creation, no additional time needed.

---

## Checklist

- [ ] Backup database before migration
- [ ] Update `/home/ubuntu/easyplate/drizzle/schema.ts`
- [ ] Generate migration with `pnpm drizzle-kit generate`
- [ ] Review generated migration SQL
- [ ] Apply migration with `pnpm drizzle-kit migrate`
- [ ] Verify tables and columns exist
- [ ] Verify indexes are created
- [ ] Test insert/select on new tables
- [ ] Update API routers with new endpoints
- [ ] Update frontend with new features
- [ ] Test end-to-end flow
- [ ] Monitor for errors in production

---

## Summary

**Migration:** v2_personalization
**Tables Created:** 1 (dish_votes)
**Columns Added:** 4 (language, units, currency, taste_profile)
**Indexes Created:** 4
**Backward Compatible:** ✅ Yes
**Rollback Available:** ✅ Yes
**Estimated Time:** <1 minute
