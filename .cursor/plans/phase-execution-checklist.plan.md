# ✅ TickFlow - Checklist Wdrażania Faz

**Dokument:** Phase Execution & Implementation Checklist
**Data:** Październik 2025
**Status:** Ready for Execution
**Menedżer Projektu:** Tech Lead

---

## 🎯 Quick Start - Pierwsze Kroki

### 1. Przygotowanie Repozytorium

```bash
# 1.1 Upewnij się że jesteś na najnowszym develop
git checkout develop
git pull origin develop

# 1.2 Stwórz feature branchę
git checkout -b feature/admin-panel-phase1-foundation

# 1.3 Sprawdź status current branch
git status
```

### 2. Review Dokumentacji

- [ ] Przeczytaj `implementation-roadmap-2025.plan.md` - Overview
- [ ] Przeczytaj `database-migrations-plan.plan.md` - DB changes
- [ ] Przeczytaj `.ai/tech-stack.md` - Architecture
- [ ] Przeczytaj `.ai/prd.md` - Business requirements

### 3. Ustawienie Dev Environment

```bash
# 3.1 Zainstaluj dependencies
npm install

# 3.2 Upewnij się że Supabase jest dostępny
# - Check .env.local czy masz DATABASE_URL
# - Test connection: npx prisma db execute --stdin << 'EOF'
#   SELECT 1;
#   EOF

# 3.3 Uruchom dev server
npm run dev

# 3.4 Verify build jest bez errów
npm run build
```

### 4. Database Setup

```bash
# 4.1 Pull current schema z Supabase
supabase db pull

# 4.2 Verify migration system
# - Sprawdź czy Supabase ma `_prisma_migrations` table

# 4.3 Jeśli coś jest nie tak, reset (DEV ONLY!):
# supabase db reset
```

---

## 📋 FAZA 1: Foundation (Tygodnie 1-2)

### Cele Fazy 1
- ✅ Fix admin assign ticket bug
- ✅ Implement ticket reopen feature
- ✅ Implement ticket transfer feature
- ✅ Database migrations ready
- ✅ All tests passing

### Sprint 1.1: Bug Fix & Core Features

#### Task: T2.3.1 - Fix Admin Cannot Assign Ticket

```typescript
// CHECKLIST:
// [ ] Locate bug: app/api/tickets/[id]/assign.ts
// [ ] Trace authorization logic
// [ ] Add admin role check
// [ ] Add test case for admin assign
// [ ] Verify agent assign still works
// [ ] Test in browser
// [ ] Commit: "fix: allow admin to assign tickets"
```

**Steps:**

1. **Debug** (`app/api/tickets/[id]/assign.ts`)
```typescript
// Current logic (probably):
if (user.role !== "AGENT") {
  return new Response("Unauthorized", { status: 403 })
}

// Should be:
if (user.role !== "AGENT" && user.role !== "ADMIN") {
  return new Response("Unauthorized", { status: 403 })
}

// OR better:
if (user.role === "USER") {
  return new Response("Unauthorized", { status: 403 })
}
```

2. **Add Category Check for Agents**
```typescript
// For AGENT: verify category access
if (user.role === "AGENT") {
  const hasAccess = await checkAgentCategoryAccess(
    user.id,
    ticket.subcategory.categoryId
  )
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 403 })
  }
}
// For ADMIN: no category check needed
```

3. **Test** - Add to `tests/integration/api/tickets.test.ts`
```typescript
it('admin should be able to assign any ticket', async () => {
  const response = await assignTicket(
    ticketId,
    adminUserId,
    adminToken
  )
  expect(response.status).toBe(200)
})
```

4. **Commit & PR**
```bash
git add .
git commit -m "fix(tickets): allow admin to assign tickets

- Update authorization logic to include ADMIN role
- Admins can assign any ticket without category restriction
- Agents still require category access
- Add test for admin assign flow"

git push origin feature/admin-panel-phase1-foundation
```

**Acceptance Criteria:**
- ✅ Admin can assign any ticket
- ✅ Agent can still assign only their category tickets
- ✅ User cannot assign any ticket (still forbidden)
- ✅ No 403 errors for valid scenarios
- ✅ Tests pass

**Estimated:** 2 hours

---

#### Task: T2.1.1 - Reopen Ticket Feature

**Checklist:**
```
Frontend:
- [ ] Add "Reopen" button to TicketDetailsDialog
- [ ] Add confirmation dialog
- [ ] Show loading state while reopening
- [ ] Update ticket status in UI
- [ ] Show toast notification on success

Backend:
- [ ] Create POST /api/tickets/[id]/reopen
- [ ] Validate user permissions (admin or assigned agent)
- [ ] Validate ticket status is CLOSED
- [ ] Update ticket: status = OPEN, reopenedCount++, reopenedAt = now()
- [ ] Log action to audit_logs
- [ ] Trigger real-time update

Tests:
- [ ] Unit: Reopen logic
- [ ] Integration: API endpoint
- [ ] E2E: Reopen flow
```

