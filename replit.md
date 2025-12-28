# Madares User Management System

## Overview

This is a comprehensive User Management System for the Madares Business platform ("Lands for Investor"). It provides an admin dashboard with role-based access control, custom permissions, user management, and audit logging functionality. The application follows an enterprise-grade design using the IBM Carbon Design System principles with IBM Plex Sans typography for clarity and data-dense interfaces.

## Recent Changes (December 28, 2025)

- Fixed user edit page to properly pre-populate all form fields (organization, work unit, role, status)
- Fixed users list pagination API to return page and limit in response
- Fixed query keys to use proper URL format with query parameters
- Updated cache invalidation to use predicate matching for flexible query invalidation
- Added loading states that wait for all dependent data before rendering forms

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers
- **Design System**: IBM Carbon-inspired enterprise design with IBM Plex Sans typography

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Style**: RESTful JSON API endpoints under `/api/*`
- **TypeScript**: Full TypeScript support across frontend and backend
- **Build Process**: Custom build script using esbuild for server bundling and Vite for client

### Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Validation**: Zod schemas with drizzle-zod integration for runtime validation
- **Migrations**: Drizzle Kit for database migrations (output to `/migrations` directory)

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/      # Reusable UI components
│   │   └── ui/          # shadcn/ui base components
│   ├── pages/           # Route page components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   └── storage.ts       # Data access layer interface
├── shared/              # Shared types and schemas
│   └── schema.ts        # Zod schemas and TypeScript types
└── migrations/          # Database migration files
```

### Key Design Patterns
- **Shared Schema**: TypeScript types and Zod validation schemas are shared between frontend and backend via the `shared/` directory
- **Storage Interface**: Abstract storage interface (`IStorage`) allows for different backend implementations
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared directory
- **Component Architecture**: Atomic design with base UI components composed into feature components

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: PostgreSQL session storage for Express sessions

### UI/Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **shadcn/ui**: Pre-styled component collection (configured in `components.json`)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **date-fns**: Date formatting and manipulation

### Build & Development
- **Vite**: Frontend build tool with HMR support
- **esbuild**: Server-side bundling for production
- **Drizzle Kit**: Database migration tooling

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for development
- **@replit/vite-plugin-cartographer**: Replit development integration
- **@replit/vite-plugin-dev-banner**: Development environment banner