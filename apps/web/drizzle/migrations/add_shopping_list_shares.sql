-- Add shopping_list_shares table for shareable shopping lists (MVP)
CREATE TABLE IF NOT EXISTS "shopping_list_shares" (
  "id" SERIAL PRIMARY KEY,
  "meal_plan_id" INTEGER NOT NULL REFERENCES "meal_plans"("id") ON DELETE CASCADE,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "mode" VARCHAR(10) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "expires_at" TIMESTAMP NOT NULL,
  "revoked_at" TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "shopping_list_shares_token_idx" ON "shopping_list_shares" ("token");
CREATE INDEX IF NOT EXISTS "shopping_list_shares_expiresAt_idx" ON "shopping_list_shares" ("expires_at");
