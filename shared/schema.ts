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
  createdConversations: many(conversations, { relationName: "createdConversations" }),
  assignedConversations: many(conversations, { relationName: "assignedConversations" }),
  translatedMessages: many(conversationMessages, { relationName: "translatedMessages" }),
  reviewedMessages: many(conversationMessages, { relationName: "reviewedMessages" }),
  conversationAssignments: many(conversationAssignments, { relationName: "conversationAssignments" }),
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

// Word suggestions table (for translator contributions)
export const wordSuggestions = pgTable("word_suggestions", {
  id: serial("id").primaryKey(),
  suggestedBy: integer("suggested_by").references(() => users.id).notNull(),
  baseWord: text("base_word").notNull(),
  alternativeWord: text("alternative_word").notNull(),
  styleTagId: integer("style_tag_id").references(() => styleTags.id).notNull(),
  workItemId: integer("work_item_id").references(() => workItems.id),
  context: text("context"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// Insert schema for word suggestions
export const insertWordSuggestionSchema = createInsertSchema(wordSuggestions)
  .omit({ id: true, createdAt: true, reviewedAt: true });

// Conversations table for customer support conversation uploads
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  customerType: text("customer_type"), // new, returning, vip, premium
  urgencyLevel: text("urgency_level"), // low, medium, high, urgent
  category: text("category"), // billing, technical, complaint, inquiry, general
  originalLanguage: text("original_language").notNull().default("arabic"),
  targetLanguage: text("target_language").notNull().default("hassaniya"),
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, completed, reviewed
  totalMessages: integer("total_messages").notNull().default(0),
  userMessages: integer("user_messages").notNull().default(0), // Only user messages that need translation
  agentMessages: integer("agent_messages").notNull().default(0), // Agent messages (for context only)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  styleTagId: integer("style_tag_id").references(() => styleTags.id), // Style for user messages only
  completedAt: timestamp("completed_at"),
});

// Conversation Messages table for individual messages in conversations
export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  messageOrder: integer("message_order").notNull(), // Order in conversation
  messageType: text("message_type").notNull(), // user, agent, system
  speakerRole: text("speaker_role"), // customer, support_agent, supervisor, system
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text"), // Only for user messages
  needsTranslation: boolean("needs_translation").notNull().default(false), // Only user messages
  context: text("context"), // Additional context for this message
  emotionalTone: text("emotional_tone"), // happy, neutral, frustrated, angry, confused
  translationStatus: text("translation_status").default("pending"), // pending, in_progress, completed, reviewed
  translatedBy: integer("translated_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  qualityScore: integer("quality_score"), // 1-5 scale for translation quality
  translationNotes: text("translation_notes"), // Translator notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  translatedAt: timestamp("translated_at"),
  reviewedAt: timestamp("reviewed_at"),
});

// Conversation Assignments table for assigning conversations to translators
export const conversationAssignments = pgTable("conversation_assignments", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  translatorId: integer("translator_id").notNull().references(() => users.id),
  styleTagId: integer("style_tag_id").references(() => styleTags.id), // Style for this assignment
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
  status: text("status").notNull().default("active"), // active, completed, reassigned
  completedAt: timestamp("completed_at"),
});

// Platform Features table for admin control
export const platformFeatures = pgTable("platform_features", {
  id: serial("id").primaryKey(),
  featureKey: text("feature_key").notNull().unique(),
  featureName: text("feature_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'core', 'translation', 'quality', 'data', 'user'
  isEnabled: boolean("is_enabled").notNull().default(true),
  dependencies: text("dependencies").array(), // Array of feature keys this depends on
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Relations for conversations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  creator: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
    relationName: "createdConversations",
  }),
  assignee: one(users, {
    fields: [conversations.assignedTo],
    references: [users.id],
    relationName: "assignedConversations",
  }),
  styleTag: one(styleTags, {
    fields: [conversations.styleTagId],
    references: [styleTags.id],
  }),
  messages: many(conversationMessages),
  assignments: many(conversationAssignments),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
  translator: one(users, {
    fields: [conversationMessages.translatedBy],
    references: [users.id],
    relationName: "translatedMessages",
  }),
  reviewer: one(users, {
    fields: [conversationMessages.reviewedBy],
    references: [users.id],
    relationName: "reviewedMessages",
  }),
}));

export const conversationAssignmentsRelations = relations(conversationAssignments, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationAssignments.conversationId],
    references: [conversations.id],
  }),
  translator: one(users, {
    fields: [conversationAssignments.translatorId],
    references: [users.id],
    relationName: "conversationAssignments",
  }),
  assignedBy: one(users, {
    fields: [conversationAssignments.assignedBy],
    references: [users.id],
    relationName: "assignedConversations",
  }),
  styleTag: one(styleTags, {
    fields: [conversationAssignments.styleTagId],
    references: [styleTags.id],
  }),
}));

// Insert schemas for conversations
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({
  id: true,
  createdAt: true,
  translatedAt: true,
  reviewedAt: true,
});

export const insertConversationAssignmentSchema = createInsertSchema(conversationAssignments).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
});

// Insert schema for platform features
export const insertPlatformFeatureSchema = createInsertSchema(platformFeatures)
  .omit({ id: true, updatedAt: true });

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
export type WordSuggestion = typeof wordSuggestions.$inferSelect;
export type InsertWordSuggestion = z.infer<typeof insertWordSuggestionSchema>;
export type PlatformFeature = typeof platformFeatures.$inferSelect;
export type InsertPlatformFeature = z.infer<typeof insertPlatformFeatureSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type ConversationAssignment = typeof conversationAssignments.$inferSelect;
export type InsertConversationAssignment = z.infer<typeof insertConversationAssignmentSchema>;
