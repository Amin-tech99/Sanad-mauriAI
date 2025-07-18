// Test script to verify translator workflow and smart features
import { db } from "../server/db";
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

async function testTranslatorWorkflow() {
  console.log("🧪 Testing translator workflow and smart features...\n");

  try {
    // Test 1: Check existing translators
    console.log("1️⃣ Checking existing translators...");
    const translators = await db.select().from(users).where(users.role === "translator");
    console.log(`Found ${translators.length} translators:`, translators.map(t => t.username));

    // Test 2: Check style tags
    console.log("\n2️⃣ Checking style tags...");
    const tags = await db.select().from(styleTags);
    console.log(`Found ${tags.length} style tags:`, tags.map(t => ({ id: t.id, name: t.name })));

    // Test 3: Check approved terms
    console.log("\n3️⃣ Checking approved terms...");
    const terms = await db.select().from(approvedTerms).limit(5);
    console.log(`Found ${terms.length} approved terms:`, terms.map(t => ({ 
      arabic: t.arabicTerm, 
      hassaniya: t.hassaniyaTerm,
      category: t.category
    })));

    // Test 4: Check contextual lexicon
    console.log("\n4️⃣ Checking contextual lexicon...");
    const lexicon = await db.select().from(contextualLexicon).limit(5);
    console.log(`Found ${lexicon.length} lexicon entries:`, lexicon.map(l => l.baseWord));

    // Test 5: Check word alternatives with style tags
    console.log("\n5️⃣ Checking word alternatives...");
    const alternatives = await db
      .select({
        baseWord: contextualLexicon.baseWord,
        alternative: wordAlternatives.alternativeWord,
        styleTag: styleTags.name
      })
      .from(contextualLexicon)
      .innerJoin(wordAlternatives, wordAlternatives.lexiconId === contextualLexicon.id)
      .leftJoin(wordAlternativeStyleTags, wordAlternativeStyleTags.alternativeId === wordAlternatives.id)
      .leftJoin(styleTags, styleTags.id === wordAlternativeStyleTags.styleTagId)
      .limit(10);
    
    console.log("Word alternatives with styles:", alternatives);

    // Test 6: Check work items for translators
    console.log("\n6️⃣ Checking work items for translators...");
    const workItemsData = await db
      .select({
        itemId: workItems.id,
        sourceText: workItems.sourceText,
        status: workItems.status,
        translator: users.username,
        packetId: workItems.packetId
      })
      .from(workItems)
      .leftJoin(users, users.id === workItems.assignedTo)
      .where(workItems.status === "pending")
      .limit(5);
    
    console.log(`Found ${workItemsData.length} pending work items:`, workItemsData);

    // Test 7: Check work packets with style tags
    console.log("\n7️⃣ Checking work packets with style tags...");
    const packets = await db
      .select({
        packetId: workPackets.id,
        sourceTitle: sources.title,
        templateName: instructionTemplates.name,
        styleName: styleTags.name
      })
      .from(workPackets)
      .leftJoin(sources, sources.id === workPackets.sourceId)
      .leftJoin(instructionTemplates, instructionTemplates.id === workPackets.templateId)
      .leftJoin(styleTags, styleTags.id === workPackets.styleTagId)
      .limit(5);
    
    console.log("Work packets with styles:", packets);

    // Test 8: Check if approved terms search is working
    console.log("\n8️⃣ Testing approved terms search...");
    const searchTest = await db
      .select()
      .from(approvedTerms)
      .where(approvedTerms.arabicTerm.ilike('%الس%'))
      .limit(3);
    
    console.log("Search results for 'الس':", searchTest.map(t => ({ 
      arabic: t.arabicTerm, 
      hassaniya: t.hassaniyaTerm 
    })));

    console.log("\n✅ All tests completed!");
    console.log("\n📊 Summary:");
    console.log(`- Translators: ${translators.length}`);
    console.log(`- Style tags: ${tags.length}`);
    console.log(`- Approved terms: ${terms.length}`);
    console.log(`- Contextual lexicon: ${lexicon.length}`);
    console.log(`- Word alternatives: ${alternatives.length}`);
    console.log(`- Pending work items: ${workItemsData.length}`);
    console.log(`- Work packets: ${packets.length}`);

  } catch (error) {
    console.error("❌ Error during testing:", error);
  } finally {
    process.exit(0);
  }
}

testTranslatorWorkflow();