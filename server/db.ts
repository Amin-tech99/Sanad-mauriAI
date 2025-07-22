import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure postgres client for production (Render) and development
const client = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1, // Limit connections for free tier
});

export const db = drizzle(client, { schema });