import { db } from "../server/db";
import { 
  sources, 
  instructionTemplates, 
  workPackets, 
  workItems, 
  users,
  styleTags,
  approvedTerms,
  contextualLexicon
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function createTestConversation() {
  console.log("🚀 Creating test conversation for translator...\n");

  try {
    // 1. Check if users exist, if not create them
    console.log("1️⃣ Checking users...");
    let translator = await db.select().from(users).where(sql`${users.username} = 'Emin1'`);
    
    if (translator.length === 0) {
      console.log("Creating translator user...");
      [translator[0]] = await db.insert(users).values({
        username: "Emin1",
        email: "emin1@example.com",
        password: "password123", // Simple password for testing
        role: "translator",
        isActive: true
      }).returning();
    }
    console.log("✓ Translator user ready:", translator[0].username);

    // 2. Create a test source
    console.log("\n2️⃣ Creating test source...");
    const [testSource] = await db.insert(sources).values({
      title: "محادثة تجريبية للترجمة",
      content: "مرحباً، كيف حالك اليوم؟ أتمنى أن تكون بخير. هل يمكنك مساعدتي في هذا الأمر؟ شكراً لك على وقتك.",
      status: "ready",
      createdBy: 1,
      tags: ["conversation", "test"]
    }).returning();
    console.log("✓ Created source:", testSource.title);

    // 3. Create a test template
    console.log("\n3️⃣ Creating test template...");
    const [testTemplate] = await db.insert(instructionTemplates).values({
      name: "قالب ترجمة المحادثات",
      taskType: "conversation",
      instructions: "قم بترجمة المحادثة من العربية إلى الحسانية مع الحفاظ على طبيعة الحوار",
      outputFormat: "محادثة مترجمة",
      isActive: true,
      createdBy: 1
    }).returning();
    console.log("✓ Created template:", testTemplate.name);

    // 4. Get or create style tag
    let styleTag = await db.select().from(styleTags).where(sql`${styleTags.name} = 'conversational'`);
    if (styleTag.length === 0) {
      [styleTag[0]] = await db.insert(styleTags).values({
        name: "conversational",
        description: "نمط المحادثة العادية",
        guidelines: "استخدم لغة طبيعية ومألوفة في المحادثات اليومية",
        isActive: true,
        createdBy: 1
      }).returning();
    }

    // 5. Create work packet
    console.log("\n4️⃣ Creating work packet...");
    const [workPacket] = await db.insert(workPackets).values({
      sourceId: testSource.id,
      templateId: testTemplate.id,
      styleTagId: styleTag[0].id,
      unitType: "sentence",
      createdBy: 1
    }).returning();
    console.log("✓ Created work packet");

    // 6. Create work items (conversation parts)
    console.log("\n5️⃣ Creating conversation work items...");
    const conversationParts = [
      "مرحباً، كيف حالك اليوم؟",
      "أتمنى أن تكون بخير.",
      "هل يمكنك مساعدتي في هذا الأمر؟",
      "شكراً لك على وقتك."
    ];

    for (let i = 0; i < conversationParts.length; i++) {
      const [workItem] = await db.insert(workItems).values({
        packetId: workPacket.id,
        sourceText: conversationParts[i],
        status: "pending",
        assignedTo: translator[0].id,
        sequenceNumber: i + 1
      }).returning();
      console.log(`✓ Created work item ${i + 1}: "${conversationParts[i]}"`);
    }

    // 7. Add some approved terms for testing
    console.log("\n6️⃣ Adding approved terms...");
    const terms = [
      { arabic: "مرحبا", hassaniya: "أهلين", category: "تحية" },
      { arabic: "شكرا", hassaniya: "بارك الله فيك", category: "شكر" },
      { arabic: "كيف", hassaniya: "كيفاش", category: "استفهام" },
      { arabic: "حال", hassaniya: "حال", category: "عام" }
    ];

    for (const term of terms) {
      // Check if term already exists
      const existing = await db.select().from(approvedTerms)
        .where(sql`${approvedTerms.arabicTerm} = ${term.arabic}`);
      
      if (existing.length === 0) {
        await db.insert(approvedTerms).values({
          arabicTerm: term.arabic,
          hassaniyaTerm: term.hassaniya,
          category: term.category,
          frequency: 0
        });
        console.log(`✓ Added term: ${term.arabic} -> ${term.hassaniya}`);
      }
    }

    // 8. Add contextual lexicon entries
    console.log("\n7️⃣ Adding contextual lexicon...");
    const lexiconWords = ["مرحبا", "شكرا", "كيف", "حال"];
    
    for (const word of lexiconWords) {
      const existing = await db.select().from(contextualLexicon)
        .where(sql`${contextualLexicon.baseWord} = ${word}`);
      
      if (existing.length === 0) {
        await db.insert(contextualLexicon).values({
          baseWord: word
        });
        console.log(`✓ Added lexicon entry: ${word}`);
      }
    }

    console.log("\n✅ Test conversation created successfully!");
    console.log("\n📋 Summary:");
    console.log(`- Created conversation source: "${testSource.title}"`);
    console.log(`- Created ${conversationParts.length} work items`);
    console.log(`- Assigned to translator: ${translator[0].username}`);
    console.log("- Added approved terms and lexicon entries");
    console.log("\n🎯 You can now login as 'Emin1' to test the translation features!");

  } catch (error) {
    console.error("❌ Error creating test conversation:", error);
  } finally {
    process.exit(0);
  }
}

createTestConversation();