**Implementation Steps:**

1. **Backend - API Route** `app/api/tickets/[id]/reopen.ts`
```typescript
// Pseudo code
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ticket = await getTicket(params.id)
  
  // Verify permissions
  if (!canReopenTicket(user, ticket)) {
    return unauthorized()
  }
  
  // Reopen ticket
  const reopened = await prisma.ticket.update({
    where: { id: params.id },
    data: {
      status: 'OPEN',
      assignedToId: null,
      reopenedCount: { increment: 1 },
      reopenedAt: new Date()
    }
  })
  
  // Log action
  await logAuditEvent(
    user.id,
    'REOPEN_TICKET',
    'TICKET',
    params.id,
    { oldStatus: 'CLOSED', newStatus: 'OPEN' }
  )
  
  return json(reopened)
}
```

2. **Server Action** `app/actions/tickets/reopenTicket.ts`
```typescript
'use server'

import { reopenTicketSchema } from '@/lib/validators'

export async function reopenTicket(
  ticketId: string
): Promise<Result<Ticket>> {
  try {
    const response = await fetch(
      `/api/tickets/${ticketId}/reopen`,
      { method: 'POST' }
    )
    
    if (!response.ok) {
      throw new Error(await response.text())
    }
    
    return { success: true, data: await response.json() }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

3. **Frontend Component** - Update `TicketDetailsDialog.tsx`
```typescript
{ticket.status === 'CLOSED' && canReopen(user) && (
  <Button
    variant="outline"
    onClick={handleReopen}
    disabled={isReopening}
  >
    {isReopening ? 'Reopening...' : 'Reopen Ticket'}
  </Button>
)}
```

4. **Test** `tests/integration/api/tickets.test.ts`
```typescript
describe('POST /api/tickets/:id/reopen', () => {
  it('admin can reopen closed ticket', async () => {
    const response = await POST(
      ticketId,
      adminContext
    )
    expect(response.status).toBe(200)
    expect(response.data.status).toBe('OPEN')
  })
  
  it('agent can reopen their ticket', async () => {
    const response = await POST(
      ticketId,
      agentContext
    )
    expect(response.status).toBe(200)
  })
})
```

**Acceptance Criteria:**
- ✅ Admin can reopen any ticket
- ✅ Agent can reopen their assigned ticket
- ✅ Status changes from CLOSED to OPEN
- ✅ reopenedCount increments
- ✅ Real-time update works
- ✅ Audit log created

**Estimated:** 4 hours

---

#### Task: T2.2.1 - Transfer Ticket Feature

**Implementation Steps:**

1. **Backend - Transfer Logic** `app/api/tickets/[id]/transfer.ts`
2. **Frontend - Transfer Modal** `app/components/tickets/TransferTicketModal.tsx`
3. **Tests** - Full integration tests
4. **Real-time** - Update for both agents

**Estimated:** 6 hours

**Acceptance Criteria:**
- ✅ Agent can transfer to same category
- ✅ Admin can transfer to any agent
- ✅ New agent gets notification
- ✅ History is logged
- ✅ Real-time update

---

### Sprint 1.2: Database Migrations

#### Task: Prepare & Test Migrations

```bash
# CHECKLIST:
# [ ] Create 5 SQL migration files in supabase/migrations/
# [ ] Add them to Prisma schema
# [ ] Test locally with `supabase db push`
# [ ] Verify Prisma Client generation
# [ ] Create test data
```

**Steps:**

1. **Create Migration Files**
```bash
touch supabase/migrations/20251021_create_audit_logs.sql
touch supabase/migrations/20251021_create_login_logs.sql
touch supabase/migrations/20251021_create_ai_suggestions_log.sql
touch supabase/migrations/20251021_alter_categories_add_ai_fields.sql
touch supabase/migrations/20251021_alter_tickets_add_tracking_fields.sql
```

2. **Copy SQL Content** from `database-migrations-plan.md`

3. **Update Prisma Schema** `prisma/schema.prisma`
   - Add enums: `AuditActionType`, `AuditResourceType`
   - Add models: `AuditLog`, `LoginLog`, `AiSuggestionLog`
   - Update models: `User`, `Category`, `Ticket`

4. **Test Locally**
```bash
# Reset database (DEV ONLY!)
supabase db reset

# Push migrations
supabase db push

