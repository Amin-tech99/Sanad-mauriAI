import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("translator"), // admin, translator, qa
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: text("status").notNull().default("pending"), // pending, processing, completed
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const instructionTemplates = pgTable("instruction_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  taskType: text("task_type").notNull(), // sentence, paragraph, summarization
  instructions: text("instructions").notNull(),
  outputFormat: jsonb("output_format").$type<Record<string, any>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const workPackets = pgTable("work_packets", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id),
  templateId: integer("template_id").references(() => instructionTemplates.id),
  unitType: text("unit_type").notNull(), // sentence, paragraph
  styleTagId: integer("style_tag_id").references(() => styleTags.id), // Style tag for the work packet
  status: text("status").notNull().default("active"), // active, completed, archived
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const workItems = pgTable("work_items", {
  id: serial("id").primaryKey(),
  packetId: integer("packet_id").references(() => workPackets.id),
  sourceText: text("source_text").notNull(),
  targetText: text("target_text"),
  status: text("status").notNull().default("pending"), // pending, in_progress, in_qa, approved, rejected
  assignedTo: integer("assigned_to").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  qualityScore: integer("quality_score"), // 1-5 scale
  sequenceNumber: integer("sequence_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
});

export const workItemAssignments = pgTable("work_item_assignments", {
  id: serial("id").primaryKey(),
  packetId: integer("packet_id").references(() => workPackets.id),
  translatorId: integer("translator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdSources: many(sources),
  createdTemplates: many(instructionTemplates),
  createdPackets: many(workPackets),
  assignedItems: many(workItems, { relationName: "assignedItems" }),
  reviewedItems: many(workItems, { relationName: "reviewedItems" }),
  assignments: many(workItemAssignments),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  creator: one(users, {
    fields: [sources.createdBy],
    references: [users.id],
  }),
  workPackets: many(workPackets),
}));

export const instructionTemplatesRelations = relations(instructionTemplates, ({ one, many }) => ({
  creator: one(users, {
    fields: [instructionTemplates.createdBy],
    references: [users.id],
  }),
  workPackets: many(workPackets),
}));

export const workPacketsRelations = relations(workPackets, ({ one, many }) => ({
  source: one(sources, {
    fields: [workPackets.sourceId],
    references: [sources.id],
  }),
  template: one(instructionTemplates, {
    fields: [workPackets.templateId],
    references: [instructionTemplates.id],
  }),
  creator: one(users, {
    fields: [workPackets.createdBy],
    references: [users.id],
  }),
  workItems: many(workItems),
  assignments: many(workItemAssignments),
}));

export const workItemsRelations = relations(workItems, ({ one }) => ({
  packet: one(workPackets, {
    fields: [workItems.packetId],
    references: [workPackets.id],
  }),
  assignee: one(users, {
    fields: [workItems.assignedTo],
    references: [users.id],
    relationName: "assignedItems",
  }),
  reviewer: one(users, {
    fields: [workItems.reviewedBy],
    references: [users.id],
    relationName: "reviewedItems",
  }),
}));

export const workItemAssignmentsRelations = relations(workItemAssignments, ({ one }) => ({
  packet: one(workPackets, {
    fields: [workItemAssignments.packetId],
    references: [workPackets.id],
  }),
  translator: one(users, {
    fields: [workItemAssignments.translatorId],
    references: [users.id],
  }),
}));

// Approved Terms Table for Hassaniya consistency
export const approvedTerms = pgTable("approved_terms", {
  id: serial("id").primaryKey(),
  arabicTerm: text("arabic_term").notNull(),
  hassaniyaTerm: text("hassaniya_term").notNull(),
  context: text("context"), // Optional context for disambiguation
  category: text("category"), // Optional category (e.g., religious, technical, etc.)
  frequency: integer("frequency").default(0), // Usage frequency for better suggestions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Style Tags table for dynamic style management
export const styleTags = pgTable("style_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  guidelines: text("guidelines").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contextual Lexicon table for word alternatives
export const contextualLexicon = pgTable("contextual_lexicon", {
  id: serial("id").primaryKey(),
  baseWord: text("base_word").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Word Alternatives table (many-to-one with contextualLexicon)
export const wordAlternatives = pgTable("word_alternatives", {
  id: serial("id").primaryKey(),
  lexiconId: integer("lexicon_id").notNull().references(() => contextualLexicon.id),
  alternativeWord: text("alternative_word").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Many-to-many relationship between word alternatives and style tags
export const wordAlternativeStyleTags = pgTable("word_alternative_style_tags", {
  id: serial("id").primaryKey(),
  alternativeId: integer("alternative_id").notNull().references(() => wordAlternatives.id),
  styleTagId: integer("style_tag_id").notNull().references(() => styleTags.id),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertSourceSchema = createInsertSchema(sources).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(instructionTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertWorkPacketSchema = createInsertSchema(workPackets).omit({
  id: true,
  createdAt: true,
});

export const insertWorkItemSchema = createInsertSchema(workItems).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
  reviewedAt: true,
});

export const insertApprovedTermSchema = createInsertSchema(approvedTerms).omit({
  id: true,
  createdAt: true,
  frequency: true,
});

export const insertStyleTagSchema = createInsertSchema(styleTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContextualLexiconSchema = createInsertSchema(contextualLexicon).omit({
  id: true,
  createdAt: true,
});

export const insertWordAlternativeSchema = createInsertSchema(wordAlternatives).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Source = typeof sources.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type InstructionTemplate = typeof instructionTemplates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type WorkPacket = typeof workPackets.$inferSelect;
export type InsertWorkPacket = z.infer<typeof insertWorkPacketSchema>;
export type WorkItem = typeof workItems.$inferSelect;
export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type WorkItemAssignment = typeof workItemAssignments.$inferSelect;
export type ApprovedTerm = typeof approvedTerms.$inferSelect;
export type InsertApprovedTerm = z.infer<typeof insertApprovedTermSchema>;
export type StyleTag = typeof styleTags.$inferSelect;
export type InsertStyleTag = z.infer<typeof insertStyleTagSchema>;
export type ContextualLexicon = typeof contextualLexicon.$inferSelect;
export type InsertContextualLexicon = z.infer<typeof insertContextualLexiconSchema>;
export type WordAlternative = typeof wordAlternatives.$inferSelect;
export type InsertWordAlternative = z.infer<typeof insertWordAlternativeSchema>;
