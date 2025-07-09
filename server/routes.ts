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
    googleSessionId?: string;
  }
}

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "2007715339";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "b460b2284525afa0b5708011399a53ae";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Determine the correct base URL and protocol based on environment
function getBaseUrl(req: any): string {
  // First, check if the request host includes .replit.app (for deployed apps)
  const host = req.get('host');
  if (host?.includes('.replit.app')) {
    return host;
  }
  
  // Check if we're in production (replit.app domain in env)
  if (process.env.REPLIT_DOMAINS?.includes('.replit.app')) {
    // Use the replit.app domain with HTTPS in production
    const replitDomain = process.env.REPLIT_DOMAINS.split(',').find(domain => domain.includes('.replit.app'));
    return replitDomain || 'localhost:5000';
  }
  
  // For development, use the current domain from the request or env
  return process.env.REPLIT_DOMAINS?.split(',')[0] || host || "localhost:5000";
}

function getProtocol(req: any): string {
  // Use HTTPS for replit.app domains or if forwarded headers indicate HTTPS
  if (process.env.REPLIT_DOMAINS?.includes('.replit.app') || 
      req.get('x-forwarded-proto') === 'https' ||
      req.get('host')?.includes('.replit.app')) {
    return 'https';
  }
  // Use the request protocol otherwise
  return req.protocol || 'http';
}

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
    
    const protocol = getProtocol(req);
    const baseUrl = getBaseUrl(req);
    const callbackUrl = `${protocol}://${baseUrl}/api/auth/line/callback`;
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile`;
    
    console.log('Generated LINE auth URL:', lineAuthUrl);
    console.log('Using Channel ID:', LINE_CHANNEL_ID);
    console.log('Using Callback URL:', callbackUrl);
    console.log('Environment:', process.env.REPLIT_DOMAINS ? 'Production' : 'Development');
    
    res.json({ authUrl: lineAuthUrl });
  });

  // Line OAuth callback endpoint
  app.get("/api/auth/line/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query;
    
    console.log('LINE callback received:', { code, state, error, error_description });
    console.log('Session state:', req.session.state);
    
    if (error) {
      console.error('LINE OAuth error:', error, error_description);
      const errorMsg = typeof error_description === 'string' ? error_description : String(error_description);
      const errorCode = typeof error === 'string' ? error : String(error);
      const protocol = getProtocol(req);
      const baseUrl = getBaseUrl(req);
      return res.redirect(`${protocol}://${baseUrl}/?auth=error&reason=${encodeURIComponent(errorMsg || errorCode || 'Unknown error')}`);
    }
    
    if (!code || !state || state !== req.session.state) {
      console.error('Invalid auth params:', { code: !!code, state: !!state, stateMatch: state === req.session.state });
      return res.status(400).json({ error: "Invalid authorization code or state" });
    }

    try {
      const callbackProtocol = getProtocol(req);
      const callbackBaseUrl = getBaseUrl(req);
      const callbackUrl = `${callbackProtocol}://${callbackBaseUrl}/api/auth/line/callback`;
      
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
      const redirectProtocol = getProtocol(req);
      const redirectBaseUrl = getBaseUrl(req);
      res.redirect(`${redirectProtocol}://${redirectBaseUrl}/?auth=success`);
    } catch (error) {
      console.error("Line OAuth error:", error);
      const errorProtocol = getProtocol(req);
      const errorBaseUrl = getBaseUrl(req);
      res.redirect(`${errorProtocol}://${errorBaseUrl}/?auth=error`);
    }
  });

  // Google OAuth login endpoint
  app.get("/api/auth/google", (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Google OAuth not configured" });
    }

    const state = crypto.randomBytes(32).toString('hex');
    req.session.state = state;
    
    const protocol = getProtocol(req);
    const baseUrl = getBaseUrl(req);
    const callbackUrl = `${protocol}://${baseUrl}/api/auth/google/callback`;
    const scopes = 'openid email profile';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    console.log('Generated Google auth URL:', googleAuthUrl);
    console.log('Using Client ID:', GOOGLE_CLIENT_ID);
    console.log('Using Callback URL:', callbackUrl);
    
    res.json({ authUrl: googleAuthUrl });
  });

  // Google OAuth callback endpoint
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query;
    
    console.log('Google callback received:', { code, state, error, error_description });
    console.log('Session state:', req.session.state);
    
    if (error) {
      console.error('Google OAuth error:', error, error_description);
      const errorMsg = typeof error_description === 'string' ? error_description : String(error_description);
      const errorCode = typeof error === 'string' ? error : String(error);
      const protocol = getProtocol(req);
      const baseUrl = getBaseUrl(req);
      return res.redirect(`${protocol}://${baseUrl}/?auth=error&reason=${encodeURIComponent(errorMsg || errorCode || 'Unknown error')}`);
    }
    
    if (!code || !state || state !== req.session.state) {
      console.error('Invalid auth params:', { code: !!code, state: !!state, stateMatch: state === req.session.state });
      return res.status(400).json({ error: "Invalid authorization code or state" });
    }

    try {
      const callbackProtocol = getProtocol(req);
      const callbackBaseUrl = getBaseUrl(req);
      const callbackUrl = `${callbackProtocol}://${callbackBaseUrl}/api/auth/google/callback`;
      
      // Exchange code for access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: callbackUrl,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', errorText);
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;

      // Get user profile
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
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

      const googleSession = await storage.createGoogleSession({
        userId: profile.id,
        email: profile.email,
        name: profile.name,
        pictureUrl: profile.picture || "",
        accessToken,
        refreshToken: refreshToken || "",
        sessionId,
        expiresAt,
      });

      req.session.googleSessionId = sessionId;
      
      // Redirect to frontend with success
      const redirectProtocol = getProtocol(req);
      const redirectBaseUrl = getBaseUrl(req);
      res.redirect(`${redirectProtocol}://${redirectBaseUrl}/?auth=success`);
    } catch (error) {
      console.error("Google OAuth error:", error);
      const errorProtocol = getProtocol(req);
      const errorBaseUrl = getBaseUrl(req);
      res.redirect(`${errorProtocol}://${errorBaseUrl}/?auth=error`);
    }
  });

  // Get current user session
  app.get("/api/auth/me", async (req, res) => {
    const lineSessionId = req.session.lineSessionId;
    const googleSessionId = req.session.googleSessionId;

    // Check Line session first
    if (lineSessionId) {
      const lineSession = await storage.getLineSession(lineSessionId);
      if (lineSession) {
        return res.json({
          provider: 'line',
          userId: lineSession.userId,
          displayName: lineSession.displayName,
          statusMessage: lineSession.statusMessage,
          pictureUrl: lineSession.pictureUrl,
          loginTime: lineSession.createdAt,
        });
      }
    }

    // Check Google session
    if (googleSessionId) {
      const googleSession = await storage.getGoogleSession(googleSessionId);
      if (googleSession) {
        return res.json({
          provider: 'google',
          userId: googleSession.userId,
          displayName: googleSession.name,
          email: googleSession.email,
          statusMessage: null, // Google doesn't have status messages
          pictureUrl: googleSession.pictureUrl,
          loginTime: googleSession.createdAt,
        });
      }
    }

    return res.status(401).json({ error: "Not authenticated" });
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    const lineSessionId = req.session.lineSessionId;
    const googleSessionId = req.session.googleSessionId;
    
    // Delete Line session if exists
    if (lineSessionId) {
      await storage.deleteLineSession(lineSessionId);
    }
    
    // Delete Google session if exists
    if (googleSessionId) {
      await storage.deleteGoogleSession(googleSessionId);
    }
    
    // Destroy the session
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
