import { BaseAuthProvider, AuthConfig, AuthProvider, UserProfile } from '../types.js';

export class LineAuthProvider extends BaseAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: AuthConfig = {
      clientId,
      clientSecret,
      authUrl: 'https://access.line.me/oauth2/v2.1/authorize',
      tokenUrl: 'https://api.line.me/oauth2/v2.1/token',
      profileUrl: 'https://api.line.me/v2/profile'
    };

    const provider: AuthProvider = {
      name: 'line',
      displayName: 'LINE',
      color: '#00C300',
      icon: 'SiLine',
      scopes: ['profile']
    };

    super(config, provider);
  }

  generateAuthUrl(baseUrl: string, state: string): string {
    const callbackUrl = `${baseUrl}/api/auth/line/callback`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: callbackUrl,
      state,
      scope: this.provider.scopes.join(' ')
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, baseUrl: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const callbackUrl = `${baseUrl}/api/auth/line/callback`;
    
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
      console.error('LINE token exchange failed:', errorText);
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
      console.error('LINE profile fetch failed:', errorText);
      throw new Error(`Profile fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: data.userId,
      name: data.displayName,
      picture: data.pictureUrl,
      statusMessage: data.statusMessage
    };
  }
}