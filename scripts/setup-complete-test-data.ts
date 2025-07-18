// Setup complete test data for translator workflow demonstration
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { 
  users, 
  sources, 
  instructionTemplates, 
  workPackets, 
  workItems, 
  workItemAssignments, 
  approvedTerms, 
  styleTags, 
  contextualLexicon, 
  wordAlternatives, 
  wordAlternativeStyleTags 
} from "../shared/schema";

async function setupTestData() {
  console.log("🚀 Setting up comprehensive test data for translator workflow...\n");

  try {
    // 1. Create a test source with Arabic content
    console.log("1️⃣ Creating test source...");
    const [testSource] = await db.insert(sources).values({
      title: "نص تجريبي للترجمة",
      content: "مرحباً بكم في نظام الترجمة. هذا نص تجريبي يحتوي على كلمات عربية مختلفة مثل: السلام عليكم، كيف حالك، وشكراً لكم.",
      status: "ready",
      createdBy: 1, // Admin user
      tags: ["test", "demo"]
    }).returning();
    console.log("✓ Created source:", testSource.title);

    // 2. Create a test template
    console.log("\n2️⃣ Creating test template...");
    const [testTemplate] = await db.insert(instructionTemplates).values({
      name: "قالب الترجمة التجريبي",
      taskType: "paragraph",
      instructions: "قم بترجمة النص من العربية الفصحى إلى الحسانية مع مراعاة النمط المطلوب",
      outputFormat: "نص مترجم",
      isActive: true,
      createdBy: 1
    }).returning();
    console.log("✓ Created template:", testTemplate.name);

    // 3. Get style tags
    const formalStyle = await db.select().from(styleTags).where(sql`${styleTags.name} = 'formal'`);
    const informalStyle = await db.select().from(styleTags).where(sql`${styleTags.name} = 'informal_friendly'`);
    
    // 4. Create work packets with different styles
    console.log("\n3️⃣ Creating work packets with styles...");
    const [formalPacket] = await db.insert(workPackets).values({
      sourceId: testSource.id,
      templateId: testTemplate.id,
      styleTagId: formalStyle[0]?.id || null,
      unitType: "sentence",
      createdBy: 1
    }).returning();
    console.log("✓ Created formal style work packet");

    const [informalPacket] = await db.insert(workPackets).values({
      sourceId: testSource.id,
      templateId: testTemplate.id,
      styleTagId: informalStyle[0]?.id || null,
      unitType: "sentence",
      createdBy: 1
    }).returning();
    console.log("✓ Created informal style work packet");

    // 5. Create work items and assign to translator
    console.log("\n4️⃣ Creating and assigning work items...");
    const sentences = [
      "مرحباً بكم في نظام الترجمة.",
      "هذا نص تجريبي يحتوي على كلمات عربية مختلفة.",
      "السلام عليكم، كيف حالك؟",
      "شكراً لكم على استخدام النظام."
    ];

    // Get translator user (Emin1)
    const [translator] = await db.select().from(users).where(sql`${users.username} = 'Emin1'`);
    
    // Create work items for formal packet
    let sequenceNum = 1;
    for (const sentence of sentences.slice(0, 2)) {
      const [workItem] = await db.insert(workItems).values({
        packetId: formalPacket.id,
        sourceText: sentence,
        status: "pending",
        assignedTo: translator.id,
        sequenceNumber: sequenceNum++
      }).returning();
      console.log(`✓ Created formal work item: "${sentence.substring(0, 30)}..."`);
    }

    // Create work items for informal packet
    sequenceNum = 1;
    for (const sentence of sentences.slice(2)) {
      const [workItem] = await db.insert(workItems).values({
        packetId: informalPacket.id,
        sourceText: sentence,
        status: "pending",
        assignedTo: translator.id,
        sequenceNumber: sequenceNum++
      }).returning();
      console.log(`✓ Created informal work item: "${sentence.substring(0, 30)}..."`);
    }

    // 6. Add more contextual lexicon with style-specific alternatives
    console.log("\n5️⃣ Adding contextual lexicon with style alternatives...");
    
    // Add word alternatives for existing lexicon entries
    const lexiconEntries = await db.select().from(contextualLexicon);
    
    for (const entry of lexiconEntries) {
      if (entry.baseWord === "قال") {
        // Formal alternative
        const [formalAlt] = await db.insert(wordAlternatives).values({
          lexiconId: entry.id,
          alternativeWord: "أفاد"
        }).returning();
        
        await db.insert(wordAlternativeStyleTags).values({
          alternativeId: formalAlt.id,
          styleTagId: formalStyle[0].id
        });
        
        // Informal alternative
        const [informalAlt] = await db.insert(wordAlternatives).values({
          lexiconId: entry.id,
          alternativeWord: "كال"
        }).returning();
        
        await db.insert(wordAlternativeStyleTags).values({
          alternativeId: informalAlt.id,
          styleTagId: informalStyle[0].id
        });
        
        console.log(`✓ Added alternatives for "${entry.baseWord}"`);
      }
    }

    // Add new lexicon entries with alternatives
    const newWords = [
      { base: "مرحبا", formal: "أهلاً وسهلاً", informal: "مرحبا بيك" },
      { base: "شكرا", formal: "جزيل الشكر", informal: "بارك الله فيك" }
    ];

    for (const word of newWords) {
      const [lexEntry] = await db.insert(contextualLexicon).values({
        baseWord: word.base
      }).returning();

      // Formal alternative
      const [formalAlt] = await db.insert(wordAlternatives).values({
        lexiconId: lexEntry.id,
        alternativeWord: word.formal
      }).returning();
      
      await db.insert(wordAlternativeStyleTags).values({
        alternativeId: formalAlt.id,
        styleTagId: formalStyle[0].id
      });

      // Informal alternative
      const [informalAlt] = await db.insert(wordAlternatives).values({
        lexiconId: lexEntry.id,
        alternativeWord: word.informal
      }).returning();
      
      await db.insert(wordAlternativeStyleTags).values({
        alternativeId: informalAlt.id,
        styleTagId: informalStyle[0].id
      });

      console.log(`✓ Added lexicon entry with alternatives for "${word.base}"`);
    }

    // 7. Add more approved terms
    console.log("\n6️⃣ Adding more approved terms...");
    const newTerms = [
      { arabic: "نظام", hassaniya: "نظام", category: "تقني" },
      { arabic: "ترجمة", hassaniya: "تَرْجَمَة", category: "عام" },
      { arabic: "كلمات", hassaniya: "كْلِمَات", category: "عام" },
      { arabic: "استخدام", hassaniya: "استعمال", category: "عام" }
    ];

    for (const term of newTerms) {
      await db.insert(approvedTerms).values({
        arabicTerm: term.arabic,
        hassaniyaTerm: term.hassaniya,
        category: term.category,
        frequency: 0
      });
      console.log(`✓ Added approved term: ${term.arabic} -> ${term.hassaniya}`);
    }

    console.log("\n✅ Test data setup complete!");
    console.log("\n📋 Summary:");
    console.log("- Created 1 test source with Arabic content");
    console.log("- Created 1 test template");
    console.log("- Created 2 work packets (formal & informal styles)");
    console.log("- Created 4 work items assigned to translator 'Emin1'");
    console.log("- Added contextual word alternatives for different styles");
    console.log("- Added additional approved terms");
    console.log("\n🎯 Translator 'Emin1' can now login and test the smart features!");

  } catch (error) {
    console.error("❌ Error setting up test data:", error);
  } finally {
    process.exit(0);
  }
}

setupTestData();