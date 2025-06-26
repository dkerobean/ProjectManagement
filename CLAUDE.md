# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Create production build  
- `npm run gcp-build` - Build with increased memory allocation for production
- `npm run lint` - Run ESLint checks
- `npm run prettier` - Check code formatting
- `npm run prettier:fix` - Auto-fix code formatting

### Testing
- `./test-api-endpoints.sh` - Test API endpoints
- `./test-auth-fixes.sh` - Authentication testing
- Custom testing scripts available in `/dev-scripts/`

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.2.4 with App Router
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Authentication**: NextAuth.js 5.0.0 with role-based access control
- **Frontend**: React 19.0.0, TypeScript, Tailwind CSS
- **State Management**: Zustand, SWR for data fetching

### Key Architecture Patterns

**Role-Based Access Control**: Comprehensive RBAC system with Admin, Project Manager, Member, Viewer roles. Security enforced at route, component, and database levels.

**App Router Structure**: Organized by route groups:
- `(auth-pages)` - Authentication flows
- `(protected-pages)` - Main application 
- `(public-pages)` - Landing pages

**Database Integration**: Full Supabase integration with RLS policies, real-time subscriptions, and custom PostgreSQL functions.

### Core Directories
- `/src/app/` - Next.js App Router pages and layouts
- `/src/components/` - Reusable UI components by category
- `/src/lib/` - Database clients and utilities
- `/src/services/` - API service layer and business logic
- `/src/hooks/` - Custom React hooks
- `/docs/` - Technical documentation
- `/migrations/` - Database migration files

## Database Schema

### Key Tables
- **Users**: Role-based user management with preferences
- **Projects**: Full project lifecycle management
- **Tasks**: Hierarchical task structure with dependencies
- **Comments**: Threaded commenting system
- **File Attachments**: Versioned file management
- **Project Members**: Team membership and permissions

### Required Environment Variables
```bash
# Core Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=your_production_url
NEXTAUTH_SECRET=your_secret
```

## Special Considerations

### Authentication System
- Complex NextAuth.js setup with Supabase integration
- Custom session management with role-based access
- Session refresh and expiration handling

### Internationalization
- Next-intl configured for multi-language support (en, es, ar, zh)
- RTL support for Arabic
- Language switching with preserved routing

### Performance & Deployment
- Configured for Vercel deployment
- Memory allocation optimization for builds (`--max-old-space-size=8192`)
- No formal test framework - uses custom shell scripts for testing
- ESLint and TypeScript checks disabled during build for deployment speed

### File Management
- Custom file upload system with Supabase Storage
- File versioning and metadata tracking
- Multiple attachment points (tasks, projects, comments)

## Development Workflow

1. **Environment Setup**: Configure required environment variables
2. **Database**: Apply migrations from `/migrations/` if needed
3. **Development**: Use `npm run dev` for local development
4. **Testing**: Use scripts in `/dev-scripts/` for comprehensive testing
5. **Building**: Use `npm run gcp-build` for production builds
6. **Documentation**: Refer to `/docs/` for detailed technical documentation

## Important Notes

- This is a production-ready project management system with enterprise-level features
- Always run lint and typecheck commands before finalizing changes
- Database uses UUID primary keys and comprehensive RLS policies
- Theme system supports dark/light modes with customizable colors
- File uploads are managed through Supabase Storage with versioning