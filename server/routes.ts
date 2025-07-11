import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { registerAuthRoutes } from "./auth/routes.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'modular-auth-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Register modular authentication routes
  registerAuthRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
