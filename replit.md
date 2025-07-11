# Overview

This is a full-stack web application built with React (frontend) and Express.js (backend) that implements multiple social media OAuth authentication (Line, Google, and Facebook). The application allows users to log in with their preferred social account and view their profile information. It uses a modern tech stack with TypeScript, Tailwind CSS, Radix UI components (shadcn/ui), and Drizzle ORM for database operations.

## Recent Changes (January 2025)
✓ Fixed WebView restrictions by opening LINE OAuth in new tab
✓ Added production/development URL detection for proper callback URLs  
✓ Implemented secure session management with LINE OAuth flow
✓ Added Google OAuth integration alongside Line login
✓ Added Facebook OAuth integration as the third authentication provider
✓ Created unified social media authentication system supporting Line, Google, and Facebook
✓ Updated UI to dynamically handle all three authentication providers
✓ **Fixed Facebook OAuth permission issue**: Removed email scope to avoid app review requirement
✓ **All three providers fully tested and working**: Line, Google, and Facebook authentication confirmed
✓ **Google OAuth production ready**: Updated Google Cloud Console with current callback URLs
✓ **Facebook OAuth production ready**: Added production callback URL to Facebook Developer Console
✓ **Project ready for deployment**: All authentication providers configured for both development and production
✓ Development URL: https://166643c1-1c28-4b0e-8e38-36c0cdacea1b-00-xs4vzkk5ru23.picard.replit.dev
✓ Production URL: https://line-social-login-tkhongsap.replit.app
✓ **Updated brand colors to official specifications** (January 2025):
  - Google: Official blue #4285F4 (from Google Visual Brand Guidelines)
  - Facebook: Official blue #1877F2
  - LINE: Maintained official green #00C300
✓ **Enhanced UI consistency**: All login buttons and landing page elements now use authentic brand colors
✓ **MAJOR REFACTOR - Modular Authentication Architecture** (January 11, 2025):
  - Replaced repetitive provider-specific code with unified authentication system
  - Created BaseAuthProvider abstract class for consistent provider implementations
  - Implemented AuthManager for centralized provider registration and management
  - Unified session management using single auth_sessions table instead of separate tables per provider
  - Dynamic frontend that automatically generates login buttons for available providers
  - Simplified adding new authentication providers (just create provider class and add environment variables)
  - Fixed session state management issues in OAuth flows
  - Improved code maintainability and scalability for future authentication methods

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with React plugin and custom error overlay

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Session Management**: Express sessions with in-memory storage (development)
- **Authentication**: LINE OAuth 2.0 integration
- **Database**: PostgreSQL with Drizzle ORM
- **Environment**: Node.js with ES modules

## Key Components

### Authentication Flow
- Multi-provider OAuth 2.0 implementation (Line, Google, Facebook) with proper state management
- Session-based authentication using express-session
- Secure token exchange and profile retrieval from provider APIs
- Protected routes with authentication middleware
- Unified authentication endpoints supporting all three providers

### Database Schema
- **Users table**: Basic user information (id, username, password)
- **Line sessions table**: LINE OAuth session data including access tokens, user profiles, and session metadata
- **Google sessions table**: Google OAuth session data including access tokens, refresh tokens, and user profiles
- **Facebook sessions table**: Facebook OAuth session data including access tokens and user profiles
- PostgreSQL with Drizzle ORM for type-safe database operations

### UI Components
- Comprehensive component library using Radix UI primitives
- Custom themed components following shadcn/ui patterns
- Responsive design with mobile-first approach
- Toast notifications for user feedback

## Data Flow

1. **Authentication Process**:
   - User clicks login button on `/` route
   - Backend generates OAuth URL with state parameter
   - User redirects to LINE authorization
   - LINE callback returns to `/api/auth/line/callback`
   - Backend exchanges code for access token
   - User profile fetched and stored in session
   - User redirected to `/landing` page

2. **Profile Display**:
   - Landing page fetches user profile from `/api/auth/me`
   - Profile data includes LINE display name, picture, and status
   - Real-time session management with logout functionality

3. **Error Handling**:
   - Comprehensive error handling with user-friendly messages
   - Query client with retry logic and proper error states
   - Toast notifications for success/error feedback

## External Dependencies

### Social Media Integration
- **LINE**: Channel ID and Channel Secret for OAuth, Login API, Profile API
- **Google**: Client ID and Client Secret for OAuth, Google People API
- **Facebook**: App ID and App Secret for OAuth, Facebook Graph API

### Database
- Neon Database (PostgreSQL) for production
- Drizzle Kit for database migrations
- Connection via DATABASE_URL environment variable

### UI Libraries
- Radix UI for accessible component primitives
- Lucide React for icons
- React Icons for brand icons (LINE)
- Embla Carousel for carousel components

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Concurrent frontend and backend development setup

### Production
- Vite build for optimized frontend bundle
- esbuild for backend bundling
- Static file serving from Express
- Environment-based configuration

### Build Process
- TypeScript compilation with strict type checking
- Tailwind CSS processing with PostCSS
- Asset optimization and bundling
- ES modules throughout the stack

### Environment Configuration
- Environment variables for sensitive data
- Replit-specific configurations for cloud deployment
- Base URL detection for OAuth callbacks
- Session secret management for security