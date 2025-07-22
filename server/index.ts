import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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
    const app = await createServer();
    
    const port = parseInt(process.env.PORT || '5000', 10);
    app.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      console.log(`Server running at http://localhost:${port}`);
      console.log(`API endpoints available at http://localhost:${port}/api/*`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
