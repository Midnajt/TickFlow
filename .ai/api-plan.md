# REST API Plan - TickFlow

**Project:** TickFlow - IT Ticketing System  
**Version:** MVP 1.0  
**Date:** October 10, 2025

---

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| **Auth** | `User` | Authentication and session management |
| **Users** | `User` | User account management (admin operations) |
| **Categories** | `Category` | Ticket categories (read-only in MVP) |
| **Subcategories** | `Subcategory` | Category subcategories (read-only in MVP) |
| **Tickets** | `Ticket` | Main ticket resource |
| **Agent Categories** | `AgentCategory` | Agent-to-category assignments |

---

## 2. Endpoints

### 2.1 Authentication

#### POST /api/auth/login
**Description:** Authenticate user and create session  
**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@firma.pl",
  "password": "Start!125"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@firma.pl",
    "name": "Jan Kowalski",
    "role": "USER",
    "passwordResetRequired": true
  },
  "session": {
    "token": "eyJhbGc...",
    "expiresAt": "2025-10-17T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Server error

**Business Logic:**
- Verify email exists in database
- Compare bcrypt hashed password
- Check `passwordResetRequired` flag
- Create JWT session token

---

#### POST /api/auth/logout
**Description:** Destroy user session  
**Authentication:** Required (JWT)

**Success Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired session
- `500 Internal Server Error` - Server error

---

#### POST /api/auth/change-password
**Description:** Change user password (forced on first login)  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "currentPassword": "Start!125",
  "newPassword": "MySecure123!",
  "confirmPassword": "MySecure123!"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully",
  "passwordResetRequired": false
}
```

**Error Responses:**
- `400 Bad Request` - Passwords don't match or weak password
- `401 Unauthorized` - Current password incorrect
- `422 Unprocessable Entity` - Password validation failed

**Validation Rules:**
- Minimum 8 characters
- At least one letter
- At least one number
- At least one special character
- `newPassword` must match `confirmPassword`

**Business Logic:**
- Verify current password with bcrypt
- Validate new password strength
- Hash new password with bcrypt
- Set `passwordResetRequired = false`
- Update `updatedAt` timestamp

---

#### GET /api/auth/session
**Description:** Get current user session  
**Authentication:** Required (JWT)

**Success Response (200):**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@firma.pl",
    "name": "Jan Kowalski",
    "role": "AGENT",
    "passwordResetRequired": false
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired session

---

### 2.2 Categories

#### GET /api/categories
**Description:** Get all categories with subcategories  
**Authentication:** Required (JWT)  
**Authorization:** USER, AGENT

**Query Parameters:**
- `includeSubcategories` (boolean, optional, default: true)

**Success Response (200):**
```json
{
  "categories": [
    {
      "id": "cat_001",
      "name": "Hardware",
      "description": "Hardware-related issues",
      "subcategories": [
        {
          "id": "sub_001",
          "name": "Komputer/Laptop",
          "categoryId": "cat_001"
        },
        {
          "id": "sub_002",
          "name": "Drukarka",
          "categoryId": "cat_001"
        }
      ],
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

**Business Logic:**
- Return all categories (read-only in MVP)
- Include subcategories if requested
- No filtering by agent permissions at this level

---

#### GET /api/categories/:categoryId
**Description:** Get single category with subcategories  
**Authentication:** Required (JWT)  
**Authorization:** USER, AGENT

**Success Response (200):**
```json
{
  "id": "cat_001",
  "name": "Hardware",
  "description": "Hardware-related issues",
  "subcategories": [
    {
      "id": "sub_001",
      "name": "Komputer/Laptop",
      "categoryId": "cat_001"
    }
  ],
  "createdAt": "2025-10-01T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Category doesn't exist
- `401 Unauthorized` - Not authenticated

---

### 2.3 Tickets

#### POST /api/tickets
**Description:** Create a new ticket  
**Authentication:** Required (JWT)  
**Authorization:** USER, AGENT

**Request Body:**
```json
{
  "title": "Komputer nie włącza się",
  "description": "Wciskam power button, nic się nie dzieje. Sprawdziłem kabel zasilający - jest podłączony.",
  "subcategoryId": "sub_001"
}
```

**Success Response (201):**
```json
{
  "ticket": {
    "id": "ticket_001",
    "title": "Komputer nie włącza się",
    "description": "Wciskam power button, nic się nie dzieje...",
    "status": "OPEN",
    "subcategoryId": "sub_001",
    "subcategory": {
      "id": "sub_001",
      "name": "Komputer/Laptop",
      "category": {
        "id": "cat_001",
        "name": "Hardware"
      }
    },
    "createdById": "user_001",
    "createdBy": {
      "id": "user_001",
      "name": "Jan Kowalski",
      "email": "jan@firma.pl"
    },
    "assignedToId": null,
    "assignedTo": null,
    "createdAt": "2025-10-10T14:30:00Z",
    "updatedAt": "2025-10-10T14:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `404 Not Found` - Subcategory doesn't exist
- `401 Unauthorized` - Not authenticated
- `422 Unprocessable Entity` - Validation failed

**Validation Rules:**
- `title`: required, minimum 5 characters
- `description`: required, maximum 300 characters
- `subcategoryId`: required, must exist in database

**Business Logic:**
- Set `status = OPEN`
- Set `createdById` from authenticated user
- Set `assignedToId = null`
- Auto-set `createdAt` and `updatedAt`
- Return ticket with populated relations

---

#### GET /api/tickets
**Description:** Get tickets list (filtered by user role)  
**Authentication:** Required (JWT)  
**Authorization:** USER, AGENT

**Query Parameters:**
- `status` (enum: OPEN, IN_PROGRESS, CLOSED, optional)
- `assignedToMe` (boolean, optional, AGENT only)
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20, max: 100)
- `sortBy` (string, optional, default: "createdAt")
- `sortOrder` (enum: asc, desc, optional, default: "desc")

**Success Response (200):**
```json
{
  "tickets": [
    {
      "id": "ticket_001",
      "title": "Komputer nie włącza się",
      "description": "Wciskam power button...",
      "status": "OPEN",
      "subcategory": {
        "id": "sub_001",
        "name": "Komputer/Laptop",
        "category": {
          "id": "cat_001",
          "name": "Hardware"
        }
      },
      "createdBy": {
        "id": "user_001",
        "name": "Jan Kowalski",
        "email": "jan@firma.pl"
      },
      "assignedTo": null,
      "createdAt": "2025-10-10T14:30:00Z",
      "updatedAt": "2025-10-10T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `400 Bad Request` - Invalid query parameters

**Business Logic:**
- **For USER role:**
  - Filter: `createdById = currentUserId`
  - Return only tickets created by the user
  
- **For AGENT role:**
  - If `assignedToMe=true`: Filter `assignedToId = currentUserId`
  - If `assignedToMe=false` or not provided:
    - JOIN: Ticket → Subcategory → Category → AgentCategory
    - Filter: `AgentCategory.userId = currentUserId AND (assignedToId IS NULL OR assignedToId = currentUserId)`
    - Return only tickets from agent's assigned categories
  
- Apply status filter if provided
- Use composite index (status, assignedToId) for performance
- Paginate results
- Sort by specified field

---

#### GET /api/tickets/:ticketId
**Description:** Get single ticket details  
**Authentication:** Required (JWT)  
**Authorization:** USER (own tickets), AGENT (assigned category tickets)

**Success Response (200):**
```json
{
  "id": "ticket_001",
  "title": "Komputer nie włącza się",
  "description": "Wciskam power button, nic się nie dzieje. Sprawdziłem kabel zasilający - jest podłączony.",
  "status": "IN_PROGRESS",
  "subcategory": {
    "id": "sub_001",
    "name": "Komputer/Laptop",
    "category": {
      "id": "cat_001",
      "name": "Hardware"
    }
  },
  "createdBy": {
    "id": "user_001",
    "name": "Jan Kowalski",
    "email": "jan@firma.pl",
    "role": "USER"
  },
  "assignedTo": {
    "id": "agent_001",
    "name": "Anna Nowak",
    "email": "anna@firma.pl",
    "role": "AGENT"
  },
  "createdAt": "2025-10-10T14:30:00Z",
  "updatedAt": "2025-10-10T15:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Ticket doesn't exist
- `403 Forbidden` - User doesn't have access to this ticket
- `401 Unauthorized` - Not authenticated

**Business Logic:**
- **For USER role:**
  - Check: `createdById = currentUserId`
  - Return 403 if not owner
  
- **For AGENT role:**
  - Check: Ticket's category is in agent's assigned categories
  - Return 403 if not in assigned categories

---

#### PATCH /api/tickets/:ticketId/assign
**Description:** Assign ticket to current agent  
**Authentication:** Required (JWT)  
**Authorization:** AGENT only

**Request Body:**
```json
{}
```

**Success Response (200):**
```json
{
  "ticket": {
    "id": "ticket_001",
    "title": "Komputer nie włącza się",
    "status": "IN_PROGRESS",
    "assignedToId": "agent_001",
    "assignedTo": {
      "id": "agent_001",
      "name": "Anna Nowak",
      "email": "anna@firma.pl"
    },
    "updatedAt": "2025-10-10T15:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Ticket doesn't exist
- `403 Forbidden` - Agent doesn't have access to this category
- `409 Conflict` - Ticket already assigned to another agent
- `400 Bad Request` - Ticket is not in OPEN status
- `401 Unauthorized` - Not authenticated or not an agent

**Business Logic:**
- Verify agent has access to ticket's category
- Check ticket status is OPEN
- Check ticket is not already assigned (`assignedToId IS NULL`)
- Set `assignedToId = currentUserId`
- Set `status = IN_PROGRESS`
- Update `updatedAt` timestamp
- Trigger real-time update via Supabase

---

#### PATCH /api/tickets/:ticketId/status
**Description:** Update ticket status  
**Authentication:** Required (JWT)  
**Authorization:** AGENT only (assigned agent)

**Request Body:**
```json
{
  "status": "CLOSED"
}
```

**Success Response (200):**
```json
{
  "ticket": {
    "id": "ticket_001",
    "title": "Komputer nie włącza się",
    "status": "CLOSED",
    "updatedAt": "2025-10-10T16:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Ticket doesn't exist
- `403 Forbidden` - Agent is not assigned to this ticket
- `400 Bad Request` - Invalid status transition
- `401 Unauthorized` - Not authenticated or not an agent

**Validation Rules:**
- `status`: required, must be valid enum value
- Valid transitions:
  - `IN_PROGRESS → CLOSED` ✅
  - `OPEN → IN_PROGRESS` ✅ (via assign endpoint)
  - `CLOSED → *` ❌ (cannot reopen in MVP)

**Business Logic:**
- Verify agent is assigned to ticket (`assignedToId = currentUserId`)
- Validate status transition
- Update `status`
- Update `updatedAt` timestamp
- Trigger real-time update via Supabase

---

### 2.4 Agent Categories

#### GET /api/agent-categories/me
**Description:** Get current agent's assigned categories  
**Authentication:** Required (JWT)  
**Authorization:** AGENT only

**Success Response (200):**
```json
{
  "agentCategories": [
    {
      "id": "ac_001",
      "userId": "agent_001",
      "categoryId": "cat_001",
      "category": {
        "id": "cat_001",
        "name": "Hardware",
        "description": "Hardware-related issues"
      },
      "createdAt": "2025-10-01T10:00:00Z"
    },
    {
      "id": "ac_002",
      "userId": "agent_001",
      "categoryId": "cat_003",
      "category": {
        "id": "cat_003",
        "name": "Network",
        "description": "Network-related issues"
      },
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an agent

**Business Logic:**
- Filter by `userId = currentUserId`
- Return with populated category details
- Used for filtering tickets by agent permissions

---

#### GET /api/agent-categories/:categoryId/agents
**Description:** Get agents assigned to a specific category  
**Authentication:** Required (JWT)  
**Authorization:** AGENT only

**Success Response (200):**
```json
{
  "agents": [
    {
      "id": "agent_001",
      "name": "Anna Nowak",
      "email": "anna@firma.pl",
      "assignedAt": "2025-10-01T10:00:00Z"
    },
    {
      "id": "agent_002",
      "name": "Piotr Kowalczyk",
      "email": "piotr@firma.pl",
      "assignedAt": "2025-10-01T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Category doesn't exist
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an agent

**Business Logic:**
- Return all agents assigned to the specified category
- Used for visibility into team assignments

---

### 2.5 Users (Admin Operations)

#### PATCH /api/users/:userId/reset-password
**Description:** Reset user password to default (admin operation)  
**Authentication:** Required (JWT)  
**Authorization:** ADMIN only (not in MVP - manual SQL only)

**Note:** In MVP, this is done manually via SQL:
```sql
UPDATE "User" 
SET password = [bcrypt hash of 'Start!125'],
    "passwordResetRequired" = true
WHERE email = 'user@firma.pl';
```

---

## 3. Authentication and Authorization

### 3.1 Authentication Method

**Technology:** NextAuth.js v5 (Auth.js)  
**Strategy:** Credentials Provider (email + password)  
**Session:** JWT-based

### 3.2 Authentication Flow

1. **Login:**
   - User submits credentials to `/api/auth/login`
   - Server verifies bcrypt hashed password
   - Server generates JWT token with user data
   - JWT stored in HTTP-only cookie
   - Client receives session data

2. **Session Management:**
   - JWT contains: `userId`, `email`, `role`, `passwordResetRequired`
   - Token expires after 7 days
   - Middleware validates JWT on each request
   - Automatic refresh if token valid but expiring soon

3. **Logout:**
   - POST to `/api/auth/logout`
   - Server clears HTTP-only cookie
   - Client redirects to login page

### 3.3 Authorization Levels

| Role | Access Level |
|------|-------------|
| **USER** | Can create tickets, view own tickets only |
| **AGENT** | Can view tickets from assigned categories, assign tickets to self, update ticket status, create tickets |
| **ADMIN** | (Post-MVP) Full access to all resources |

### 3.4 Middleware Protection

**Protected Routes:**
- All `/api/*` routes except `/api/auth/login`
- Middleware checks:
  1. Valid JWT token exists
  2. Token not expired
  3. User still exists in database
  4. If `passwordResetRequired = true`, redirect to password change page

**Row-Level Security (RLS):**
- Implemented at database level (Supabase)
- Ensures data isolation even if application logic bypassed
- Policies:
  - **USER tickets:** `SELECT WHERE createdById = auth.uid()`
  - **AGENT tickets:** Complex JOIN through AgentCategory table
  - **Categories/Subcategories:** Public read for authenticated users

---

## 4. Validation and Business Logic

### 4.1 User Validation

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase or lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*()_+-=[]{}|;:,.<>?`)

**Email Validation:**
- Valid email format (RFC 5322)
- Unique in database

**Name Validation:**
- Required, 2-100 characters

### 4.2 Ticket Validation

**Title:**
- Required
- Minimum 5 characters
- Maximum 200 characters

**Description:**
- Required
- Maximum 300 characters (enforced at DB level: `@db.VarChar(300)`)

**Subcategory:**
- Required
- Must exist in database
- Must belong to valid category

**Status Transitions:**
| From | To | Allowed |
|------|----|----|
| OPEN | IN_PROGRESS | ✅ Via assign |
| IN_PROGRESS | CLOSED | ✅ Via status update |
| CLOSED | * | ❌ No reopening in MVP |

### 4.3 Business Logic Rules

#### 4.3.1 Ticket Creation
- Any authenticated user (USER or AGENT) can create tickets
- Creator can select any category/subcategory
- Initial status is always OPEN
- `createdById` is automatically set to current user
- `assignedToId` is initially NULL

#### 4.3.2 Ticket Assignment
- Only AGENTs can assign tickets
- Agent can only assign tickets from their authorized categories
- Agent can only assign to themselves (not to other agents)
- Only OPEN tickets can be assigned
- When assigned, status automatically changes to IN_PROGRESS
- Prevents race conditions: atomic check-and-update

#### 4.3.3 Ticket Visibility

**USER Role:**
```sql
SELECT * FROM tickets 
WHERE createdById = :currentUserId
```

**AGENT Role (unassigned tickets):**
```sql
SELECT t.* FROM tickets t
JOIN subcategories s ON t.subcategoryId = s.id
JOIN categories c ON s.categoryId = c.id
JOIN agent_categories ac ON c.id = ac.categoryId
WHERE ac.userId = :currentAgentId
  AND t.assignedToId IS NULL
  AND t.status = 'OPEN'
```

**AGENT Role (assigned to me):**
```sql
SELECT * FROM tickets 
WHERE assignedToId = :currentAgentId
```

#### 4.3.4 Agent Category Enforcement
- Database trigger ensures only users with role='AGENT' in AgentCategory
- Prevents application bugs from breaking authorization
- Trigger logic:
```sql
CREATE TRIGGER check_agent_role
BEFORE INSERT ON agent_categories
FOR EACH ROW
EXECUTE FUNCTION verify_agent_role();
```

#### 4.3.5 Password Reset Flow
1. Admin manually updates database:
   - Set `password` = bcrypt hash of "Start!125"
   - Set `passwordResetRequired` = true
2. User logs in with default password
3. Middleware detects `passwordResetRequired = true`
4. User redirected to password change form
5. User submits new password (validated)
6. System updates password and sets `passwordResetRequired = false`
7. User can now access application normally

---

## 5. Real-Time Updates

### 5.1 Supabase Realtime Integration

**Technology:** Supabase Realtime (PostgreSQL replication + WebSocket)

**Subscribed Tables:**
- `tickets` (all changes: INSERT, UPDATE, DELETE)

**Client Implementation:**
```typescript
// Subscribe to ticket changes
const channel = supabase
  .channel('tickets-changes')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'tickets',
      filter: `subcategoryId=in.(${agentSubcategoryIds})` // For agents
    },
    (payload) => {
      handleTicketUpdate(payload)
    }
  )
  .subscribe()
```

### 5.2 Real-Time Scenarios

**Scenario 1: Agent Assigns Ticket**
1. Agent A clicks "Take ticket" on Ticket #123
2. Server updates: `assignedToId = AgentA.id, status = IN_PROGRESS`
3. Supabase broadcasts UPDATE event
4. Agent B (viewing same category) receives event
5. Agent B's UI removes Ticket #123 from available list
6. User (ticket creator) receives event
7. User's UI updates status to "In Progress"

**Scenario 2: Agent Closes Ticket**
1. Agent A clicks "Close ticket" on Ticket #123
2. Server updates: `status = CLOSED`
3. Supabase broadcasts UPDATE event
4. User (ticket creator) receives event
5. User's UI updates status to "Closed"

**Scenario 3: New Ticket Created**
1. User creates Ticket #456 in category "Hardware"
2. Server inserts new ticket
3. Supabase broadcasts INSERT event
4. All agents with "Hardware" category receive event
5. Agents' UI adds new ticket to available list

### 5.3 Real-Time Filtering

**For USER:**
- Subscribe to: `tickets` WHERE `createdById = currentUserId`

**For AGENT:**
- Subscribe to: `tickets` WHERE ticket's category IN agent's assigned categories
- Implemented via filter: `subcategoryId=in.(sub1,sub2,sub3)`

---

## 6. Performance Considerations

### 6.1 Database Indexes

**Critical Indexes:**
```prisma
@@index([status, assignedToId])  // Ticket assignment queries
@@index([createdById])            // User's tickets
@@index([subcategoryId])          // Category filtering
@@index([userId, categoryId])     // AgentCategory lookups
```

### 6.2 Query Optimization

**Pagination:**
- Default: 20 items per page
- Maximum: 100 items per page
- Use offset pagination for MVP
- Consider cursor-based pagination in future

**Eager Loading:**
- Always include relations: `subcategory.category`, `createdBy`, `assignedTo`
- Use Prisma `include` for N+1 query prevention

**Caching:**
- Categories and subcategories are static (seeded)
- Consider in-memory cache (Redis in future)
- No caching for tickets (real-time requirement)

### 6.3 Rate Limiting

**Not implemented in MVP**, but recommended for production:
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user
- Special limits for ticket creation: 10 per hour per user

---

## 7. Error Handling

### 7.1 Standard Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title must be at least 5 characters"
      },
      {
        "field": "description",
        "message": "Description cannot exceed 300 characters"
      }
    ]
  }
}
```

### 7.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing credentials |
| `AUTHORIZATION_ERROR` | 403 | User lacks permission |
| `VALIDATION_ERROR` | 400, 422 | Input validation failed |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource state conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### 7.3 Validation Error Details

**Using Zod for validation:**
```typescript
// Ticket creation schema
const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().max(300, "Description cannot exceed 300 characters"),
  subcategoryId: z.string().cuid("Invalid subcategory ID")
})
```

---

## 8. Security Considerations

### 8.1 Password Security
- Passwords hashed with bcrypt (cost factor: 10)
- Never return password hashes in API responses
- Force password change on first login
- Validate password strength server-side

### 8.2 SQL Injection Prevention
- Use Prisma ORM (parameterized queries)
- Never concatenate user input into SQL

### 8.3 XSS Prevention
- Sanitize all user input on server
- Use Content Security Policy headers
- Escape output in UI components

### 8.4 CSRF Protection
- NextAuth includes CSRF tokens
- Use SameSite cookie attribute
- Verify origin headers

### 8.5 Rate Limiting
- Implement in production
- Prevent brute force attacks on login
- Prevent ticket spam

### 8.6 Row-Level Security
- Implemented at database level
- Backup for application-level authorization
- Prevents data leaks if application bug exists

---

## 9. API Versioning

**Current Version:** v1 (MVP)  
**Versioning Strategy:** Not implemented in MVP

**Future Consideration:**
- URL-based: `/api/v2/tickets`
- Header-based: `Accept: application/vnd.tickflow.v2+json`

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Validation schemas (Zod)
- Business logic functions
- Authentication helpers

### 10.2 Integration Tests
- API endpoint responses
- Database transactions
- Authorization checks

### 10.3 End-to-End Tests
- Complete user flows
- Real-time scenarios
- Cross-role interactions

---

## 11. Next.js Server Actions Implementation

Since this project uses **Next.js 15 with Server Actions**, the actual implementation differs from traditional REST API:

### 11.1 Server Actions vs REST

**Traditional REST:**
```typescript
// Client
fetch('/api/tickets', { method: 'POST', body: JSON.stringify(data) })

// Server: /api/tickets/route.ts
export async function POST(request: Request) { ... }
```

**Server Actions (recommended):**
```typescript
// Server: /app/actions/tickets.ts
'use server'
export async function createTicket(formData: FormData) {
  // Validation, authorization, database operation
  revalidatePath('/tickets')
  return { success: true, ticket }
}

// Client
import { createTicket } from '@/app/actions/tickets'
await createTicket(formData)
```

### 11.2 Recommended Implementation Approach

1. **Authentication:** Use NextAuth v5 API routes (`/api/auth/[...nextauth]`)
2. **Data Mutations:** Use Server Actions (create, update, delete)
3. **Data Fetching:** Use Server Components (direct database queries)
4. **Real-time:** Use Supabase client subscriptions (client components)

### 11.3 File Structure

```
app/
├── actions/
│   ├── auth.ts          # changePassword()
│   ├── tickets.ts       # createTicket(), assignTicket(), updateStatus()
│   └── categories.ts    # getCategories()
├── api/
│   └── auth/
│       └── [...nextauth]/route.ts  # NextAuth routes
└── (dashboard)/
    ├── tickets/
    │   └── page.tsx     # Server Component fetching tickets
    └── new-ticket/
        └── page.tsx     # Form with createTicket() action
```

---

## 12. API Documentation Generation

**Not implemented in MVP**, but recommended tools:
- **Swagger/OpenAPI:** Generate interactive docs
- **Postman Collection:** For testing
- **TypeScript types:** Export for client SDK

---

## Appendix A: Sample Workflows

### A.1 Complete Ticket Lifecycle

```
1. USER creates ticket
   POST /api/tickets
   → Status: OPEN, assignedTo: null

2. AGENT views available tickets
   GET /api/tickets?status=OPEN&assignedToMe=false
   → Sees ticket in their category

3. AGENT assigns ticket to self
   PATCH /api/tickets/:id/assign
   → Status: IN_PROGRESS, assignedTo: AgentID
   → Real-time: Other agents no longer see this ticket

4. USER sees status change
   → Real-time update shows "In Progress"

5. AGENT closes ticket
   PATCH /api/tickets/:id/status { status: "CLOSED" }
   → Status: CLOSED
   → Real-time: User sees "Closed"
```

### A.2 Password Reset Workflow

```
1. User forgets password, contacts admin
2. Admin runs SQL:
   UPDATE "User" SET 
     password = '$2b$10$...',  -- bcrypt('Start!125')
     "passwordResetRequired" = true
   WHERE email = 'user@firma.pl'
3. User logs in with Start!125
4. Middleware redirects to /change-password
5. User submits new password
   POST /api/auth/change-password
6. Server validates, hashes, updates:
   - password = new hash
   - passwordResetRequired = false
7. User redirected to dashboard
```

---

## Appendix B: Database Schema Reference

```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  password              String
  name                  String
  role                  Role     @default(USER)
  passwordResetRequired Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  ticketsCreated  Ticket[]        @relation("CreatedTickets")
  ticketsAssigned Ticket[]        @relation("AssignedTickets")
  agentCategories AgentCategory[]
}

model Ticket {
  id            String       @id @default(cuid())
  title         String
  description   String       @db.VarChar(300)
  status        TicketStatus @default(OPEN)
  subcategoryId String
  createdById   String
  assignedToId  String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  subcategory Subcategory @relation(fields: [subcategoryId], references: [id])
  createdBy   User        @relation("CreatedTickets", fields: [createdById], references: [id], onDelete: SetNull)
  assignedTo  User?       @relation("AssignedTickets", fields: [assignedToId], references: [id], onDelete: SetNull)
  
  @@index([status, assignedToId])
  @@index([createdById])
  @@index([subcategoryId])
}

model AgentCategory {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  createdAt  DateTime @default(now())
  
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([userId, categoryId])
  @@index([userId])
  @@index([categoryId])
}
```

---

**End of API Plan**

*This document serves as the comprehensive API specification for TickFlow MVP. All endpoints should be implemented following Next.js 15 best practices with Server Actions where appropriate.*