# Generate Prisma Client
npx prisma generate

# Verify with Prisma Studio
npx prisma studio
```

5. **Create Seed Script** `scripts/seed-test-data.ts`
```typescript
// Optional: Add test data for manual testing
```

**Estimated:** 3 hours

---

### Sprint 1 Deliverables

- ✅ Admin assign ticket bug fixed
- ✅ Reopen ticket feature working
- ✅ Transfer ticket feature working
- ✅ 5 Database migrations created
- ✅ Prisma schema updated
- ✅ All tests passing
- ✅ PR ready for review

**Total Estimated Time:** 12-15 hours (2-3 days)

---

## 📋 FAZA 2: Admin Panel (Tygodnie 3-5)

### Cele Fazy 2
- ✅ Categories Management page
- ✅ Users Management page
- ✅ Agents Management page
- ✅ Create User functionality
- ✅ Audit Logs dashboard
- ✅ Full admin panel navigation

### Sprint 2.1: Categories Management

**Tasks:**
- T1.1.1: Categories Management UI
- Add category edit functionality
- Show assigned agents per category
- Add AI description field

**Estimated:** 8 hours

### Sprint 2.2: Users Management

**Tasks:**
- T1.2.1: Users Management page
- T1.2.2: Agents Management page
- Add role change functionality
- Add force password reset

**Estimated:** 10 hours

### Sprint 2.3: User Creation & Audit Logs

**Tasks:**
- T1.3.1: Create User modal
- T1.4.1 & T1.4.2: Audit Logs dashboard
- Add filtering and search
- Add export functionality

**Estimated:** 12 hours

**Phase 2 Total:** 30 hours (1.5 weeks)

---

## 📋 FAZA 3: Enhanced Features (Tygodnie 6-7)

### Sprint 3.1: AI Suggestions Improvements (T3.1.1 & T3.2.1)
- Update AI prompt
- Add logging table
- Track applied suggestions
- **Estimated:** 8 hours

### Sprint 3.2: Login Audit System (T4.1.1 & T4.2.1)
- Create login logs table
- Log all login attempts
- Add login history dashboard
- **Estimated:** 6 hours

**Phase 3 Total:** 14 hours (1 week)

---

## 📋 FAZA 4: Polishing (Tydzień 8)

### Sprint 4.1: UX/UI Improvements (T5.1-T5.5)
- Mobile scroll fix
- Change username feature
- Dev-only config
- Status analysis
- Documentation update

**Estimated:** 8 hours

**Phase 4 Total:** 8 hours (1 day)

---

## 📋 FAZA 5: Release & Deployment (Tydzień 9)

### Pre-Release Checklist

- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing (`npm test:integration`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Coverage ≥80% for new code
- [ ] No console errors/warnings
- [ ] Accessibility audit passed
- [ ] Mobile responsive verified
- [ ] Performance benchmarks OK
- [ ] Security audit passed
- [ ] Database backup created
- [ ] Rollback procedure documented
- [ ] Deployment guide ready

### Deployment Steps

1. **Staging Deployment**
```bash
# Create PR -> Vercel preview -> Full testing
# Verify all features work on staging
# Run smoke tests
# Performance baseline
```

2. **Production Deployment**
```bash
# Merge to main
# Vercel triggers deployment
# Migrations run automatically
# Monitor for errors
# Verify features live
```

3. **Post-Deployment**
```bash
# Run smoke tests on production
# Monitor logs for 24h
# Get user feedback
# Prepare hotfix if needed
```

---

## 🔍 Quality Gates

### Code Quality
- [ ] TypeScript strict mode - zero errors
- [ ] ESLint - zero warnings
- [ ] Prettier formatted
- [ ] No console.log in production code
- [ ] No TODO comments without issue

### Testing
- [ ] Unit tests: ≥80% coverage
- [ ] Integration tests: All passing
- [ ] E2E tests: Critical paths covered
- [ ] No flaky tests

### Performance
- [ ] Initial load: <3s
- [ ] API response: <500ms
- [ ] Admin tables: <1s render
- [ ] Real-time: <2s update

### Security
- [ ] OWASP top 10 check passed
- [ ] RLS policies tested
- [ ] No API leaks
- [ ] Passwords hashed
- [ ] Environment vars secure

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast OK

---

## 📊 Progress Tracking

### Weekly Standup Template

```markdown
## Week X Standup

### Completed ✅
- [ ] Task X - Status
- [ ] Task Y - Status

### In Progress 🔄
- [ ] Task Z - % complete

### Blocked 🚫
- [ ] Task A - Reason

### Risks
- [ ] Risk description

