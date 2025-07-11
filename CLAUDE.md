# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack social media OAuth authentication application built with React, Express, and PostgreSQL. It implements secure authentication via LINE, Google, and Facebook OAuth providers.

## Development Commands

```bash
# Install dependencies
npm install

# Push database schema changes (required after schema modifications)
npm run db:push

# Start development server (runs on http://localhost:5000)
npm run dev

# Type check the codebase
npm run check

# Build for production
npm run build

# Run production build
npm start
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (Neon in production)
- **Authentication**: Passport.js with custom OAuth strategies

### Key Architectural Patterns

1. **Unified Server Model**: Single Express server serves both API and client. Vite middleware integrated in development.

2. **OAuth Implementation**: 
   - Authentication opens in new tab (avoids WebView restrictions)
   - Dynamic callback URL generation based on environment
   - Provider-specific session tables in database
   - State parameter validation for CSRF protection

3. **Database Schema**:
   - Separate session tables for each provider: `lineSessions`, `googleSessions`, `facebookSessions`
   - Type-safe with Drizzle ORM and Zod schemas
   - Schema defined in `db/schema.ts`

4. **Frontend Routing**:
   - `/` - Login page with social auth options
   - `/landing` - Protected page showing authenticated user profile
   - Authentication state passed via URL parameters

## Environment Variables

Required environment variables (stored in Replit Secrets):
```
DATABASE_URL          # PostgreSQL connection string
SESSION_SECRET        # Express session secret
LINE_CHANNEL_ID       # LINE OAuth app ID (2007715339)
LINE_CHANNEL_SECRET   # LINE OAuth secret
GOOGLE_CLIENT_ID      # Google OAuth client ID
GOOGLE_CLIENT_SECRET  # Google OAuth client secret
FACEBOOK_APP_ID       # Facebook OAuth app ID
FACEBOOK_APP_SECRET   # Facebook OAuth app secret
```

## Project Structure

```
/client               # React frontend
  /src/pages         # Page components
  /src/components/ui # shadcn/ui components
  /src/lib          # Utilities and hooks
/server              # Express backend
  index.ts          # Server entry point
  routes.ts         # OAuth endpoints and API routes
  db.ts             # Database connection
/shared             # Shared types and schemas
  schema.ts         # Drizzle ORM schema definitions
/db                 # Database migrations and utilities
```

## Important Development Notes

1. **OAuth Callback URLs**: Automatically detected based on environment. Development uses Replit dev URLs, production uses `.replit.app` domains.

2. **Type Safety**: TypeScript strict mode enabled. Always run `npm run check` before committing.

3. **Component Library**: Uses shadcn/ui components. When adding new components, they should be placed in `/client/src/components/ui`.

4. **API Routes**: All OAuth endpoints are in `/server/routes.ts`. Follow existing patterns for error handling and response formats.

5. **Database Changes**: After modifying schema in `/db/schema.ts`, run `npm run db:push` to update the database.

6. **Session Management**: Uses Express sessions with in-memory storage in development. Sessions track OAuth state across providers.

## Common Tasks

### Adding a New OAuth Provider
1. Add provider credentials to environment variables
2. Create new session table in `/db/schema.ts`
3. Implement OAuth strategy in `/server/routes.ts`
4. Add login button in `/client/src/pages/Login.tsx`
5. Update types in `/shared/schema.ts`
6. Run `npm run db:push` to update database

### Modifying UI Components
- UI components use Tailwind CSS and shadcn/ui
- Follow existing component patterns in `/client/src/components/ui`
- Use the existing theme configuration in `tailwind.config.ts`

### Debugging Authentication Issues
1. Check browser console for client-side errors
2. Check server logs for OAuth callback errors
3. Verify environment variables are set correctly
4. Ensure callback URLs match OAuth provider configuration