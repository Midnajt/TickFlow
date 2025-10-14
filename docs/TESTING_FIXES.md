# Testing Fixes - API Route Testing

## Problem

Testy integracyjne dla API routes zwracały błąd 500 zamiast oczekiwanego kodu statusu (np. 401), z komunikatem:

```
TypeError: request.json is not a function
```

## Przyczyna

1. **Niewłaściwe narzędzie do mockowania**: `node-mocks-http` było zaprojektowane dla starszego Pages Router w Next.js, nie dla nowoczesnego App Router.

2. **Brak mockowania zależności**: Testy nie mockowały poprawnie:
   - `supabase-server` - klient bazy danych
   - `bcryptjs` - funkcje hashowania haseł
   - `rate-limiter` - middleware do rate limiting

3. **Nieprawidłowy format mocka request**: Mock z `node-mocks-http` nie implementował właściwych metod `NextRequest` z Next.js 15.

## Rozwiązanie

### 1. Usunięcie `node-mocks-http`

Zastąpiliśmy `node-mocks-http` bezpośrednim mockowaniem `NextRequest`:

```typescript
import { NextRequest } from 'next/server'

// Helper function to create mock NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: new Headers(),
    method: 'POST',
    url: 'http://localhost:3000/api/auth/login',
  } as NextRequest
}
```

### 2. Dodanie mocków zależności

```typescript
// Mock supabase-server
vi.mock('@/app/lib/supabase-server', () => ({
  supabaseServer: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}))

// Mock rate limiter
vi.mock('@/app/lib/middleware/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => null),
  addRateLimitHeaders: vi.fn(),
}))
```

### 3. Konfiguracja mocków w testach

```typescript
it('should return 401 for invalid credentials', async () => {
  const { supabaseServer } = await import('@/app/lib/supabase-server')
  const mockBcrypt = await import('bcryptjs')
  
  // Mock user exists in database
  const mockUser = {
    id: '123',
    email: 'test@firma.pl',
    name: 'Test User',
    password: '$2a$10$hashedpassword',
    role: 'USER',
    force_password_change: false,
  }
  
  // Setup mock to return user
  const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
  vi.mocked(supabaseServer.from).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
  } as any)
  
  // Mock password comparison to fail
  vi.mocked(mockBcrypt.compare).mockResolvedValue(false as never)

  const req = createMockRequest({
    email: 'test@firma.pl',
    password: 'wrongpassword',
  })

  const response = await POST(req)
  const data = await response.json()

  expect(response.status).toBe(401)
  expect(data.error).toBe('AUTHENTICATION_ERROR')
})
```

## Zaktualizowane pliki

1. ✅ `tests/integration/api/auth.test.ts` - Poprawione testy API
2. ✅ `tests/README.md` - Dodana sekcja "API Route Tests"
3. ✅ `docs/TESTING_SETUP.md` - Usunięta referencja do `node-mocks-http`
4. ✅ `docs/TESTING_COMPLETE.md` - Usunięta referencja do `node-mocks-http`
5. ✅ `.ai/test-plan.md` - Zaktualizowane przykłady testów

## Best Practices dla testowania Next.js App Router

### ✅ DO:
- Używaj bezpośredniego mockowania `NextRequest`
- Mockuj wszystkie zewnętrzne zależności (Supabase, bcrypt, etc.)
- Testuj konkretne kody statusu HTTP
- Sprawdzaj format odpowiedzi (error messages, data structure)

### ❌ DON'T:
- Nie używaj `node-mocks-http` dla App Router
- Nie polegaj na rzeczywistych połączeniach do bazy danych w testach jednostkowych
- Nie pomijaj mockowania middleware (rate limiter, auth)

## Następne kroki

Jeśli będziesz dodawać nowe testy API routes:

1. **Skopiuj helper `createMockRequest`** do swoich testów
2. **Mockuj wszystkie zależności** na początku pliku testowego
3. **Konfiguruj mocki** w każdym teście według potrzeb
4. **Testuj różne scenariusze**: success, validation errors, authentication errors, server errors

## Przykładowy szablon nowego testu API

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/your-route/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/app/lib/supabase-server', () => ({
  supabaseServer: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: new Headers(),
    method: 'POST',
    url: 'http://localhost:3000/api/your-route',
  } as NextRequest
}

describe('POST /api/your-route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle valid request', async () => {
    // Arrange: Setup mocks
    const { supabaseServer } = await import('@/app/lib/supabase-server')
    vi.mocked(supabaseServer.from).mockReturnValue({
      // ... your mock implementation
    } as any)

    // Act: Make request
    const req = createMockRequest({ /* your data */ })
    const response = await POST(req)
    
    // Assert: Check response
    expect(response.status).toBe(200)
  })
})
```

## Status

✅ **Problem rozwiązany** - Testy API routes działają poprawnie z właściwym mockowaniem Next.js App Router.

