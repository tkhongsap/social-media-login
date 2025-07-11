import { Express, Request, Response } from 'express';
import { authManager } from './manager.js';
import { storage } from '../storage.js';
import crypto from 'crypto';

// Extend session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    state?: string;
    authSessionId?: string;
  }
}

function getBaseUrl(req: any): string {
  if (process.env.REPLIT_DOMAINS) {
    return process.env.REPLIT_DOMAINS.split(',')[0];
  }
  
  const replyId = process.env.REPL_ID;
  const replOwner = process.env.REPL_OWNER;
  if (replyId && replOwner) {
    return `${replyId}-00-${req.headers['x-replit-user-id'] || 'anonymous'}.${replOwner.toLowerCase()}.replit.dev`;
  }
  
  return req.get('host') || 'localhost:5000';
}

function getProtocol(req: any): string {
  if (process.env.REPLIT_DOMAINS) {
    return 'https';
  }
  return req.protocol || 'http';
}

export function registerAuthRoutes(app: Express) {
  // Get available providers
  app.get("/api/auth/providers", (req, res) => {
    const providers = authManager.getAvailableProviders();
    res.json({ providers });
  });

  // Generic authentication endpoint for any provider
  app.get("/api/auth/:provider", (req, res) => {
    const { provider } = req.params;
    
    if (!authManager.isProviderAvailable(provider)) {
      return res.status(400).json({ error: `Provider ${provider} not available` });
    }

    const state = authManager.generateState();
    req.session.state = state;
    
    const protocol = getProtocol(req);
    const baseUrl = getBaseUrl(req);
    const fullBaseUrl = `${protocol}://${baseUrl}`;
    
    const authUrl = authManager.generateAuthUrl(provider, fullBaseUrl);
    if (!authUrl) {
      return res.status(500).json({ error: `Failed to generate auth URL for ${provider}` });
    }
    
    console.log(`Generated ${provider} auth URL:`, authUrl);
    console.log('Using Base URL:', fullBaseUrl);
    
    res.json({ authUrl });
  });

  // Generic callback endpoint for any provider
  app.get("/api/auth/:provider/callback", async (req, res) => {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query;
    
    console.log(`${provider} callback received:`, { code: !!code, state: !!state, error, error_description });
    console.log('Session state:', req.session.state);
    
    if (error) {
      console.error(`${provider} OAuth error:`, error, error_description);
      const errorMsg = typeof error_description === 'string' ? error_description : String(error_description);
      const errorCode = typeof error === 'string' ? error : String(error);
      const protocol = getProtocol(req);
      const baseUrl = getBaseUrl(req);
      return res.redirect(`${protocol}://${baseUrl}/?auth=error&reason=${encodeURIComponent(errorMsg || errorCode || 'Unknown error')}`);
    }
    
    if (!code || !state || state !== req.session.state) {
      console.error('Invalid auth params:', { code: !!code, state: !!state, stateMatch: state === req.session.state });
      const protocol = getProtocol(req);
      const baseUrl = getBaseUrl(req);
      return res.redirect(`${protocol}://${baseUrl}/?auth=error&reason=${encodeURIComponent('Invalid authorization parameters')}`);
    }

    try {
      const protocol = getProtocol(req);
      const baseUrl = getBaseUrl(req);
      const fullBaseUrl = `${protocol}://${baseUrl}`;
      
      // Use auth manager to handle the callback
      const result = await authManager.handleCallback(provider, code as string, fullBaseUrl);
      
      if (!result.success || !result.session) {
        console.error(`${provider} authentication failed:`, result.error);
        return res.redirect(`${protocol}://${baseUrl}/?auth=error&reason=${encodeURIComponent(result.error || 'Authentication failed')}`);
      }

      // Store session in storage
      const authSession = await storage.createAuthSession({
        provider: result.session.provider,
        userId: result.session.userId,
        displayName: result.session.displayName,
        email: result.session.email || null,
        pictureUrl: result.session.pictureUrl || null,
        accessToken: result.session.accessToken,
        refreshToken: result.session.refreshToken || null,
        sessionId: result.session.sessionId,
        metadata: JSON.stringify(result.session.metadata || {}),
        expiresAt: result.session.expiresAt,
      });

      req.session.authSessionId = authSession.sessionId;
      
      // Redirect to frontend with success
      res.redirect(`${protocol}://${baseUrl}/?auth=success`);
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      const protocol = getProtocol(req);
      const baseUrl = getBaseUrl(req);
      res.redirect(`${protocol}://${baseUrl}/?auth=error&reason=${encodeURIComponent('Authentication processing failed')}`);
    }
  });

  // Get current user session
  app.get("/api/auth/me", async (req, res) => {
    const authSessionId = req.session.authSessionId;
    
    if (!authSessionId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const session = await storage.getAuthSession(authSessionId);
    if (!session) {
      return res.status(401).json({ error: "Session not found or expired" });
    }

    // Parse metadata if it exists
    let metadata = {};
    if (session.metadata) {
      try {
        metadata = JSON.parse(session.metadata);
      } catch (e) {
        console.warn('Failed to parse session metadata:', e);
      }
    }

    return res.json({
      provider: session.provider,
      userId: session.userId,
      displayName: session.displayName,
      email: session.email,
      pictureUrl: session.pictureUrl,
      loginTime: session.createdAt,
      metadata,
    });
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    const authSessionId = req.session.authSessionId;
    
    if (authSessionId) {
      await storage.deleteAuthSession(authSessionId);
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
}