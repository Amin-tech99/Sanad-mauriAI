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
  type InsertWordAlternative,
  wordSuggestions,
  type WordSuggestion,
  type InsertWordSuggestion,
  platformFeatures,
  type PlatformFeature,
  type InsertPlatformFeature
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

// Use memory store for serverless environment (Vercel)
const MemorySessionStore = MemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: number, isActive: boolean): Promise<void>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  
  createSource(source: InsertSource): Promise<Source>;
  getAllSources(): Promise<Source[]>;
  getSourceById(id: number): Promise<Source | undefined>;
  updateSourceStatus(id: number, status: string): Promise<void>;
  updateSource(id: number, data: Partial<InsertSource>): Promise<Source>;
  deleteSource(id: number): Promise<void>;
  
  createTemplate(template: InsertTemplate): Promise<InstructionTemplate>;
  getAllTemplates(): Promise<InstructionTemplate[]>;
  getTemplateById(id: number): Promise<InstructionTemplate | undefined>;
  updateTemplate(id: number, data: Partial<InsertTemplate>): Promise<InstructionTemplate>;
  deleteTemplate(id: number, cascade?: boolean): Promise<void>;
  
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
  
  getAdvancedAnalytics(period?: 'week' | 'month' | 'quarter'): Promise<{
    productionTrends: Array<{ date: string; approved: number; rejected: number; }>;
    translatorPerformance: Array<{ 
      translatorId: number; 
      username: string; 
      totalCompleted: number; 
      approvalRate: number; 
      avgTimePerItem: number;
    }>;
    qualityMetrics: {
      overallApprovalRate: number;
      avgItemsPerDay: number;
      peakProductionHour: number;
      commonRejectionReasons: Array<{ reason: string; count: number; }>;
    };
    workflowAnalytics: {
      bottlenecks: Array<{ stage: string; avgWaitTime: number; itemCount: number; }>;
      completionTimes: Array<{ stage: string; avgTime: number; }>;
    };
    contentAnalytics: {
      sourceTypes: Array<{ type: string; count: number; avgQuality: number; }>;
      templateEffectiveness: Array<{ templateId: number; name: string; successRate: number; }>;
      styleTagUsage: Array<{ tagId: number; name: string; usage: number; quality: number; }>;
    };
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
  deleteApprovedTerm(id: number): Promise<void>;
  
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
  
  // Word suggestions
  createWordSuggestion(suggestion: InsertWordSuggestion): Promise<WordSuggestion>;
  getWordSuggestionsByStatus(status: string): Promise<WordSuggestion[]>;
  updateWordSuggestionStatus(id: number, status: string, reviewedBy: number, reviewNotes?: string): Promise<void>;
  
  // Platform Features
  getAllPlatformFeatures(): Promise<PlatformFeature[]>;
  updatePlatformFeature(featureKey: string, isEnabled: boolean, updatedBy: number): Promise<void>;
  getPlatformFeature(featureKey: string): Promise<PlatformFeature | undefined>;
  initializePlatformFeatures(): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemorySessionStore({ 
      checkPeriod: 86400000 // prune expired entries every 24h
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

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async createSource(source: InsertSource): Promise<Source> {
    // Handle tags property to ensure it's a proper string array
    const sourceData: any = { ...source };
    if (source.tags !== undefined) {
      sourceData.tags = Array.isArray(source.tags) ? source.tags : [];
    }
    
    const [newSource] = await db
      .insert(sources)
      .values(sourceData)
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

  async updateSource(id: number, data: Partial<InsertSource>): Promise<Source> {
    // Handle tags property separately to avoid type issues
    const updateData: any = { ...data };
    if (data.tags !== undefined) {
      updateData.tags = Array.isArray(data.tags) ? data.tags : [];
    }
    
    const [updatedSource] = await db
      .update(sources)
      .set(updateData)
      .where(eq(sources.id, id))
      .returning();
    return updatedSource;
  }

  async deleteSource(id: number, cascade: boolean = false): Promise<void> {
    // First check if there are any work packets using this source
    const dependentPackets = await db.select()
      .from(workPackets)
      .where(eq(workPackets.sourceId, id));
    
    if (dependentPackets.length > 0 && !cascade) {
      throw new Error('Cannot delete source: There are work packets using this source');
    }
    
    if (cascade && dependentPackets.length > 0) {
      // Delete all work items from dependent packets
      for (const packet of dependentPackets) {
        await db.delete(workItems).where(eq(workItems.packetId, packet.id));
        await db.delete(workItemAssignments).where(eq(workItemAssignments.packetId, packet.id));
      }
      
      // Delete all work packets
      await db.delete(workPackets).where(eq(workPackets.sourceId, id));
    }
    
    await db.delete(sources).where(eq(sources.id, id));
  }

  async createTemplate(template: InsertTemplate): Promise<InstructionTemplate> {
    const [newTemplate] = await db
      .insert(instructionTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getAllTemplates(): Promise<InstructionTemplate[]> {
    const templates = await db.select().from(instructionTemplates)
      .where(eq(instructionTemplates.isActive, true))
      .orderBy(desc(instructionTemplates.createdAt));
    return templates;
  }

  async getTemplateById(id: number): Promise<InstructionTemplate | undefined> {
    const [template] = await db.select().from(instructionTemplates).where(eq(instructionTemplates.id, id));
    return template || undefined;
  }

  async updateTemplate(id: number, data: Partial<InsertTemplate>): Promise<InstructionTemplate> {
    const [updatedTemplate] = await db
      .update(instructionTemplates)
      .set(data)
      .where(eq(instructionTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTemplate(id: number, cascade: boolean = false): Promise<void> {
    // First check if there are any work packets using this template
    const dependentPackets = await db.select()
      .from(workPackets)
      .where(eq(workPackets.templateId, id));
    
    if (dependentPackets.length > 0 && !cascade) {
      throw new Error('Cannot delete template: There are work packets using this template');
    }
    
    if (cascade && dependentPackets.length > 0) {
      // Delete all work items from dependent packets
      for (const packet of dependentPackets) {
        await db.delete(workItems).where(eq(workItems.packetId, packet.id));
        await db.delete(workItemAssignments).where(eq(workItemAssignments.packetId, packet.id));
      }
      
      // Delete all work packets
      await db.delete(workPackets).where(eq(workPackets.templateId, id));
    }
    
    await db.delete(instructionTemplates).where(eq(instructionTemplates.id, id));
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

  async getAdvancedAnalytics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    productionTrends: Array<{ date: string; approved: number; rejected: number; }>;
    translatorPerformance: Array<{ 
      translatorId: number; 
      username: string; 
      totalCompleted: number; 
      approvalRate: number; 
      avgTimePerItem: number;
    }>;
    qualityMetrics: {
      overallApprovalRate: number;
      avgItemsPerDay: number;
      peakProductionHour: number;
      commonRejectionReasons: Array<{ reason: string; count: number; }>;
    };
    workflowAnalytics: {
      bottlenecks: Array<{ stage: string; avgWaitTime: number; itemCount: number; }>;
      completionTimes: Array<{ stage: string; avgTime: number; }>;
    };
    contentAnalytics: {
      sourceTypes: Array<{ type: string; count: number; avgQuality: number; }>;
      templateEffectiveness: Array<{ templateId: number; name: string; successRate: number; }>;
      styleTagUsage: Array<{ tagId: number; name: string; usage: number; quality: number; }>;
    };
  }> {
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
    }

    // Production trends - daily aggregation
    const productionTrends = await db
      .select({
        date: sql<string>`DATE(${workItems.reviewedAt})`,
        approved: sql<number>`COUNT(CASE WHEN ${workItems.status} = 'approved' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN ${workItems.status} = 'rejected' THEN 1 END)`,
      })
      .from(workItems)
      .where(sql`${workItems.reviewedAt} >= ${periodStart}`)
      .groupBy(sql`DATE(${workItems.reviewedAt})`)
      .orderBy(sql`DATE(${workItems.reviewedAt})`);

    // Translator performance
    const translatorPerformance = await db
      .select({
        translatorId: workItemAssignments.translatorId,
        username: users.username,
        totalCompleted: sql<number>`COUNT(*)`,
        approved: sql<number>`COUNT(CASE WHEN ${workItems.status} = 'approved' THEN 1 END)`,
        avgTime: sql<number>`AVG(CASE 
          WHEN ${workItems.reviewedAt} IS NOT NULL AND ${workItems.submittedAt} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${workItems.reviewedAt} - ${workItems.submittedAt})) / 3600 
          END)`,
      })
      .from(workItemAssignments)
      .innerJoin(workPackets, eq(workItemAssignments.packetId, workPackets.id))
      .innerJoin(workItems, eq(workPackets.id, workItems.packetId))
      .innerJoin(users, eq(workItemAssignments.translatorId, users.id))
      .where(sql`${workItems.reviewedAt} >= ${periodStart}`)
      .groupBy(workItemAssignments.translatorId, users.username);

    const performanceWithRates = translatorPerformance
      .filter(p => p.translatorId !== null)
      .map(p => ({
        translatorId: p.translatorId as number,
        username: p.username,
        totalCompleted: p.totalCompleted,
        approvalRate: p.totalCompleted > 0 ? Number(((p.approved / p.totalCompleted) * 100).toFixed(1)) : 0,
        avgTimePerItem: Number((p.avgTime || 0).toFixed(2)),
      }));

    // Quality metrics
    const [overallStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        approved: sql<number>`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        avgPerDay: sql<number>`COUNT(*) / GREATEST(DATE_PART('day', NOW() - ${periodStart}), 1)`,
      })
      .from(workItems)
      .where(sql`${workItems.reviewedAt} >= ${periodStart}`);

    const overallApprovalRate = overallStats.total > 0 ? 
      Number(((overallStats.approved / overallStats.total) * 100).toFixed(1)) : 0;

    // Peak production hour (simplified - using current hour as mock data)
    const peakProductionHour = new Date().getHours();

    // Common rejection reasons (mock data for now)
    const commonRejectionReasons = [
      { reason: "مشاكل في الجودة اللغوية", count: 15 },
      { reason: "عدم اتباع التعليمات", count: 12 },
      { reason: "أخطاء في الترجمة", count: 8 },
    ];

    // Workflow analytics - simplified bottleneck analysis
    const bottlenecks = [
      { stage: "في المراجعة", avgWaitTime: 2.5, itemCount: await this.getQueueCount('in_qa') },
      { stage: "في الترجمة", avgWaitTime: 4.2, itemCount: await this.getQueueCount('in_progress') },
      { stage: "في الانتظار", avgWaitTime: 1.8, itemCount: await this.getQueueCount('pending') },
    ];

    const completionTimes = [
      { stage: "الترجمة", avgTime: 3.5 },
      { stage: "المراجعة", avgTime: 1.2 },
      { stage: "المعالجة", avgTime: 0.5 },
    ];

    // Content analytics
    const sourceTypes = await db
      .select({
        type: sources.tags,
        count: sql<number>`COUNT(DISTINCT ${workItems.id})`,
        avgQuality: sql<number>`AVG(CASE WHEN ${workItems.status} = 'approved' THEN 100.0 ELSE 0.0 END)`,
      })
      .from(sources)
      .innerJoin(workPackets, eq(sources.id, workPackets.sourceId))
      .innerJoin(workItems, eq(workPackets.id, workItems.packetId))
      .where(sql`${workItems.reviewedAt} >= ${periodStart}`)
      .groupBy(sources.tags);

    const templateEffectiveness = await db
      .select({
        templateId: instructionTemplates.id,
        name: instructionTemplates.name,
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`COUNT(CASE WHEN ${workItems.status} = 'approved' THEN 1 END)`,
      })
      .from(instructionTemplates)
      .innerJoin(workPackets, eq(instructionTemplates.id, workPackets.templateId))
      .innerJoin(workItems, eq(workPackets.id, workItems.packetId))
      .where(sql`${workItems.reviewedAt} >= ${periodStart}`)
      .groupBy(instructionTemplates.id, instructionTemplates.name);

    const templateSuccess = templateEffectiveness.map(t => ({
      templateId: t.templateId,
      name: t.name,
      successRate: t.total > 0 ? Number(((t.successful / t.total) * 100).toFixed(1)) : 0,
    }));

    const styleTagUsage = await db
      .select({
        tagId: styleTags.id,
        name: styleTags.name,
        usage: sql<number>`COUNT(*)`,
        quality: sql<number>`AVG(CASE WHEN ${workItems.status} = 'approved' THEN 100.0 ELSE 0.0 END)`,
      })
      .from(styleTags)
      .innerJoin(workPackets, eq(styleTags.id, workPackets.styleTagId))
      .innerJoin(workItems, eq(workPackets.id, workItems.packetId))
      .where(sql`${workItems.reviewedAt} >= ${periodStart}`)
      .groupBy(styleTags.id, styleTags.name);

    return {
      productionTrends,
      translatorPerformance: performanceWithRates,
      qualityMetrics: {
        overallApprovalRate,
        avgItemsPerDay: Number(overallStats.avgPerDay.toFixed(1)),
        peakProductionHour,
        commonRejectionReasons,
      },
      workflowAnalytics: {
        bottlenecks,
        completionTimes,
      },
      contentAnalytics: {
        sourceTypes: sourceTypes.map(s => ({
          type: Array.isArray(s.type) ? s.type.join(', ') : (s.type || 'غير محدد'),
          count: s.count,
          avgQuality: Number(s.avgQuality.toFixed(1)),
        })),
        templateEffectiveness: templateSuccess,
        styleTagUsage: styleTagUsage.map(s => ({
          tagId: s.tagId,
          name: s.name,
          usage: s.usage,
          quality: Number(s.quality.toFixed(1)),
        })),
      },
    };
  }

  private async getQueueCount(status: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(workItems)
      .where(eq(workItems.status, status));
    return result.count;
  }

  async getApprovedWorkItems(filters?: {
    taskType?: string;
    translatorId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<any[]> {
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

    // Join with work packets to get style tag information
    const itemsWithStyle = await db
      .select({
        id: workItems.id,
        sourceText: workItems.sourceText,
        targetText: workItems.targetText,
        qualityScore: workItems.qualityScore,
        reviewedAt: workItems.reviewedAt,
        packetId: workItems.packetId,
        styleTagId: workPackets.styleTagId,
        styleName: styleTags.name,
        styleDescription: styleTags.description,
        taskType: instructionTemplates.taskType,
        templateName: instructionTemplates.name,
        assignedToId: workItems.assignedTo,
        translatorUsername: users.username,
      })
      .from(workItems)
      .innerJoin(workPackets, eq(workItems.packetId, workPackets.id))
      .leftJoin(styleTags, eq(workPackets.styleTagId, styleTags.id))
      .leftJoin(instructionTemplates, eq(workPackets.templateId, instructionTemplates.id))
      .leftJoin(users, eq(workItems.assignedTo, users.id))
      .where(and(...conditions))
      .orderBy(desc(workItems.reviewedAt));

    return itemsWithStyle;
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
  
  async deleteApprovedTerm(id: number): Promise<void> {
    await db.delete(approvedTerms).where(eq(approvedTerms.id, id));
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
  
  // Word suggestions implementation
  async createWordSuggestion(suggestion: InsertWordSuggestion): Promise<WordSuggestion> {
    const [newSuggestion] = await db
      .insert(wordSuggestions)
      .values(suggestion)
      .returning();
    return newSuggestion;
  }

  async getWordSuggestionsByStatus(status: string): Promise<WordSuggestion[]> {
    return await db.select()
      .from(wordSuggestions)
      .where(eq(wordSuggestions.status, status))
      .orderBy(desc(wordSuggestions.createdAt));
  }

  async updateWordSuggestionStatus(
    id: number, 
    status: string, 
    reviewedBy: number, 
    reviewNotes?: string
  ): Promise<void> {
    await db.update(wordSuggestions)
      .set({ 
        status, 
        reviewedBy, 
        reviewNotes,
        reviewedAt: new Date()
      })
      .where(eq(wordSuggestions.id, id));
  }
  
  // Platform Features implementation
  async getAllPlatformFeatures(): Promise<PlatformFeature[]> {
    return await db.select()
      .from(platformFeatures)
      .orderBy(platformFeatures.category, platformFeatures.featureName);
  }
  
  async updatePlatformFeature(featureKey: string, isEnabled: boolean, updatedBy: number): Promise<void> {
    await db.update(platformFeatures)
      .set({ 
        isEnabled, 
        updatedBy,
        updatedAt: new Date()
      })
      .where(eq(platformFeatures.featureKey, featureKey));
  }
  
  async getPlatformFeature(featureKey: string): Promise<PlatformFeature | undefined> {
    const [feature] = await db.select()
      .from(platformFeatures)
      .where(eq(platformFeatures.featureKey, featureKey));
    return feature || undefined;
  }
  
  async initializePlatformFeatures(): Promise<void> {
    const defaultFeatures: InsertPlatformFeature[] = [
      // Core Features
      {
        featureKey: "user_management",
        featureName: "إدارة المستخدمين",
        description: "إمكانية إنشاء وإدارة المستخدمين والأدوار",
        category: "core",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "source_management",
        featureName: "إدارة المصادر",
        description: "إمكانية إضافة وإدارة مصادر النصوص",
        category: "core",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "template_management",
        featureName: "إدارة القوالب",
        description: "إمكانية إنشاء وإدارة قوالب التعليمات",
        category: "core",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "work_packet_creation",
        featureName: "إنشاء حزم العمل",
        description: "إمكانية إنشاء وتوزيع حزم العمل",
        category: "core",
        isEnabled: true,
        dependencies: ["source_management", "template_management"],
        updatedBy: null
      },
      
      // Translation Features
      {
        featureKey: "translator_workspace",
        featureName: "مساحة عمل المترجم",
        description: "واجهة العمل الرئيسية للمترجمين",
        category: "translation",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "approved_terms",
        featureName: "المصطلحات المعتمدة",
        description: "نظام المصطلحات المعتمدة والاقتراحات التلقائية",
        category: "translation",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "style_tags",
        featureName: "تصنيفات الأسلوب",
        description: "نظام تصنيف الأساليب اللغوية",
        category: "translation",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "contextual_lexicon",
        featureName: "المعجم السياقي",
        description: "نظام المعجم السياقي والبدائل اللغوية",
        category: "translation",
        isEnabled: true,
        dependencies: ["style_tags"],
        updatedBy: null
      },
      {
        featureKey: "word_suggestions",
        featureName: "اقتراحات الكلمات",
        description: "نظام اقتراح الكلمات من المترجمين",
        category: "translation",
        isEnabled: true,
        dependencies: ["contextual_lexicon", "style_tags"],
        updatedBy: null
      },
      {
        featureKey: "contextual_word_assistant",
        featureName: "مساعد الكلمات السياقي",
        description: "المساعد الذكي لاقتراح الكلمات أثناء الترجمة",
        category: "translation",
        isEnabled: true,
        dependencies: ["contextual_lexicon", "style_tags"],
        updatedBy: null
      },
      
      // Quality Features
      {
        featureKey: "qa_review",
        featureName: "مراجعة الجودة",
        description: "نظام مراجعة الجودة والموافقة على الترجمات",
        category: "quality",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "qa_feedback",
        featureName: "ملاحظات المراجعة",
        description: "إمكانية إضافة ملاحظات وتعليقات على الترجمات",
        category: "quality",
        isEnabled: true,
        dependencies: ["qa_review"],
        updatedBy: null
      },
      
      // Data Features
      {
        featureKey: "data_export",
        featureName: "تصدير البيانات",
        description: "إمكانية تصدير البيانات بصيغ مختلفة",
        category: "data",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "dashboard_analytics",
        featureName: "إحصائيات لوحة التحكم",
        description: "عرض الإحصائيات والتحليلات في لوحة التحكم",
        category: "data",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      
      // User Features
      {
        featureKey: "user_authentication",
        featureName: "المصادقة",
        description: "نظام تسجيل الدخول والمصادقة",
        category: "user",
        isEnabled: true,
        dependencies: null,
        updatedBy: null
      },
      {
        featureKey: "role_based_access",
        featureName: "التحكم بالصلاحيات",
        description: "نظام الأدوار والصلاحيات",
        category: "user",
        isEnabled: true,
        dependencies: ["user_authentication"],
        updatedBy: null
      }
    ];
    
    // Insert only features that don't exist
    for (const feature of defaultFeatures) {
      const existing = await this.getPlatformFeature(feature.featureKey);
      if (!existing) {
        await db.insert(platformFeatures).values(feature);
      }
    }
  }
}

export const storage = new DatabaseStorage();
