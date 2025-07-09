import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import crypto from "crypto";

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    state?: string;
    lineSessionId?: string;
  }
}

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "2007715339";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "b460b2284525afa0b5708011399a53ae";
const BASE_URL = process.env.REPLIT_DOMAINS?.split(',')[0] || "localhost:5000";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'line-oauth-demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Line OAuth login endpoint
  app.get("/api/auth/line", (req, res) => {
    const state = crypto.randomBytes(32).toString('hex');
    req.session.state = state;
    
    const callbackUrl = `${req.protocol}://${BASE_URL}/api/auth/line/callback`;
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile`;
    
    res.json({ authUrl: lineAuthUrl });
  });

  // Line OAuth callback endpoint
  app.get("/api/auth/line/callback", async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || !state || state !== req.session.state) {
      return res.status(400).json({ error: "Invalid authorization code or state" });
    }

    try {
      const callbackUrl = `${req.protocol}://${BASE_URL}/api/auth/line/callback`;
      
      // Exchange code for access token
      const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: callbackUrl,
          client_id: LINE_CHANNEL_ID,
          client_secret: LINE_CHANNEL_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user profile
      const profileResponse = await fetch("https://api.line.me/v2/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const profile = await profileResponse.json();

      // Create session
      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours from now

      const lineSession = await storage.createLineSession({
        userId: profile.userId,
        displayName: profile.displayName,
        statusMessage: profile.statusMessage || "",
        pictureUrl: profile.pictureUrl || "",
        accessToken,
        sessionId,
        expiresAt,
      });

      req.session.lineSessionId = sessionId;
      
      // Redirect to frontend with success
      res.redirect(`${req.protocol}://${BASE_URL}/?auth=success`);
    } catch (error) {
      console.error("Line OAuth error:", error);
      res.redirect(`${req.protocol}://${BASE_URL}/?auth=error`);
    }
  });

  // Get current user session
  app.get("/api/auth/me", async (req, res) => {
    const sessionId = req.session.lineSessionId;
    if (!sessionId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const lineSession = await storage.getLineSession(sessionId);
    if (!lineSession) {
      return res.status(401).json({ error: "Session expired" });
    }

    res.json({
      userId: lineSession.userId,
      displayName: lineSession.displayName,
      statusMessage: lineSession.statusMessage,
      pictureUrl: lineSession.pictureUrl,
      loginTime: lineSession.createdAt,
    });
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.session.lineSessionId;
    if (sessionId) {
      await storage.deleteLineSession(sessionId);
      req.session.destroy(() => {});
    }
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
