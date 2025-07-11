import { BaseAuthProvider, AuthConfig, AuthProvider, UserProfile } from '../types.js';

export class GoogleAuthProvider extends BaseAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: AuthConfig = {
      clientId,
      clientSecret,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
    };

    const provider: AuthProvider = {
      name: 'google',
      displayName: 'Google',
      color: '#4285F4',
      icon: 'GoogleIcon',
      scopes: ['openid', 'email', 'profile']
    };

    super(config, provider);
  }

  generateAuthUrl(baseUrl: string, state: string): string {
    const callbackUrl = `${baseUrl}/api/auth/google/callback`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: callbackUrl,
      scope: this.provider.scopes.join(' '),
      state
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, baseUrl: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const callbackUrl = `${baseUrl}/api/auth/google/callback`;
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return await response.json();
  }

  async fetchUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(this.config.profileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google profile fetch failed:', errorText);
      throw new Error(`Profile fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      picture: data.picture
    };
  }
}