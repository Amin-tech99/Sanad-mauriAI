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
  wordAlternativeStyleTags,
  type User, 
  type InsertUser,
  type Source,
  type InsertSource,
  type InstructionTemplate,
  type InsertTemplate,
  type WorkPacket,
  type InsertWorkPacket,
  type WorkItem,
  type InsertWorkItem,
  type WorkItemAssignment,
  type ApprovedTerm,
  type InsertApprovedTerm,
  type StyleTag,
  type InsertStyleTag,
  type ContextualLexicon,
  type InsertContextualLexicon,
  type WordAlternative,
  type InsertWordAlternative
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: number, isActive: boolean): Promise<void>;
  
  createSource(source: InsertSource): Promise<Source>;
  getAllSources(): Promise<Source[]>;
  getSourceById(id: number): Promise<Source | undefined>;
  updateSourceStatus(id: number, status: string): Promise<void>;
  
  createTemplate(template: InsertTemplate): Promise<InstructionTemplate>;
  getAllTemplates(): Promise<InstructionTemplate[]>;
  getTemplateById(id: number): Promise<InstructionTemplate | undefined>;
  
  createWorkPacket(packet: InsertWorkPacket): Promise<WorkPacket>;
  getAllWorkPackets(): Promise<WorkPacket[]>;
  getWorkPacketById(id: number): Promise<WorkPacket | undefined>;
  
  createWorkItems(items: InsertWorkItem[]): Promise<WorkItem[]>;
  getWorkItemsByAssignee(userId: number): Promise<WorkItem[]>;
  getWorkItemsForQA(): Promise<WorkItem[]>;
  updateWorkItemStatus(id: number, status: string, updates?: Partial<WorkItem>): Promise<void>;
  getWorkItemById(id: number): Promise<WorkItem | undefined>;
  
  createWorkItemAssignments(assignments: Omit<WorkItemAssignment, 'id' | 'createdAt'>[]): Promise<void>;
  
  getDashboardStats(): Promise<{
    approvedSentences: number;
    todayProduction: number;
    qaQueue: number;
    rejectionRate: number;
  }>;
  
  getApprovedWorkItems(filters?: {
    taskType?: string;
    translatorId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<WorkItem[]>;
  
  searchApprovedTerms(query: string): Promise<ApprovedTerm[]>;
  incrementTermFrequency(id: number): Promise<void>;
  createApprovedTerm(term: InsertApprovedTerm): Promise<ApprovedTerm>;
  getAllApprovedTerms(): Promise<ApprovedTerm[]>;
  
  // Style Tags Methods
  getStyleTags(): Promise<StyleTag[]>;
  getStyleTag(id: number): Promise<StyleTag | undefined>;
  createStyleTag(tag: InsertStyleTag): Promise<StyleTag>;
  updateStyleTag(id: number, tag: Partial<InsertStyleTag>): Promise<StyleTag>;
  
  // Contextual Lexicon Methods
  getContextualLexicon(): Promise<ContextualLexicon[]>;
  getContextualLexiconWithAlternatives(): Promise<any[]>;
  createContextualLexiconEntry(entry: InsertContextualLexicon): Promise<ContextualLexicon>;
  addWordAlternative(lexiconId: number, alternative: string, styleTagIds: number[]): Promise<WordAlternative>;
  getWordAlternativesByBaseWord(baseWord: string): Promise<any[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<void> {
    await db.update(users).set({ isActive }).where(eq(users.id, id));
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [newSource] = await db
      .insert(sources)
      .values(source)
      .returning();
    return newSource;
  }

  async getAllSources(): Promise<Source[]> {
    return await db.select().from(sources).orderBy(desc(sources.createdAt));
  }

  async getSourceById(id: number): Promise<Source | undefined> {
    const [source] = await db.select().from(sources).where(eq(sources.id, id));
    return source || undefined;
  }

  async updateSourceStatus(id: number, status: string): Promise<void> {
    await db.update(sources).set({ status }).where(eq(sources.id, id));
  }

  async createTemplate(template: InsertTemplate): Promise<InstructionTemplate> {
    const [newTemplate] = await db
      .insert(instructionTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getAllTemplates(): Promise<InstructionTemplate[]> {
    return await db.select().from(instructionTemplates)
      .where(eq(instructionTemplates.isActive, true))
      .orderBy(desc(instructionTemplates.createdAt));
  }

  async getTemplateById(id: number): Promise<InstructionTemplate | undefined> {
    const [template] = await db.select().from(instructionTemplates).where(eq(instructionTemplates.id, id));
    return template || undefined;
  }

  async createWorkPacket(packet: InsertWorkPacket): Promise<WorkPacket> {
    const [newPacket] = await db
      .insert(workPackets)
      .values(packet)
      .returning();
    return newPacket;
  }

  async getAllWorkPackets(): Promise<WorkPacket[]> {
    return await db.select().from(workPackets).orderBy(desc(workPackets.createdAt));
  }

  async getWorkPacketById(id: number): Promise<WorkPacket | undefined> {
    const [packet] = await db.select().from(workPackets).where(eq(workPackets.id, id));
    return packet || undefined;
  }

  async createWorkItems(items: InsertWorkItem[]): Promise<WorkItem[]> {
    return await db
      .insert(workItems)
      .values(items)
      .returning();
  }

  async getWorkItemsByAssignee(userId: number): Promise<WorkItem[]> {
    return await db.select().from(workItems)
      .where(and(
        eq(workItems.assignedTo, userId),
        sql`${workItems.status} IN ('pending', 'in_progress', 'rejected')`
      ))
      .orderBy(desc(workItems.createdAt), workItems.sequenceNumber);
  }

  async getWorkItemsForQA(): Promise<WorkItem[]> {
    return await db.select().from(workItems)
      .where(eq(workItems.status, 'in_qa'))
      .orderBy(workItems.submittedAt);
  }

  async updateWorkItemStatus(id: number, status: string, updates?: Partial<WorkItem>): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'in_qa') {
      updateData.submittedAt = new Date();
    } else if (status === 'approved' || status === 'rejected') {
      updateData.reviewedAt = new Date();
    }
    
    if (updates) {
      Object.assign(updateData, updates);
    }
    
    await db.update(workItems).set(updateData).where(eq(workItems.id, id));
  }

  async getWorkItemById(id: number): Promise<WorkItem | undefined> {
    const [item] = await db.select().from(workItems).where(eq(workItems.id, id));
    return item || undefined;
  }

  async createWorkItemAssignments(assignments: Omit<WorkItemAssignment, 'id' | 'createdAt'>[]): Promise<void> {
    if (assignments.length > 0) {
      await db.insert(workItemAssignments).values(assignments);
    }
  }

  async getDashboardStats(): Promise<{
    approvedSentences: number;
    todayProduction: number;
    qaQueue: number;
    rejectionRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [approvedCount] = await db
      .select({ count: count() })
      .from(workItems)
      .where(eq(workItems.status, 'approved'));
    
    const [todayCount] = await db
      .select({ count: count() })
      .from(workItems)
      .where(and(
        eq(workItems.status, 'approved'),
        sql`${workItems.reviewedAt} >= ${today}`
      ));
    
    const [qaCount] = await db
      .select({ count: count() })
      .from(workItems)
      .where(eq(workItems.status, 'in_qa'));
    
    const [rejectedCount] = await db
      .select({ count: count() })
      .from(workItems)
      .where(eq(workItems.status, 'rejected'));
    
    const [totalReviewedCount] = await db
      .select({ count: count() })
      .from(workItems)
      .where(sql`${workItems.status} IN ('approved', 'rejected')`);
    
    const rejectionRate = totalReviewedCount.count > 0 
      ? (rejectedCount.count / totalReviewedCount.count) * 100 
      : 0;
    
    return {
      approvedSentences: approvedCount.count,
      todayProduction: todayCount.count,
      qaQueue: qaCount.count,
      rejectionRate: Number(rejectionRate.toFixed(1)),
    };
  }

  async getApprovedWorkItems(filters?: {
    taskType?: string;
    translatorId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<WorkItem[]> {
    let conditions = [eq(workItems.status, 'approved')];
    
    if (filters?.translatorId) {
      conditions.push(eq(workItems.assignedTo, filters.translatorId));
    }
    
    if (filters?.fromDate) {
      conditions.push(sql`${workItems.reviewedAt} >= ${filters.fromDate}`);
    }
    
    if (filters?.toDate) {
      conditions.push(sql`${workItems.reviewedAt} <= ${filters.toDate}`);
    }
    
    return await db.select().from(workItems)
      .where(and(...conditions))
      .orderBy(desc(workItems.reviewedAt));
  }
  
  async searchApprovedTerms(query: string): Promise<ApprovedTerm[]> {
    if (!query || query.length < 2) return [];
    
    // Search for terms that match the query in Arabic or Hassaniya
    const terms = await db
      .select()
      .from(approvedTerms)
      .where(
        sql`${approvedTerms.arabicTerm} ILIKE ${`%${query}%`} OR ${approvedTerms.hassaniyaTerm} ILIKE ${`%${query}%`}`
      )
      .orderBy(desc(approvedTerms.frequency))
      .limit(10);
    
    return terms;
  }
  
  async incrementTermFrequency(id: number): Promise<void> {
    await db
      .update(approvedTerms)
      .set({ frequency: sql`${approvedTerms.frequency} + 1` })
      .where(eq(approvedTerms.id, id));
  }
  
  async createApprovedTerm(term: InsertApprovedTerm): Promise<ApprovedTerm> {
    const [newTerm] = await db
      .insert(approvedTerms)
      .values(term)
      .returning();
    return newTerm;
  }
  
  async getAllApprovedTerms(): Promise<ApprovedTerm[]> {
    return await db
      .select()
      .from(approvedTerms)
      .orderBy(desc(approvedTerms.frequency));
  }
  
  // Style Tags Methods
  async getStyleTags(): Promise<StyleTag[]> {
    return await db
      .select()
      .from(styleTags)
      .where(eq(styleTags.isActive, true))
      .orderBy(styleTags.name);
  }
  
  async getStyleTag(id: number): Promise<StyleTag | undefined> {
    const [tag] = await db
      .select()
      .from(styleTags)
      .where(eq(styleTags.id, id));
    return tag;
  }
  
  async createStyleTag(tag: InsertStyleTag): Promise<StyleTag> {
    const [newTag] = await db
      .insert(styleTags)
      .values(tag)
      .returning();
    return newTag;
  }
  
  async updateStyleTag(id: number, tag: Partial<InsertStyleTag>): Promise<StyleTag> {
    const [updatedTag] = await db
      .update(styleTags)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(styleTags.id, id))
      .returning();
    return updatedTag;
  }
  
  // Contextual Lexicon Methods
  async getContextualLexicon(): Promise<ContextualLexicon[]> {
    return await db
      .select()
      .from(contextualLexicon)
      .orderBy(contextualLexicon.baseWord);
  }
  
  async getContextualLexiconWithAlternatives(): Promise<any[]> {
    const lexiconEntries = await db
      .select({
        id: contextualLexicon.id,
        baseWord: contextualLexicon.baseWord,
        alternativeId: wordAlternatives.id,
        alternativeWord: wordAlternatives.alternativeWord,
        styleTagId: wordAlternativeStyleTags.styleTagId,
        styleTagName: styleTags.name
      })
      .from(contextualLexicon)
      .leftJoin(wordAlternatives, eq(contextualLexicon.id, wordAlternatives.lexiconId))
      .leftJoin(wordAlternativeStyleTags, eq(wordAlternatives.id, wordAlternativeStyleTags.alternativeId))
      .leftJoin(styleTags, eq(wordAlternativeStyleTags.styleTagId, styleTags.id));
    
    // Group by base word
    const grouped = lexiconEntries.reduce((acc, entry) => {
      if (!acc[entry.baseWord]) {
        acc[entry.baseWord] = {
          id: entry.id,
          baseWord: entry.baseWord,
          alternatives: []
        };
      }
      
      if (entry.alternativeWord) {
        const existing = acc[entry.baseWord].alternatives.find(
          (alt: any) => alt.word === entry.alternativeWord
        );
        
        if (existing) {
          if (entry.styleTagName) {
            existing.styleTags.push(entry.styleTagName);
          }
        } else {
          acc[entry.baseWord].alternatives.push({
            id: entry.alternativeId,
            word: entry.alternativeWord,
            styleTags: entry.styleTagName ? [entry.styleTagName] : []
          });
        }
      }
      
      return acc;
    }, {} as any);
    
    return Object.values(grouped);
  }
  
  async createContextualLexiconEntry(entry: InsertContextualLexicon): Promise<ContextualLexicon> {
    const [newEntry] = await db
      .insert(contextualLexicon)
      .values(entry)
      .returning();
    return newEntry;
  }
  
  async addWordAlternative(lexiconId: number, alternative: string, styleTagIds: number[]): Promise<WordAlternative> {
    const [newAlternative] = await db
      .insert(wordAlternatives)
      .values({ lexiconId, alternativeWord: alternative })
      .returning();
    
    // Add style tag associations
    if (styleTagIds.length > 0) {
      await db
        .insert(wordAlternativeStyleTags)
        .values(styleTagIds.map(tagId => ({
          alternativeId: newAlternative.id,
          styleTagId: tagId
        })));
    }
    
    return newAlternative;
  }
  
  async getWordAlternativesByBaseWord(baseWord: string): Promise<any[]> {
    const alternatives = await db
      .select({
        alternativeWord: wordAlternatives.alternativeWord,
        styleTagId: styleTags.id,
        styleTagName: styleTags.name
      })
      .from(contextualLexicon)
      .innerJoin(wordAlternatives, eq(contextualLexicon.id, wordAlternatives.lexiconId))
      .leftJoin(wordAlternativeStyleTags, eq(wordAlternatives.id, wordAlternativeStyleTags.alternativeId))
      .leftJoin(styleTags, eq(wordAlternativeStyleTags.styleTagId, styleTags.id))
      .where(eq(contextualLexicon.baseWord, baseWord));
    
    // Group by alternative word
    const grouped = alternatives.reduce((acc, alt) => {
      if (!acc[alt.alternativeWord]) {
        acc[alt.alternativeWord] = {
          word: alt.alternativeWord,
          styleTags: []
        };
      }
      
      if (alt.styleTagId) {
        acc[alt.alternativeWord].styleTags.push({
          id: alt.styleTagId,
          name: alt.styleTagName
        });
      }
      
      return acc;
    }, {} as any);
    
    return Object.values(grouped);
  }
}

export const storage = new DatabaseStorage();
