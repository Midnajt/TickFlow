# Testing Guide - TickFlow

## Overview

TickFlow uses a comprehensive testing strategy with multiple layers:

- **Unit Tests** - Vitest for validators, utilities, and business logic
- **Component Tests** - Testing Library for React components
- **Integration Tests** - API routes and Server Actions
- **E2E Tests** - Playwright for complete user flows

## Quick Start

### Running Tests

```bash
# Run all unit/integration tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# View E2E test report
npm run test:e2e:report

# Run all tests (unit + E2E)
npm run test:all
```

## Test Structure

```
tests/
├── setup.ts                    # Vitest setup & global mocks
├── mocks/
│   ├── handlers.ts            # MSW request handlers
│   └── supabase.ts            # Supabase client mocks
├── unit/
│   └── validators.test.ts     # Zod schema validation tests
├── integration/
│   └── api/
│       └── auth.test.ts       # API route tests
├── components/
│   └── LoginForm.test.tsx     # Component tests
└── e2e/
    ├── auth.spec.ts           # Authentication E2E tests
    └── tickets.spec.ts        # Ticket management E2E tests
```

## Writing Tests

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/utils'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })
})
```

### Component Tests (Testing Library)

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

### API Route Tests (Next.js App Router)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/app/lib/supabase-server', () => ({
  supabaseServer: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

// Helper to create mock request
function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: new Headers(),
    method: 'POST',
    url: 'http://localhost:3000/api/auth/login',
  } as NextRequest
}

describe('POST /api/auth/login', () => {
  it('should return 400 for invalid data', async () => {
    const req = createMockRequest({ email: 'invalid' })
    const response = await POST(req)
    
    expect(response.status).toBe(400)
  })
})
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('test@firma.pl')
  await page.getByLabel(/password/i).fill('Test123!')
  await page.getByRole('button', { name: /login/i }).click()
  
  await expect(page).toHaveURL('/tickets')
})
```

## Mocking

### MSW (Mock Service Worker)

All API mocks are defined in `tests/mocks/handlers.ts`:

```typescript
export const handlers = [
  http.get('/api/tickets', () => {
    return HttpResponse.json([...mockTickets])
  }),
]
```

### Supabase Mocks

Supabase client is mocked in `tests/mocks/supabase.ts` and automatically applied in all tests.

### API Route Testing

When testing API routes in `tests/integration/api/`, mock the service layer instead of the database:

```typescript
// Mock the AuthService instead of database/bcrypt directly
vi.mock('@/app/lib/services/auth', () => ({
  AuthService: {
    login: vi.fn(),
  },
}))

// In tests, control the service behavior
vi.mocked(AuthService.login).mockRejectedValue(
  new Error('AUTHENTICATION_ERROR:Nieprawidłowy email lub hasło')
)
```

This approach is cleaner and tests the actual route logic without coupling to implementation details.

### Component Testing with react-hook-form

When testing components that use `react-hook-form` with `mode: 'onBlur'`:

```typescript
// Trigger validation by focusing and blurring
const emailInput = screen.getByLabelText(/email/i)
await user.click(emailInput)
await user.tab() // This triggers onBlur validation

// Now validation errors should appear
await waitFor(() => {
  expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument()
})
```

The validation in react-hook-form doesn't trigger on submit if no fields have been touched. Use `onBlur` events to trigger field-level validation.

## Coverage Requirements

Target: **≥80%** for all metrics
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Run `npm run test:coverage` to generate a coverage report in `coverage/` directory.

## Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names**: "should do X when Y happens"
3. **Test user behavior, not implementation**: Use Testing Library queries that mimic user interaction
4. **Keep tests isolated**: Each test should be independent
5. **Mock external dependencies**: Database, APIs, third-party services
6. **Use data-testid sparingly**: Prefer accessible queries (getByRole, getByLabel)
7. **Write deterministic tests**: Avoid flaky tests with proper waits and assertions

## CI/CD Integration

Tests run automatically on push and pull requests via GitHub Actions. See `.github/workflows/test.yml`.

## Debugging

### Unit/Component Tests

```bash
# Use Vitest UI for visual debugging
npm run test:ui

# Use console.log or vi.debug() in tests
# Tests run in jsdom environment
```

### E2E Tests

```bash
# Debug mode with inspector
npm run test:e2e:debug

# UI mode for visual debugging
npm run test:e2e:ui

# View traces after test failure
npm run test:e2e:report
```

## Environment Variables

Tests use mock environment variables defined in `tests/setup.ts`. No need for `.env.local` during testing.

## Troubleshooting

### Vitest Issues

- **Module resolution errors**: Check path aliases in `vitest.config.ts`
- **React component errors**: Ensure `@vitejs/plugin-react` is configured
- **Type errors**: Verify `globals: true` in config

### Playwright Issues

- **Browser not found**: Run `npx playwright install`
- **Timeout errors**: Increase timeout in test or config
- **Element not found**: Use proper waits and assertions

## Additional Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Documentation](https://testing-library.com)
- [Playwright Documentation](https://playwright.dev)
- [MSW Documentation](https://mswjs.io)

