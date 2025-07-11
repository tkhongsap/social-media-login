# Social Media Login Authentication System

A modern, full-stack OAuth authentication application built with React, Express, and PostgreSQL. This project implements secure social media login via LINE, Google, and Facebook OAuth providers with a beautiful, responsive UI.

## Features

- **Multi-Provider OAuth**: Support for LINE, Google, and Facebook authentication
- **Secure Session Management**: Server-side session storage with CSRF protection
- **Modern UI**: Beautiful interface built with shadcn/ui components and Tailwind CSS
- **Type-Safe**: End-to-end TypeScript with strict type checking
- **Responsive Design**: Mobile-first approach with glass-morphism effects
- **Developer Experience**: Hot reloading, comprehensive error handling, and excellent tooling

## Tech Stack

### Frontend
- **React 18** - Modern React with concurrent features
- **TypeScript** - Full type safety throughout
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components built on Radix UI
- **TanStack Query** - Server state management
- **Wouter** - Lightweight client-side routing

### Backend
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database operations
- **openid-client** - OAuth client implementation
- **Express Session** - Session management middleware

### Database
- **PostgreSQL** - Primary database
- **Neon** - Serverless PostgreSQL for production
- **Drizzle Kit** - Database migrations and schema management

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OAuth application credentials for desired providers

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-login
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret_key
   
   # LINE OAuth (optional)
   LINE_CHANNEL_ID=your_line_channel_id
   LINE_CHANNEL_SECRET=your_line_channel_secret
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Facebook OAuth (optional)
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production (client + server)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── AuthProviderButton.tsx
│   │   │   └── GoogleIcon.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── login.tsx    # Login page with provider buttons
│   │   │   ├── landing.tsx  # Protected dashboard
│   │   │   └── not-found.tsx
│   │   ├── lib/             # Utilities and configuration
│   │   └── main.tsx         # React entry point
│   └── index.html           # HTML template
├── server/                   # Express backend
│   ├── auth/                # Authentication module
│   │   ├── providers/       # OAuth provider implementations
│   │   │   ├── line.ts      # LINE OAuth provider
│   │   │   ├── google.ts    # Google OAuth provider
│   │   │   └── facebook.ts  # Facebook OAuth provider
│   │   ├── manager.ts       # Authentication manager
│   │   ├── routes.ts        # Authentication routes
│   │   └── types.ts         # Authentication types
│   ├── db.ts                # Database connection
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API route registration
│   ├── storage.ts           # Session storage interface
│   └── vite.ts              # Vite middleware setup
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Drizzle ORM schema definitions
└── attached_assets/          # Static assets
```

## Authentication Flow

1. **User visits login page** - Displays available OAuth providers
2. **Provider selection** - User clicks on LINE, Google, or Facebook
3. **OAuth redirect** - Opens provider's OAuth page in new tab
4. **Authorization** - User authorizes the application
5. **Callback handling** - Server processes the OAuth callback
6. **Session creation** - User session is created and stored
7. **Landing page** - User is redirected to the protected dashboard

## API Endpoints

- `GET /api/auth/providers` - Get available OAuth providers
- `GET /api/auth/:provider` - Initiate OAuth flow for provider
- `GET /api/auth/:provider/callback` - Handle OAuth callback
- `GET /api/auth/me` - Get current user session
- `POST /api/auth/logout` - Logout and destroy session

## OAuth Provider Setup

### LINE Login
1. Create a LINE Login channel at [LINE Developers Console](https://developers.line.biz/)
2. Set callback URL to `http://localhost:5000/api/auth/line/callback`
3. Add `LINE_CHANNEL_ID` and `LINE_CHANNEL_SECRET` to environment variables

### Google OAuth
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API and create OAuth 2.0 credentials
3. Set authorized redirect URI to `http://localhost:5000/api/auth/google/callback`
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to environment variables

### Facebook Login
1. Create an app in [Facebook Developers](https://developers.facebook.com/)
2. Add Facebook Login product
3. Set valid OAuth redirect URI to `http://localhost:5000/api/auth/facebook/callback`
4. Add `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` to environment variables

## Security Features

- **CSRF Protection** - State parameter validation for OAuth flows
- **Secure Sessions** - HTTP-only session cookies with configurable security
- **Session Expiration** - Automatic cleanup of expired sessions
- **Environment Detection** - Dynamic callback URLs for different environments
- **Type Safety** - Runtime validation with Zod schemas

## Database Schema

The application uses a unified session storage approach:

```sql
-- Users table (for traditional auth, if needed)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unified OAuth session storage
CREATE TABLE auth_sessions (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  picture_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

## Development

### Adding a New OAuth Provider

1. **Create provider implementation**
   ```typescript
   // server/auth/providers/new-provider.ts
   export class NewProvider extends BaseAuthProvider {
     // Implement required methods
   }
   ```

2. **Register in auth manager**
   ```typescript
   // server/auth/manager.ts
   if (process.env.NEW_PROVIDER_CLIENT_ID) {
     this.providers.set('new-provider', new NewProvider(config));
   }
   ```

3. **Add frontend button**
   ```tsx
   // client/src/pages/login.tsx
   <AuthProviderButton provider="new-provider" />
   ```

### Environment Variables

The application detects the environment and configures callback URLs automatically:
- **Development**: Uses `http://localhost:5000`
- **Replit**: Uses dynamic `.replit.app` domain
- **Production**: Uses `CALLBACK_URL` environment variable

## Deployment

### Replit Deployment
The application is optimized for Replit deployment with:
- Automatic callback URL detection
- Specialized Vite plugins for development
- Environment variable configuration through Replit Secrets

### Production Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Ensure PostgreSQL database is accessible
4. Run: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run check`
5. Test your changes
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the GitHub repository.