# TickFlow

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Table of Contents
1. [Project Description](#project-description)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started Locally](#getting-started-locally)  
4. [Available Scripts](#available-scripts)  
5. [Project Scope](#project-scope)  
6. [Project Status](#project-status)  
7. [License](#license)  

## Project Description
TickFlow is a web-based IT ticket reporting and management system. Non-technical employees can submit and track support tickets in real time, while IT agents can view, claim, and resolve tickets in their assigned categories. Built with Next.js, Supabase, and Prisma, TickFlow delivers a responsive UI and real-time updates to streamline IT support workflows.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)  
- **Language**: TypeScript  
- **UI & Styling**: Tailwind CSS, shadcn/ui  
- **Forms & Validation**: React Hook Form + Zod  
- **Authentication**: NextAuth.js v5 (Credentials provider, JWT sessions, bcrypt)  
- **Database & ORM**: PostgreSQL (Supabase), Prisma  
- **Real-Time**: Supabase Realtime WebSocket  
- **Deployment**: Vercel (dev/staging), Node.js server (production)  

## Getting Started Locally

### Prerequisites
- Node.js (v18+ recommended)  
- npm or yarn  
- Supabase account with a project and credentials  
- Environment variables configured (.env.local)

### Environment Variables
Create a `.env.local` in the project root:
```bash
DATABASE_URL="postgresql://postgres:password@your-supabase-url:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a-secure-random-string"
```

### Installation & Setup
```bash
# Install dependencies
npm install

# Push Prisma schema to the database
npx prisma db push

# Seed initial data (categories, users, assignments)
npx prisma db seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts
- `npm run dev`  
  Starts the Next.js development server.  
- `npm run build`  
  Builds the application for production.  
- `npm run start`  
  Runs the production build.  
- `npm run lint`  
  Lints codebase using ESLint.

## Project Scope
TickFlow MVP includes:
- **Authentication**: Email/password login, enforced password change on first login, session protection, route middleware.  
- **Ticket Management**: Create tickets (category→subcategory→title→description), validation, user ticket list & detail.  
- **Agent Workflow**: Agent view of unassigned and “my tickets” in assigned categories, claim tickets, status transitions (Open → In Progress → Closed).  
- **Real-Time Updates**: Live ticket list and status changes via Supabase Realtime.  
- **Seeded Data**: Hardcoded categories, subcategories, and agent assignments for MVP.

For full requirements, see [prd.md](.ai/prd.md).

## Project Status
- **MVP 1.0** in active development (4-week roadmap, 15h/week)  
- Core authentication and ticket CRUD features are implemented; real-time updates and agent workflows are in progress.  
- See project milestones in [prd.md](.ai/prd.md) and architectural details in [tech-stack.md](.ai/tech-stack.md).

## License
This project is licensed under the MIT License.  
See [LICENSE](LICENSE) for details.

