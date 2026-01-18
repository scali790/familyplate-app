import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: ["./drizzle/schema-postgres.ts", "./drizzle/schema-admin.ts"], // Use Postgres schema
  out: "./drizzle/migrations",
  dialect: "postgresql", // Changed from mysql
  dbCredentials: {
    url: connectionString,
  },
});
