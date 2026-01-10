import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL or POSTGRES_URL environment variable is not set");
    return null;
  }

  try {
    const client = postgres(databaseUrl, {
      ssl: "require",
      max: 1,
    });
    
    dbInstance = drizzle(client, { schema });
    console.log("[db] Connected to Postgres database");
    return dbInstance;
  } catch (error) {
    console.error("[db] Failed to connect to database:", error);
    return null;
  }
}
