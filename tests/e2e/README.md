# TickFlow E2E Tests

Comprehensive End-to-End tests for TickFlow using Playwright.

## Overview

This test suite covers the following scenarios based on the test plan:

1. **Authentication Flow** (`auth.spec.ts`)
   - Login/logout
   - Password reset on first login
   - Form validation
   - Session persistence
   - Protected routes

2. **Ticket Management** (`tickets.spec.ts`)
   - Ticket creation and validation
   - AI-powered category suggestions
   - Filtering and search
   - Agent assignment workflow (RBAC)
   - Status management
   - Comments

3. **Real-time Features** (`realtime.spec.ts`)
   - Real-time ticket creation updates
   - Assignment synchronization
   - Status change propagation
   - Concurrent user updates
   - Subscription lifecycle

## Test Structure

```
tests/e2e/
├── auth.spec.ts           # Authentication tests
├── tickets.spec.ts        # Ticket management tests
├── realtime.spec.ts       # Real-time synchronization tests
├── helpers/
│   ├── auth-helpers.ts    # Authentication utilities
│   └── ticket-helpers.ts  # Ticket management utilities
└── README.md             # This file
```

## Prerequisites

### Test Database Setup

**IMPORTANT**: Before running E2E tests, you MUST reseed the database to ensure test users exist with correct credentials.

Run the seed script:
```bash
npm run seed:users
npm run seed:categories
```

The test suite expects the following users (created by seed script):

- **newuser@tickflow.com** / Agent123!@# (USER role, force_password_change: true)
- **user@tickflow.com** / User123!@# (USER role)
- **agent@tickflow.com** / Agent123!@# (AGENT role)

These credentials are defined in `tests/e2e/helpers/auth-helpers.ts` and must match the seed data.

### Environment Variables

Create a `.env.test` file with test database credentials:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
OPENROUTER_API_KEY="..."
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test auth.spec.ts
npx playwright test tickets.spec.ts
npx playwright test realtime.spec.ts
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run specific test by name
```bash
npx playwright test -g "should successfully login"
```

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports include:
- Test results and timing
- Screenshots on failure
- Videos on failure
- Trace files for debugging

## Debugging Failed Tests

### 1. View traces
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 2. Run in debug mode
```bash
npx playwright test --debug
```

### 3. Use Playwright Inspector
The debug mode automatically opens Playwright Inspector where you can:
- Step through test actions
- Inspect DOM
- View console logs
- See network requests

### 4. Check screenshots and videos
Failed tests automatically capture:
- Screenshots: `test-results/[test-name]/test-failed-1.png`
- Videos: `test-results/[test-name]/video.webm`

## Helper Functions

### Authentication Helpers

```typescript
import { loginUser, loginAsUser, logout } from './helpers/auth-helpers'

// Login with credentials
await loginUser(page, 'test@firma.pl', 'Test123!')

// Login with predefined user
await loginAsUser(page, 'normalUser')

// Logout
await logout(page)
```

### Ticket Helpers

```typescript
import { 
  createTicket, 
  assignTicketToSelf,
  changeTicketStatus,
  closeTicket 
} from './helpers/ticket-helpers'

// Create ticket
await createTicket(page, {
  title: 'Test Ticket',
  description: 'Description',
  categoryIndex: 1
})

// Assign ticket
await assignTicketToSelf(page)

// Change status
await changeTicketStatus(page, 'IN_PROGRESS')

// Close ticket
await closeTicket(page)
```

## Best Practices

### 1. Use Helper Functions
Reuse helper functions from `helpers/` directory to keep tests DRY.

### 2. Wait for Elements
Always wait for elements to be visible before interacting:

```typescript
await expect(page.getByRole('button', { name: /submit/i })).toBeVisible()
```

### 3. Use Test IDs
Components should have `data-testid` attributes for reliable selection:

```typescript
const tickets = page.getByTestId('ticket-card')
```

### 4. Handle Real-time Updates
For real-time tests, allow time for Supabase Realtime to propagate:

```typescript
await waitForRealtimeUpdate(3000)
```

### 5. Clean Test Data
Each test should be independent and not rely on previous test state.

### 6. Use Descriptive Test Names
Test names should clearly describe what is being tested:

```typescript
test('should show validation error for empty email field', async ({ page }) => {
  // ...
})
```

## CI/CD Integration

### GitHub Actions

The tests are configured to run in CI with:
- Sequential execution (no parallel)
- 2 retries for flaky tests
- HTML and JSON reports
- Screenshot and video artifacts

Example workflow:

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify database connection

### Elements not found
- Check if element selectors match UI
- Use Playwright Inspector to debug
- Verify component has proper test IDs

### Real-time tests failing
- Ensure Supabase Realtime is enabled
- Check Realtime permissions in database
- Increase wait time for propagation

### Flaky tests
- Add explicit waits for async operations
- Use `waitForLoadState('networkidle')`
- Avoid hard-coded timeouts when possible

## Coverage Goals

Based on test-plan.md, target coverage:

- ✅ Authentication: Login, logout, password change
- ✅ Ticket CRUD: Create, read, update, close
- ✅ RBAC: User vs Agent permissions
- ✅ Real-time: Multi-user synchronization
- ✅ AI Integration: Category suggestions
- ✅ Filtering: Status, search queries
- ✅ Validation: Form errors, edge cases

## Performance Benchmarks

Expected test execution times:

- Authentication tests: ~30s
- Ticket management tests: ~60s
- Real-time tests: ~90s (due to waiting for propagation)
- **Total suite: < 3 minutes**

## Contributing

When adding new tests:

1. Follow existing patterns from current tests
2. Use helper functions for common operations
3. Add descriptive test names and comments
4. Ensure tests are independent and can run in any order
5. Update this README if adding new test files or helpers

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Plan](../../.ai/test-plan.md)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing/playwright)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

