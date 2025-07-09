# Overview

This is a full-stack web application built with React (frontend) and Express.js (backend) that implements multiple social media OAuth authentication (Line and Google). The application allows users to log in with their preferred social account and view their profile information. It uses a modern tech stack with TypeScript, Tailwind CSS, Radix UI components (shadcn/ui), and Drizzle ORM for database operations.

## Recent Changes (January 2025)
✓ Fixed WebView restrictions by opening LINE OAuth in new tab
✓ Added production/development URL detection for proper callback URLs  
✓ Implemented secure session management with LINE OAuth flow
✓ Added Google OAuth integration alongside Line login
✓ Created unified social media authentication system supporting both Line and Google
✓ Updated UI to dynamically handle both authentication providers
✓ Development login working: http://166643c1-1c28-4b0e-8e38-36c0cdacea1b-00-xs4vzkk5ru23.picard.replit.dev
✓ Production deployment: https://line-social-login-tkhongsap.replit.app (requires callback URL registration)

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
- LINE OAuth 2.0 implementation with proper state management
- Session-based authentication using express-session
- Secure token exchange and profile retrieval from LINE API
- Protected routes with authentication middleware

### Database Schema
- **Users table**: Basic user information (id, username, password)
- **Line sessions table**: LINE OAuth session data including access tokens, user profiles, and session metadata
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

### LINE Integration
- LINE Channel ID and Channel Secret for OAuth
- LINE Login API for user authentication
- LINE Profile API for user data retrieval

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