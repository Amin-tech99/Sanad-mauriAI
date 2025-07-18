import { 
  users, 
  sources, 
  instructionTemplates, 
  workPackets, 
  workItems, 
  workItemAssignments,
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
  type WorkItemAssignment
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
      .orderBy(workItems.sequenceNumber);
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
}

export const storage = new DatabaseStorage();
