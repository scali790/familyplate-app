-- Add vote_sessions table for public family voting
CREATE TABLE IF NOT EXISTS "vote_sessions" (
  "id" VARCHAR(36) PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "meal_plan_id" INTEGER NOT NULL REFERENCES "meal_plans"("id"),
  "status" VARCHAR(20) NOT NULL DEFAULT 'open',
  "max_voters" INTEGER NOT NULL DEFAULT 10,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Add public_meal_votes table for anonymous voter reactions
CREATE TABLE IF NOT EXISTS "public_meal_votes" (
  "id" SERIAL PRIMARY KEY,
  "vote_session_id" VARCHAR(36) NOT NULL REFERENCES "vote_sessions"("id") ON DELETE CASCADE,
  "meal_id" VARCHAR(100) NOT NULL,
  "voter_name" VARCHAR(32) NOT NULL,
  "reaction" VARCHAR(10) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint for one vote per (session, meal, voter)
CREATE UNIQUE INDEX IF NOT EXISTS "public_meal_votes_unique_vote" 
ON "public_meal_votes" ("vote_session_id", "meal_id", "voter_name");
