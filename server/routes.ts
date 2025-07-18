import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertSourceSchema, 
  insertTemplateSchema, 
  insertWorkPacketSchema,
  insertUserSchema,
  insertApprovedTermSchema,
  insertStyleTagSchema,
  insertContextualLexiconSchema
} from "@shared/schema";
import { z } from "zod";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export function registerRoutes(app: Express): Server {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Sources routes
  app.get("/api/sources", requireAuth, async (req, res) => {
    try {
      const sources = await storage.getAllSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  app.post("/api/sources", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const sourceData = insertSourceSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const source = await storage.createSource(sourceData);
      
      // Update status to processing (simulate processing)
      await storage.updateSourceStatus(source.id, "processing");
      
      res.status(201).json(source);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid source data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create source" });
    }
  });

  // Templates routes
  app.get("/api/templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid template data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Work packets routes
  app.get("/api/work-packets", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const packets = await storage.getAllWorkPackets();
      res.json(packets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work packets" });
    }
  });

  app.post("/api/work-packets", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { sourceId, templateId, unitType, translatorIds, styleTagId } = req.body;
      
      // Create work packet
      const packetData = insertWorkPacketSchema.parse({
        sourceId,
        templateId,
        unitType,
        createdBy: req.user!.id,
        styleTagId: styleTagId || null,
      });
      
      const packet = await storage.createWorkPacket(packetData);
      
      // Get source content and split based on unit type
      const source = await storage.getSourceById(sourceId);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      
      let textUnits: string[];
      if (unitType === "paragraph") {
        // Split by double newlines or multiple newlines, filter empty paragraphs
        textUnits = source.content
          .split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(p => p.length > 20); // Minimum 20 characters for a valid paragraph
      } else {
        // Enhanced Arabic sentence splitting
        // Handle Arabic punctuation: ؟ ! . ؛ ،
        textUnits = source.content
          .split(/[.!?؟؛]+/)
          .map(s => s.trim())
          .filter(s => s.length > 10) // Minimum 10 characters for a valid sentence
          .map(s => {
            // Remove trailing commas or incomplete punctuation
            return s.replace(/[،,]+$/, '').trim();
          });
      }
      
      // Create work items
      const workItems = textUnits.map((text, index) => ({
        packetId: packet.id,
        sourceText: text.trim(),
        status: "pending" as const,
        assignedTo: translatorIds[index % translatorIds.length], // Round-robin assignment
        sequenceNumber: index + 1,
      }));
      
      await storage.createWorkItems(workItems);
      
      // Create assignments
      const assignments = translatorIds.map((translatorId: number) => ({
        packetId: packet.id,
        translatorId,
      }));
      
      await storage.createWorkItemAssignments(assignments);
      
      res.status(201).json(packet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid work packet data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create work packet" });
    }
  });

  // Work items routes
  app.get("/api/my-work", requireAuth, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "translator") {
        return res.status(403).json({ error: "Only translators can access their work items" });
      }
      
      const workItems = await storage.getWorkItemsByAssignee(req.user!.id);
      
      // Enhance work items with packet details including style tag
      const enhancedItems = await Promise.all(workItems.map(async (item) => {
        const packet = await storage.getWorkPacketById(item.packetId);
        let styleTag = null;
        if (packet?.styleTagId) {
          styleTag = await storage.getStyleTag(packet.styleTagId);
        }
        return {
          ...item,
          packet: packet,
          styleTag: styleTag
        };
      }));
      
      res.json(enhancedItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work items" });
    }
  });

  app.get("/api/qa-queue", requireAuth, requireRole(["qa", "admin"]), async (req, res) => {
    try {
      const workItems = await storage.getWorkItemsForQA();
      res.json(workItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch QA queue" });
    }
  });

  app.get("/api/work-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workItem = await storage.getWorkItemById(id);
      
      if (!workItem) {
        return res.status(404).json({ error: "Work item not found" });
      }
      
      // Check permissions
      if (req.user!.role === "translator" && workItem.assignedTo !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to view this work item" });
      }
      
      res.json(workItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work item" });
    }
  });

  app.patch("/api/work-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { targetText, status, rejectionReason, qualityScore } = req.body;
      
      const workItem = await storage.getWorkItemById(id);
      if (!workItem) {
        return res.status(404).json({ error: "Work item not found" });
      }
      
      // Check permissions based on action
      if (status === "in_qa") {
        // Translator submitting for QA
        if (req.user!.role !== "translator" || workItem.assignedTo !== req.user!.id) {
          return res.status(403).json({ error: "Not authorized" });
        }
      } else if (status === "approved" || status === "rejected") {
        // QA reviewing
        if (!["qa", "admin"].includes(req.user!.role)) {
          return res.status(403).json({ error: "Not authorized" });
        }
      }
      
      const updates: any = {};
      if (targetText !== undefined) updates.targetText = targetText;
      if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;
      if (qualityScore !== undefined) updates.qualityScore = qualityScore;
      if (status === "approved" || status === "rejected") updates.reviewedBy = req.user!.id;
      
      await storage.updateWorkItemStatus(id, status, updates);
      
      const updatedItem = await storage.getWorkItemById(id);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update work item" });
    }
  });

  // Users management (admin only)
  app.get("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password (will be done in auth middleware)
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id/status", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updateUserStatus(id, isActive);
      res.json({ message: "User status updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Data export
  app.get("/api/export", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { format, taskType, translatorId, fromDate, toDate } = req.query;
      
      const filters: any = {};
      if (taskType) filters.taskType = taskType as string;
      if (translatorId) filters.translatorId = parseInt(translatorId as string);
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      
      const workItems = await storage.getApprovedWorkItems(filters);
      
      if (format === "jsonl") {
        const jsonlData = workItems.map(item => ({
          source_text: item.sourceText,
          target_text: item.targetText,
          quality_score: item.qualityScore,
          reviewed_at: item.reviewedAt,
        })).map(item => JSON.stringify(item)).join('\n');
        
        res.setHeader('Content-Type', 'application/jsonl');
        res.setHeader('Content-Disposition', 'attachment; filename="translations.jsonl"');
        res.send(jsonlData);
      } else {
        // CSV format
        const csvData = [
          'source_text,target_text,quality_score,reviewed_at',
          ...workItems.map(item => 
            `"${item.sourceText}","${item.targetText}",${item.qualityScore},"${item.reviewedAt}"`
          )
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="translations.csv"');
        res.send(csvData);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });
  
  // Approved Terms Routes
  app.get("/api/approved-terms/search", requireAuth, async (req, res, next) => {
    try {
      const query = req.query.q as string;
      const terms = await storage.searchApprovedTerms(query);
      res.json(terms);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/approved-terms/:id/increment", requireAuth, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      await storage.incrementTermFrequency(id);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/approved-terms", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const terms = await storage.getAllApprovedTerms();
      res.json(terms);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/approved-terms", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const validatedData = insertApprovedTermSchema.parse(req.body);
      const term = await storage.createApprovedTerm(validatedData);
      res.status(201).json(term);
    } catch (error) {
      next(error);
    }
  });
  
  // Style Tags routes
  app.get("/api/style-tags", requireAuth, async (req, res, next) => {
    try {
      const tags = await storage.getStyleTags();
      res.json(tags);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/style-tags/:id", requireAuth, async (req, res, next) => {
    try {
      const tag = await storage.getStyleTag(parseInt(req.params.id));
      if (!tag) {
        return res.status(404).json({ error: "Style tag not found" });
      }
      res.json(tag);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/style-tags", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const validatedData = insertStyleTagSchema.parse(req.body);
      const tag = await storage.createStyleTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/style-tags/:id", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const tag = await storage.updateStyleTag(parseInt(req.params.id), req.body);
      res.json(tag);
    } catch (error) {
      next(error);
    }
  });
  
  // Contextual Lexicon routes
  app.get("/api/contextual-lexicon", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const lexicon = await storage.getContextualLexiconWithAlternatives();
      res.json(lexicon);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/contextual-lexicon", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const validatedData = insertContextualLexiconSchema.parse(req.body);
      const entry = await storage.createContextualLexiconEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/contextual-lexicon/:id/alternatives", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const { alternativeWord, styleTagIds } = req.body;
      const alternative = await storage.addWordAlternative(
        parseInt(req.params.id),
        alternativeWord,
        styleTagIds || []
      );
      res.status(201).json(alternative);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/contextual-lexicon/check", requireAuth, async (req, res, next) => {
    try {
      const { word } = req.query;
      if (!word) {
        return res.json([]);
      }
      const alternatives = await storage.getWordAlternativesByBaseWord(word as string);
      res.json(alternatives);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
