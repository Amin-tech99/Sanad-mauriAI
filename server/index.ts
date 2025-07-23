import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureAdminUser } from "./auth";
import { exec } from "child_process";
import { promisify } from "util";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";

const execAsync = promisify(exec);

async function runMigrations() {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('Running database migrations...');
      await execAsync('npm run db:push');
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Database migration failed:', error);
      // Don't exit the process, let the app start anyway
      // The database might already be up to date
    }
  }
}

async function initializePlatformFeatures() {
  try {
    console.log('Initializing platform features...');
    
    // Create the platform_features table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_features (
        id SERIAL PRIMARY KEY,
        feature_key TEXT NOT NULL UNIQUE,
        feature_name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        dependencies TEXT[],
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id)
      )
    `);
    
    console.log("Platform features table created or already exists");
    
    // Initialize default features (16 services)
    await storage.initializePlatformFeatures();
    console.log("Platform features initialized successfully - 16 services available");
    
  } catch (error) {
    console.error("Error initializing platform features:", error);
    // Don't exit the process, let the app start anyway
  }
}

export async function createServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Server error:', err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('app.get("env"):', app.get("env"));
  
  if (process.env.NODE_ENV === "development") {
    console.log('Setting up Vite development server...');
    await setupVite(app, server);
  } else {
    console.log('Setting up static file serving...');
    serveStatic(app);
  }

  return app;
}

(async () => {
  try {
    // Run database migrations in production
    await runMigrations();
    
    // Initialize platform features (16 services)
    await initializePlatformFeatures();
    
    // Ensure hardcoded admin user exists
    await ensureAdminUser();
    
    const app = await createServer();
    
    const port = parseInt(process.env.PORT || '5000', 10);
    app.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      console.log(`Server running at http://localhost:${port}`);
      console.log(`API endpoints available at http://localhost:${port}/api/*`);
      console.log(`Platform Control available at http://localhost:${port}/platform-control`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
