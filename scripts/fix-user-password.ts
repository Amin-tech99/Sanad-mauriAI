import { db } from "../server/db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixUserPassword() {
  console.log("🔧 Fixing user password...\n");

  try {
    // Hash the password properly
    const hashedPassword = await hashPassword("password123");
    
    // Update the user with the hashed password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(sql`${users.username} = 'Emin1'`)
      .returning();

    if (result.length > 0) {
      console.log("✅ Password updated successfully for user:", result[0].username);
      console.log("\n🔐 Login Credentials:");
      console.log("   Username: Emin1");
      console.log("   Password: password123");
      console.log("   Role: translator");
    } else {
      console.log("❌ User 'Emin1' not found");
    }

  } catch (error) {
    console.error("❌ Error fixing password:", error);
  } finally {
    process.exit(0);
  }
}

fixUserPassword();