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
- **Authentication**: Custom OAuth implementation with `openid-client` library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing

### Key Architectural Patterns

1. **Unified Server Model**: Single Express server serves both API and client. Vite middleware integrated in development.

2. **OAuth Implementation**: 
   - Authentication opens in new tab (avoids WebView restrictions)
   - Dynamic callback URL generation based on environment
   - Provider-specific session tables in database
   - State parameter validation for CSRF protection

3. **Modular Authentication System**:
   - Provider-agnostic OAuth with abstract base class pattern
   - Individual provider implementations in `/server/auth/providers/`
   - Unified session storage with polymorphic schema
   - Type-safe with Drizzle ORM and Zod schemas

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
  /src/pages         # Page components (Login, Landing, NotFound)
  /src/components    # React components including shadcn/ui
  /src/lib          # Utilities (queryClient, utils)
  /src/hooks        # Custom React hooks
/server              # Express backend
  /auth             # Modular authentication system
    /providers      # OAuth provider implementations (line.ts, google.ts, facebook.ts)
    manager.ts      # Authentication manager
    routes.ts       # Authentication route handlers
    types.ts        # Authentication type definitions
  index.ts          # Server entry point
  routes.ts         # Main API route registration
  storage.ts        # Session storage implementations
  vite.ts           # Vite middleware setup
/shared             # Shared types and schemas
  schema.ts         # Drizzle ORM schema definitions
/attached_assets    # Static assets and images
```

## Important Development Notes

1. **OAuth Callback URLs**: Automatically detected based on environment. Development uses Replit dev URLs, production uses `.replit.app` domains.

2. **Type Safety**: TypeScript strict mode enabled. Always run `npm run check` before committing.

3. **Component Library**: Uses shadcn/ui components. When adding new components, they should be placed in `/client/src/components/ui`.

4. **API Routes**: OAuth endpoints in `/server/auth/routes.ts`, main route registration in `/server/routes.ts`. Follow existing patterns for error handling and response formats.

5. **Database Changes**: After modifying schema in `/shared/schema.ts`, run `npm run db:push` to update the database.

6. **Session Management**: Dual storage system - in-memory for development (`MemStorage`), database-ready interface for production. Uses `connect-pg-simple` and `memorystore` for session persistence.

7. **UI Framework**: shadcn/ui configured with "New York" style variant and custom theme. Components use class-variance-authority for styling variants.

8. **Development Environment**: Configured for Replit deployment with Vite plugins for development (`@replit/vite-plugin-cartographer`, `@replit/vite-plugin-runtime-error-modal`).

## Development Workflow

### Build Process
- **Development**: `npm run dev` starts unified server with Vite middleware for hot reloading
- **Production Build**: Dual build process using Vite (client) and esbuild (server)
- **Type Checking**: Always run `npm run check` before committing (strict TypeScript)

### Path Aliases
- `@/*` → `./client/src/*` (client-side components)
- `@shared/*` → `./shared/*` (shared types/schemas)
- `@assets/*` → `./attached_assets/*` (static assets)

### Configuration
- **TypeScript**: Strict mode with incremental compilation
- **Tailwind**: shadcn/ui "New York" variant with custom CSS variables
- **Environment**: Replit-optimized with dynamic callback URL generation

## Common Tasks

### Adding a New OAuth Provider
1. Add provider credentials to environment variables
2. Create new provider class extending `BaseAuthProvider` in `/server/auth/providers/`
3. Register provider in `/server/auth/manager.ts`
4. Add authentication route in `/server/auth/routes.ts`
5. Add login button in `/client/src/pages/login.tsx`
6. Update shared types in `/shared/schema.ts` if needed
7. Run `npm run db:push` to update database

### Modifying UI Components
- UI components use Tailwind CSS and shadcn/ui
- Follow existing component patterns in `/client/src/components/ui`
- Use the existing theme configuration in `tailwind.config.ts`

### Debugging Authentication Issues
1. Check browser console for client-side errors
2. Check server logs for OAuth callback errors
3. Verify environment variables are set correctly
4. Ensure callback URLs match OAuth provider configuration