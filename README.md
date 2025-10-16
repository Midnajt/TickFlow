# TickFlow

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

3## Table of Contents
1. [Project Description](#project-description)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started Locally](#getting-started-locally)  
4. [Available Scripts](#available-scripts)  
5. [Project Scope](#project-scope)  
6. [Project Status](#project-status)  
7. [Documentation](#documentation)  
8. [License](#license)  

## Project Description
TickFlow is a web-based IT ticket reporting and management system. Non-technical employees can submit and track support tickets in real time, while IT agents can view, claim, and resolve tickets in their assigned categories. Built with Next.js, Supabase, and Prisma, TickFlow delivers a responsive UI and real-time updates to streamline IT support workflows.

## Tech Stack
- **Framework**: Next.js 15 (App Router)  
- **Language**: TypeScript 5  
- **UI & Styling**: Tailwind CSS 4, shadcn/ui  
- **Forms & Validation**: React Hook Form + Zod 4  
- **Authentication**: Custom JWT-based auth (jose, bcrypt, HTTP-only cookies)  
- **Database**: PostgreSQL via Supabase  
- **Real-Time**: Supabase Realtime WebSocket  
- **Testing**: Vitest 2.x (unit/integration), Playwright 1.48+ (E2E), Testing Library, MSW  
- **Deployment**: Vercel  

## Getting Started Locally

### Prerequisites
- Node.js (v18+ recommended)  
- npm or yarn  
- Supabase account with a project and credentials  
- Environment variables configured (.env.local)

### Environment Variables
Create a `.env.local` in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
```

📖 **Detailed setup guide:** [documentation/env-setup-guide.md](./documentation/env-setup-guide.md)

### Installation & Setup
```bash
# Install dependencies
npm install

# Run Supabase migrations
# (Make sure your SUPABASE_SERVICE_ROLE_KEY is set)

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

📖 **API Documentation:** [documentation/auth-api-documentation.md](./documentation/auth-api-documentation.md)

## Available Scripts

### Development
- `npm run dev`  
  Starts the Next.js development server.  
- `npm run build`  
  Builds the application for production.  
- `npm run start`  
  Runs the production build.  
- `npm run lint`  
  Lints codebase using ESLint.

### Testing
- `npm test`  
  Runs unit and integration tests with Vitest.  
- `npm run test:watch`  
  Runs tests in watch mode for active development.  
- `npm run test:ui`  
  Opens Vitest UI for interactive test debugging.  
- `npm run test:coverage`  
  Generates test coverage report (target: ≥80%).  
- `npm run test:e2e`  
  Runs end-to-end tests with Playwright.  
- `npm run test:e2e:ui`  
  Opens Playwright UI for interactive E2E testing.  
- `npm run test:all`  
  Runs all tests (unit, integration, E2E) with coverage.

## Project Scope
TickFlow MVP includes:
- **Authentication**: Email/password login, enforced password change on first login, session protection, route middleware.  
- **Ticket Management**: Create tickets (category→subcategory→title→description), validation, user ticket list & detail.  
- **Agent Workflow**: Agent view of unassigned and “my tickets” in assigned categories, claim tickets, status transitions (Open → In Progress → Closed).  
- **Real-Time Updates**: Live ticket list and status changes via Supabase Realtime.  
- **Seeded Data**: Hardcoded categories, subcategories, and agent assignments for MVP.

For full requirements, see [prd.md](.ai/prd.md).

## Project Status
- **MVP 1.0** in active development
- ✅ Authentication system (JWT-based, complete with middleware)
- ✅ Login & Change Password views (fully functional)
- ✅ Route protection & session management
- ✅ Test infrastructure (Vitest + Playwright configured)
- ✅ Ticket management endpoints (in progress)
- ✅ Agent workflows (planned)
- 🚧 Real-time updates (planned)
- 🚧 Test coverage expansion (target: ≥80%)

See project milestones in [.ai/prd.md](.ai/prd.md) and architectural details in [.ai/tech-stack.md](.ai/tech-stack.md).



### Quick Links

**Authentication & Security:**
- **[Authentication API](./documentation/auth-api-documentation.md)** - Complete REST API reference
- **[Environment Setup](./documentation/env-setup-guide.md)** - Configuration guide
- **[Implementation Summary](./documentation/auth-implementation-summary.md)** - Technical details
- **[Login Implementation](./documentation/login-implementation-complete.md)** - Frontend implementation details
- **[Testing Plan](./documentation/login-testing-plan.md)** - Manual testing scenarios
- **[Components Guide](./documentation/auth-components-guide.md)** - Reusable component documentation

**Testing:**
- **[Test Plan](.ai/test-plan.md)** - Comprehensive testing strategy and execution plan
- **Testing Stack**: Vitest (unit/integration), Playwright (E2E), Testing Library, MSW (mocking)
- **Coverage Target**: ≥80% for all TypeScript code

### Features Documented

**Authentication & Security:**
- ✅ Authentication endpoints (login, logout, change-password, session)
- ✅ JWT token management & HTTP-only cookies
- ✅ Route protection middleware
- ✅ Login & Change Password views
- ✅ React Hook Form + Zod validation
- ✅ Rate limiting
- ✅ Security best practices
- ✅ Full accessibility (A11y) support
- ✅ Code examples & troubleshooting

**Testing Infrastructure:**
- ✅ Vitest 2.x configuration for unit & integration tests
- ✅ Playwright 1.48+ setup for E2E testing
- ✅ Testing Library for component testing
- ✅ MSW 2.x for API mocking
- ✅ Coverage reporting (target: ≥80%)
- ✅ CI/CD pipeline ready (GitHub Actions)

## License
This project is licensed under the MIT License.  
See [LICENSE](LICENSE) for details.

