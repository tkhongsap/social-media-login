import { BaseAuthProvider, AuthSession, AuthResult } from './types.js';
import { LineAuthProvider } from './providers/line.js';
import { GoogleAuthProvider } from './providers/google.js';
import { FacebookAuthProvider } from './providers/facebook.js';
import crypto from 'crypto';

export class AuthManager {
  private providers: Map<string, BaseAuthProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize LINE provider
    const lineChannelId = process.env.LINE_CHANNEL_ID;
    const lineChannelSecret = process.env.LINE_CHANNEL_SECRET;
    if (lineChannelId && lineChannelSecret) {
      this.providers.set('line', new LineAuthProvider(lineChannelId, lineChannelSecret));
    }

    // Initialize Google provider
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (googleClientId && googleClientSecret) {
      this.providers.set('google', new GoogleAuthProvider(googleClientId, googleClientSecret));
    }

    // Initialize Facebook provider
    const facebookAppId = process.env.FACEBOOK_APP_ID;
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
    if (facebookAppId && facebookAppSecret) {
      this.providers.set('facebook', new FacebookAuthProvider(facebookAppId, facebookAppSecret));
    }
  }

  getAvailableProviders() {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.getProvider().name,
      displayName: provider.getProvider().displayName,
      color: provider.getProvider().color,
      icon: provider.getProvider().icon
    }));
  }

  getProvider(name: string): BaseAuthProvider | undefined {
    return this.providers.get(name);
  }

  generateAuthUrl(providerName: string, baseUrl: string): string | null {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return null;
    }

    const state = crypto.randomBytes(32).toString('hex');
    return provider.generateAuthUrl(baseUrl, state);
  }

  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async handleCallback(
    providerName: string, 
    code: string, 
    baseUrl: string
  ): Promise<AuthResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return { success: false, error: `Provider ${providerName} not found` };
    }

    try {
      // Exchange code for tokens
      const tokenData = await provider.exchangeCodeForToken(code, baseUrl);
      
      // Fetch user profile
      const profile = await provider.fetchUserProfile(tokenData.access_token);
      
      // Create session
      const session = provider.createSession(
        profile, 
        tokenData.access_token, 
        tokenData.refresh_token,
        tokenData.expires_in
      );

      return { success: true, session };
    } catch (error) {
      console.error(`${providerName} authentication failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  isProviderAvailable(name: string): boolean {
    return this.providers.has(name);
  }
}

// Singleton instance
export const authManager = new AuthManager();