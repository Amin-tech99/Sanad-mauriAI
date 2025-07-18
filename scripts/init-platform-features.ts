import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { storage } from "../server/storage";

async function initPlatformFeatures() {
  try {
    // Create the platform_features table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_features (
        id SERIAL PRIMARY KEY,
        feature_key TEXT NOT NULL UNIQUE,
        feature_name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        dependencies TEXT[],
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id)
      )
    `);
    
    console.log("Platform features table created or already exists");
    
    // Initialize default features
    await storage.initializePlatformFeatures();
    console.log("Platform features initialized");
    
    process.exit(0);
  } catch (error) {
    console.error("Error initializing platform features:", error);
    process.exit(1);
  }
}

initPlatformFeatures();