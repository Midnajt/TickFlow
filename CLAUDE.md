# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TickFlow is an internal company ticket management system with role-based access control (RBAC). The application supports hierarchical user roles (User → Agent → Manager → Admin) with progressive permissions.

**Key Features:**
- Multi-department ticket management with categories and subcategories
- Real-time updates via WebSocket when tickets are assigned
- Email notifications for ticket operations
- Statistics and audit logging
- Self-service password reset (only self-service feature - no public registration)

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS
- **Backend**: Next.js API routes
- **Database**: MongoDB + Mongoose
- **Real-time**: WebSocket (Socket.io)
- **Authentication**: NextAuth.js v5 / JWT + bcrypt
- **Email**: Resend + React Email
- **Validation**: Zod

## Development Commands

```bash
# Development server (with Turbopack)
npm run dev

# Build for production (with Turbopack)
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Project Architecture

### Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, reset-password)
│   ├── (dashboard)/              # Role-based dashboards (user, agent, manager, admin)
│   ├── api/                      # API Routes
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React Components
│   ├── ui/                       # Reusable UI components
│   ├── forms/                    # Form components
│   ├── tickets/                  # Ticket-related components
│   └── dashboard/                # Dashboard components
├── lib/                          # Utilities & configs
│   ├── db/                       # Database connection (mongodb.ts)
│   ├── auth/                     # Auth utilities (jwt.ts, rbac.ts)
│   ├── websocket/                # WebSocket setup
│   ├── email/                    # Email service + templates
│   ├── validators/               # Zod schemas
│   └── utils.ts
├── models/                       # Mongoose models
│   ├── User.ts
│   ├── Category.ts
│   ├── Subcategory.ts
│   ├── Ticket.ts
│   ├── Comment.ts
│   ├── AuditLog.ts
│   └── SystemLog.ts
├── types/                        # TypeScript types
├── hooks/                        # Custom React hooks (useAuth, useTickets, useWebSocket)
└── middleware.ts                 # Next.js middleware (route protection)
```

### Current State

The project is in early setup phase:
- Next.js 15 configured with App Router
- TypeScript with strict mode
- TailwindCSS v4 configured
- Basic app structure (layout.tsx, page.tsx in `src/app/`)
- Path alias configured: `@/*` → `./src/*`

## Key Domain Entities

### User Roles (Hierarchical)
1. **User** - Creates tickets, views own tickets
2. **Agent** - Inherits User + assigns tickets, changes status, adds comments
3. **Manager** - Inherits Agent + creates subcategories, assigns agents, creates users, views stats
4. **Admin** - Full access, creates categories/managers, views all stats and logs

### Data Models

**Ticket Schema (Core validations):**
- `title`: required, 1-200 characters
- `description`: required, 1-500 characters
- `category`: required, ObjectId reference
- `subcategory`: required, ObjectId reference
- `status`: enum ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
- `assignedTo`: ObjectId (Agent) - populated in responses for users to see who accepted their ticket

**User Schema:**
- `email`: unique, indexed, serves as login
- `password`: hashed with bcrypt
- `role`: enum ['USER', 'AGENT', 'MANAGER', 'ADMIN']
- `mustChangePassword`: boolean (true for newly created users)
- `assignedCategories`: ObjectId[] (for Managers)
- `assignedSubcategories`: ObjectId[] (for Agents)

**Category/Subcategory:**
- Categories created by Admin
- Subcategories created by Managers (only within assigned categories)
- Agents assigned to subcategories

## Critical Business Rules

### Authentication & User Management
- **NO public registration** - users cannot self-register
- Only Manager/Admin can create user accounts via `POST /api/users`
- New users receive welcome email with temporary password
- `mustChangePassword` flag forces password change on first login
- Password reset is the ONLY self-service feature available

### Ticket Creation Validation
- Title: required, max 200 chars
- Description: required, max 500 chars, show live character counter (X/500)
- Category and subcategory: both required
- Form should validate in real-time with inline error messages

### Permissions (RBAC)
- Managers can only create subcategories in their assigned categories
- Agents can only assign tickets in their assigned subcategories
- Agents see tickets only in their assigned subcategories
- When ticket is assigned to an agent, it disappears from other agents' lists (real-time)
- Direct API calls must check permissions via RBAC middleware

### Email Notifications (Required in MVP)
Notifications sent for:
- New user created → Welcome email with temporary password
- Ticket created → Notify all agents in subcategory
- Ticket assigned → Notify ticket creator (shows who accepted)
- Ticket status changed → Notify ticket creator
- Ticket resolved → Notify ticket creator
- New comment → Notify ticket creator and assigned agent

## Important Implementation Notes

### Validation with Zod
- Use Zod schemas for all API inputs and form validation
- Ticket validation example:
  ```typescript
  title: z.string().min(1).max(200)
  description: z.string().min(1).max(500)
  category: z.string() // ObjectId
  subcategory: z.string() // ObjectId
  ```

### Real-time Updates
- WebSocket required for ticket assignment updates
- When agent assigns ticket to themselves, emit `ticket:assigned` event
- Other agents in same subcategory should see ticket removed from their list
- Fallback to polling if WebSocket unavailable

### Error Handling
- Client-side: Global ErrorBoundary, toast notifications
- Server-side: Centralized error middleware, proper HTTP status codes
- User-friendly messages (not technical details)
- Log all errors to SystemLog collection

### Email Service
- Use Resend API with React Email templates
- Implement retry logic (3 attempts) for failed sends
- Queue system for batch notifications
- Templates located in `lib/email/templates/`

### Audit Logging
- Log all critical operations to AuditLog collection:
  - User login, logout, password reset
  - Ticket create/assign/close
  - User/category/subcategory creation
- Capture IP address and user agent
- Admin-only access via `GET /api/logs/audit`

## Development Workflow

1. **Models First**: Define Mongoose schemas with proper validation
2. **API Routes**: Implement with RBAC middleware and error handling
3. **UI Components**: Use TypeScript types from models
4. **Real-time**: Emit WebSocket events after successful DB operations
5. **Email**: Send notifications async (don't block response)
6. **Testing**: Write tests for critical flows before moving to next phase

## Edge Cases to Handle

- Concurrent ticket assignment (use optimistic locking with version field)
- Manager/Agent reassigned or deleted → handle orphaned tickets
- Subcategory deleted → soft delete or reassign tickets
- WebSocket connection failures → implement reconnection logic
- Email service down → queue with retry logic
- Empty/whitespace-only input → validate and reject
- Special characters in input → sanitize (XSS prevention)

## File Naming Conventions

- Components: PascalCase (e.g., `TicketList.tsx`)
- Utilities: camelCase (e.g., `emailService.ts`)
- Models: PascalCase (e.g., `User.ts`)
- API routes: lowercase kebab-case in folder structure

## Reference Documentation

See project documentation:
- `SPECIFICATION.md` - Full Polish specification with roles and features
- `TODO.md` - Detailed implementation plan with 10 phases
- `README.md` - Basic Next.js setup information

## Deployment Notes

- Frontend: Vercel (supports Next.js 15)
- WebSocket: Separate server required (Vercel doesn't support WebSocket)
  - Options: Railway, Render, DigitalOcean
- Database: MongoDB Atlas (managed, with backups)
- Environment variables required: MongoDB URI, JWT secret, Resend API key, WebSocket URL
