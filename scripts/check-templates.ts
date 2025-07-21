import { db } from "../server/db";
import { instructionTemplates } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkTemplates() {
  try {
    console.log("🔍 Checking templates in database...");
    
    // Get all templates (including inactive ones)
    const allTemplates = await db.select().from(instructionTemplates);
    console.log("All templates:", allTemplates);
    
    // Get only active templates
    const activeTemplates = await db.select().from(instructionTemplates)
      .where(eq(instructionTemplates.isActive, true));
    console.log("Active templates:", activeTemplates);
    
  } catch (error) {
    console.error("Error checking templates:", error);
  }
  
  process.exit(0);
}

checkTemplates();