### Next Week
- [ ] Priority task 1
- [ ] Priority task 2
```

### Metrics to Track

```
- Lines of code added
- Test coverage %
- Bug density (bugs per 1000 LOC)
- Code review time
- Deployment frequency
- Mean time to recovery (MTTR)
```

---

## 🚨 Issue Resolution Process

### Bug Found in Phase 1-4

```
1. Severity Assessment
   - Critical: Drop everything, fix immediately
   - High: Add to current sprint
   - Medium: Add to backlog
   - Low: Document for later

2. Assignment
   - Who: Best person for the fix
   - When: Based on severity

3. Fix
   - Create branch: bugfix/issue-name
   - Fix with tests
   - Code review

4. Deployment
   - Test staging
   - Deploy to prod
   - Monitor

5. Documentation
   - Update docs
   - Post-mortem if critical
```

### Bug Found in Production

```
1. Rollback or Hotfix?
   - Rollback: If feature is broken
   - Hotfix: If fix is simple and tested

2. If Rollback:
   - git revert
   - Deploy previous version
   - Verify data integrity

3. If Hotfix:
   - Create hotfix branch
   - Fix + tests
   - Fast-track review
   - Deploy immediately
   - Monitor closely

4. Post-Incident:
   - Root cause analysis
   - Process improvements
   - Communication to stakeholders
```

---

## 📞 Communication & Escalation

### Daily
- [ ] Team standup (15 min)
- [ ] Check Slack for blockers

### Weekly
- [ ] Progress report to PM
- [ ] Demo to stakeholders (Friday)
- [ ] Retrospective (if needed)

### Escalation Path
```
Issue Level 1: Team Lead
Issue Level 2: Project Manager
Issue Level 3: CTO
Issue Level 4: Stakeholder Sign-off
```

---

## 📚 Documentation Requirements

### Code Documentation
- [ ] Inline comments for complex logic
- [ ] JSDoc for all functions
- [ ] README for new modules
- [ ] Architecture decisions documented

### API Documentation
- [ ] OpenAPI/Swagger specs
- [ ] Example requests/responses
- [ ] Error codes documented
- [ ] Rate limits documented

### User Documentation
- [ ] Admin guide (how to use panel)
- [ ] User FAQ
- [ ] Troubleshooting guide
- [ ] Video tutorials (optional)

### Developer Documentation
- [ ] Setup guide
- [ ] Development workflow
- [ ] Testing guidelines
- [ ] Deployment procedure

---

## 🎓 Knowledge Transfer

### Phase 1-2 Complete: Knowledge Transfer Session
```
1. Architecture overview (30 min)
2. Database schema walkthrough (30 min)
3. API endpoints review (30 min)
4. Frontend components review (30 min)
5. Testing strategy (30 min)
6. Deployment process (30 min)
Total: 3 hours
```

### Recorded Sessions
- [ ] Setup environment
- [ ] Running tests
- [ ] Making changes
- [ ] Deploying code
- [ ] Troubleshooting

---

## ✅ Final Checklist Before Release

### Code Review
- [ ] All PRs reviewed by 2+ reviewers
- [ ] All comments resolved
- [ ] No blocked PRs

### Testing
- [ ] Manual smoke tests passed
- [ ] Automated tests 100% pass rate
- [ ] No known bugs P1/P2
- [ ] Performance acceptable

### Deployment
- [ ] Migrations verified
- [ ] Environment variables set
- [ ] Backups created
- [ ] Rollback plan ready
- [ ] Monitoring alerts set

### Documentation
- [ ] README updated
- [ ] API docs complete
- [ ] Admin guide finished
- [ ] Changelog written

### Go/No-Go Decision
```
Team:    ☐ Ready  ☐ Not Ready
PM:      ☐ Ready  ☐ Not Ready
QA:      ☐ Ready  ☐ Not Ready
Ops:     ☐ Ready  ☐ Not Ready

Final Decision:
☐ GO TO PRODUCTION
☐ DELAY - Reason: _______________
☐ ROLLBACK - Reason: _______________
```

---

## 📞 24/7 Support (First Week)

### On-Call Schedule
```
Week 1:
Mon-Tue: Dev team lead (primary) + Senior dev (backup)
Wed-Thu: Different dev + Senior dev
Fri-Sun: Senior dev (primary) + On-call (backup)
```

### Incident Response
```
SLA:
- P1: Response <30min, Resolution <2h
- P2: Response <1h, Resolution <4h
- P3: Response <4h, Resolution <8h
- P4: Response <1d, Resolution <3d
```

---

**Dokument Zaktualizowany:** 2025-10-21
**Wersja:** 1.0 - Ready for Execution
**Status:** ✅ Approved for Start
