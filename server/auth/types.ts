// Authentication types and interfaces for modular OAuth system

export interface AuthProvider {
  readonly name: string;
  readonly displayName: string;
  readonly color: string;
  readonly icon: string;
  readonly scopes: string[];
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  profileUrl: string;
}

export interface AuthSession {
  provider: string;
  userId: string;
  displayName: string;
  email?: string;
  pictureUrl?: string;
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  [key: string]: any;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export abstract class BaseAuthProvider {
  protected config: AuthConfig;
  protected provider: AuthProvider;

  constructor(config: AuthConfig, provider: AuthProvider) {
    this.config = config;
    this.provider = provider;
  }

  abstract generateAuthUrl(baseUrl: string, state: string): string;
  abstract exchangeCodeForToken(code: string, baseUrl: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }>;
  abstract fetchUserProfile(accessToken: string): Promise<UserProfile>;

  getProvider(): AuthProvider {
    return this.provider;
  }

  getConfig(): AuthConfig {
    return this.config;
  }

  createSession(profile: UserProfile, accessToken: string, refreshToken?: string, expiresIn?: number): AuthSession {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    if (expiresIn) {
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 24); // Default 24h expiry
    }

    return {
      provider: this.provider.name,
      userId: profile.id,
      displayName: profile.name,
      email: profile.email,
      pictureUrl: profile.picture,
      accessToken,
      refreshToken,
      sessionId,
      expiresAt,
      metadata: {}
    };
  }
}