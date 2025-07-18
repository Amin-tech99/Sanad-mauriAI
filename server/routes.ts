import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
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

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

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

  app.delete("/api/sources/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cascade = req.query.cascade === 'true';
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid source ID" });
      }
      
      await storage.deleteSource(id, cascade);
      res.status(200).json({ message: "Source deleted successfully" });
    } catch (error: any) {
      if (error.message?.includes('work packets')) {
        return res.status(400).json({ 
          error: "لا يمكن حذف هذا المصدر لأنه مرتبط بحزم عمل. يجب حذف حزم العمل أولاً.",
          hasWorkPackets: true
        });
      }
      res.status(500).json({ error: "فشل حذف المصدر" });
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
          style: item.styleName || "unknown",
          style_description: item.styleDescription || "",
          task_type: item.taskType || "unknown",
          template_name: item.templateName || "",
          translator: item.translatorUsername || "",
          quality_score: item.qualityScore,
          reviewed_at: item.reviewedAt,
        })).map(item => JSON.stringify(item)).join('\n');
        
        res.setHeader('Content-Type', 'application/jsonl');
        res.setHeader('Content-Disposition', 'attachment; filename="translations.jsonl"');
        res.send(jsonlData);
      } else {
        // CSV format
        const csvData = [
          'source_text,target_text,style,style_description,task_type,template_name,translator,quality_score,reviewed_at',
          ...workItems.map(item => 
            `"${item.sourceText}","${item.targetText}","${item.styleName || 'unknown'}","${item.styleDescription || ''}","${item.taskType || 'unknown'}","${item.templateName || ''}","${item.translatorUsername || ''}",${item.qualityScore},"${item.reviewedAt}"`
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
  
  // Word suggestions routes
  app.post("/api/word-suggestions", requireAuth, async (req, res, next) => {
    try {
      const { baseWord, alternativeWord, styleTagId, workItemId, context } = req.body;
      
      if (!baseWord || !alternativeWord || !styleTagId) {
        return res.status(400).json({ 
          error: "baseWord, alternativeWord, and styleTagId are required" 
        });
      }
      
      const suggestion = await storage.createWordSuggestion({
        suggestedBy: req.user!.id,
        baseWord,
        alternativeWord,
        styleTagId,
        workItemId,
        context,
        status: "pending",
        reviewedBy: null,
        reviewNotes: null
      });
      
      res.status(201).json(suggestion);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/word-suggestions/pending", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const suggestions = await storage.getWordSuggestionsByStatus("pending");
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/word-suggestions/:id", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const { status, reviewNotes } = req.body;
      const id = parseInt(req.params.id);
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      await storage.updateWordSuggestionStatus(id, status, req.user!.id, reviewNotes);
      
      // If approved, add to contextual lexicon
      if (status === "approved") {
        const [suggestion] = await storage.getWordSuggestionsByStatus("approved");
        if (suggestion && suggestion.id === id) {
          // Find or create lexicon entry
          const existingLexicon = await storage.getContextualLexicon();
          const lexiconEntry = existingLexicon.find(l => l.baseWord === suggestion.baseWord);
          
          if (lexiconEntry) {
            await storage.addWordAlternative(
              lexiconEntry.id, 
              suggestion.alternativeWord, 
              [suggestion.styleTagId]
            );
          } else {
            const newEntry = await storage.createContextualLexiconEntry({
              baseWord: suggestion.baseWord
            });
            await storage.addWordAlternative(
              newEntry.id, 
              suggestion.alternativeWord, 
              [suggestion.styleTagId]
            );
          }
        }
      }
      
      res.json({ message: "Word suggestion updated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Platform Features routes
  app.get("/api/platform-features", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const features = await storage.getAllPlatformFeatures();
      res.json(features);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/platform-features/:featureKey", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const { featureKey } = req.params;
      const { isEnabled } = req.body;
      
      if (typeof isEnabled !== "boolean") {
        return res.status(400).json({ error: "isEnabled must be a boolean" });
      }
      
      // Check if feature exists
      const feature = await storage.getPlatformFeature(featureKey);
      if (!feature) {
        return res.status(404).json({ error: "Feature not found" });
      }
      
      // Check dependencies - can't disable a feature if other enabled features depend on it
      if (!isEnabled) {
        const allFeatures = await storage.getAllPlatformFeatures();
        const dependentFeatures = allFeatures.filter(f => 
          f.isEnabled && 
          f.dependencies && 
          f.dependencies.includes(featureKey)
        );
        
        if (dependentFeatures.length > 0) {
          return res.status(400).json({ 
            error: "Cannot disable this feature as other features depend on it",
            dependentFeatures: dependentFeatures.map(f => f.featureName)
          });
        }
      }
      
      // Check if all dependencies are enabled before enabling a feature
      if (isEnabled && feature.dependencies && feature.dependencies.length > 0) {
        const dependencies = await Promise.all(
          feature.dependencies.map(dep => storage.getPlatformFeature(dep))
        );
        
        const disabledDependencies = dependencies.filter(dep => dep && !dep.isEnabled);
        if (disabledDependencies.length > 0) {
          return res.status(400).json({ 
            error: "Cannot enable this feature as some dependencies are disabled",
            disabledDependencies: disabledDependencies.map(d => d!.featureName)
          });
        }
      }
      
      await storage.updatePlatformFeature(featureKey, isEnabled, req.user!.id);
      res.json({ message: "Feature updated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Feature check endpoint for frontend
  app.get("/api/feature-check/:featureKey", requireAuth, async (req, res, next) => {
    try {
      const { featureKey } = req.params;
      const feature = await storage.getPlatformFeature(featureKey);
      
      if (!feature) {
        return res.json({ isEnabled: false });
      }
      
      res.json({ isEnabled: feature.isEnabled });
    } catch (error) {
      next(error);
    }
  });

  // Backup export endpoint
  app.get("/api/backup/export", requireAuth, requireRole(["admin"]), async (req, res, next) => {
    try {
      const backup = {
        metadata: {
          version: "1.0",
          exportDate: new Date().toISOString(),
          platformName: "Project Sanad",
        },
        data: {
          approvedTerms: await storage.getAllApprovedTerms(),
          styleTags: await storage.getStyleTags(),
          contextualLexicon: await storage.getContextualLexicon(),
          wordSuggestions: await storage.getWordSuggestionsByStatus("approved"),
        },
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="sanad-backup-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(backup);
    } catch (error) {
      next(error);
    }
  });

  // Backup import endpoint
  app.post("/api/backup/import", requireAuth, requireRole(["admin"]), upload.single("backup"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).send("No backup file provided");
      }

      const backupData = JSON.parse(req.file.buffer.toString());
      
      if (!backupData.data || !backupData.metadata) {
        return res.status(400).send("Invalid backup file format");
      }

      const imported = {
        approvedTerms: 0,
        styleTags: 0,
        contextualLexicon: 0,
        wordSuggestions: 0,
      };

      // Import approved terms
      if (backupData.data.approvedTerms) {
        for (const term of backupData.data.approvedTerms) {
          try {
            await storage.createApprovedTerm({
              arabicTerm: term.arabicTerm,
              hassaniyaTerm: term.hassaniyaTerm,
              context: term.context,
              category: term.category,
            });
            imported.approvedTerms++;
          } catch (error) {
            // Skip duplicates
          }
        }
      }

      // Import style tags
      if (backupData.data.styleTags) {
        for (const tag of backupData.data.styleTags) {
          try {
            await storage.createStyleTag({
              name: tag.name,
              description: tag.description,
              color: tag.color,
            });
            imported.styleTags++;
          } catch (error) {
            // Skip duplicates
          }
        }
      }

      // Import contextual lexicon
      if (backupData.data.contextualLexicon) {
        for (const entry of backupData.data.contextualLexicon) {
          try {
            await storage.createContextualLexiconEntry({
              styleTagId: entry.styleTagId,
              arabicWord: entry.arabicWord,
              hassaniyaEquivalents: entry.hassaniyaEquivalents,
              usageExample: entry.usageExample,
              frequency: entry.frequency,
            });
            imported.contextualLexicon++;
          } catch (error) {
            // Skip duplicates
          }
        }
      }

      res.json({
        message: "Backup imported successfully",
        imported,
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
