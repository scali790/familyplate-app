-- Migration: Add recipe_details table for on-demand recipe generation
-- Created: 2026-01-11

CREATE TABLE IF NOT EXISTS "recipe_details" (
  "id" SERIAL PRIMARY KEY,
  "recipe_id" VARCHAR(255) NOT NULL UNIQUE,
  "meal_name" VARCHAR(255) NOT NULL,
  "ingredients" JSONB NOT NULL,
  "instructions" JSONB NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "recipe_details_recipe_id_idx" ON "recipe_details" ("recipe_id");

-- Example data structure:
-- ingredients: [{"name": "Chicken breast", "amount": "500g", "category": "Protein"}]
-- instructions: ["Preheat oven to 180°C", "Season chicken with salt and pepper", ...]
