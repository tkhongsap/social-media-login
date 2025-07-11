import { BaseAuthProvider, AuthConfig, AuthProvider, UserProfile } from '../types.js';

export class FacebookAuthProvider extends BaseAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: AuthConfig = {
      clientId,
      clientSecret,
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      profileUrl: 'https://graph.facebook.com/me'
    };

    const provider: AuthProvider = {
      name: 'facebook',
      displayName: 'Facebook',
      color: '#1877F2',
      icon: 'SiFacebook',
      scopes: ['public_profile'] // Removed email to avoid app review requirement
    };

    super(config, provider);
  }

  generateAuthUrl(baseUrl: string, state: string): string {
    const callbackUrl = `${baseUrl}/api/auth/facebook/callback`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: callbackUrl,
      scope: this.provider.scopes.join(','),
      state
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, baseUrl: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const callbackUrl = `${baseUrl}/api/auth/facebook/callback`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: callbackUrl,
      code
    });

    const response = await fetch(`${this.config.tokenUrl}?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return await response.json();
  }

  async fetchUserProfile(accessToken: string): Promise<UserProfile> {
    const params = new URLSearchParams({
      fields: 'id,name,picture.type(large)',
      access_token: accessToken
    });

    const response = await fetch(`${this.config.profileUrl}?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook profile fetch failed:', errorText);
      throw new Error(`Profile fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      picture: data.picture?.data?.url
    };
  }
}