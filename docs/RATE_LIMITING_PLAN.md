# Plan Implementacji Rate Limiting dla Admin Endpoints

## Status: ZAPLANOWANE (Nie w MVP)

Rate limiting nie jest wymagany dla MVP, ale jest zalecany przed wdrożeniem na produkcję dla większej liczby użytkowników.

## Wymagania

### 1. Endpoint Tworzenia Użytkowników
**Endpoint:** `POST /api/admin/users`

**Limity:**
- **10 użytkowników / minutę / admin** - zapobiega masowemu tworzeniu kont
- **100 użytkowników / dzień / admin** - dodatkowa ochrona

**Powód:** Zapobiega:
- Przypadkowemu utworzeniu dużej liczby użytkowników przez błąd w UI
- Złośliwemu utworzeniu botów/spam accounts
- Przeciążeniu systemu przy masowym imporcie

### 2. Pozostałe Admin Endpoints (Opcjonalne)
**Endpoints:**
- `PATCH /api/admin/users/:userId`
- `PATCH /api/admin/categories/:categoryId`
- `PATCH /api/admin/subcategories/:subcategoryId`
- `GET /api/admin/audit-logs`

**Limity:**
- **100 requests / minutę / admin** - ogólny limit dla wszystkich admin operations

## Metody Implementacji

### Opcja 1: Next.js Middleware + Redis (Zalecane dla produkcji)

**Stack:**
- Upstash Redis (serverless, zgodny z Vercel)
- Next.js Middleware
- Token bucket algorithm

**Przykład:**

```typescript
// lib/middleware/rate-limit.ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

// Rate limiter dla tworzenia użytkowników
export const createUserRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "admin:create-user",
});

// Rate limiter dla wszystkich admin operations
export const adminRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "admin:general",
});
```

**Użycie w API Route:**

```typescript
// app/api/admin/users/route.ts
import { createUserRateLimit } from "@/app/lib/middleware/rate-limit";

export const POST = withRole(["ADMIN"], async (request, user) => {
  // Rate limiting
  const identifier = user.id;
  const { success, limit, reset, remaining } = await createUserRateLimit.limit(
    identifier
  );

  if (!success) {
    return errorResponse(
      `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
      "RATE_LIMIT_EXCEEDED",
      429,
      {
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      }
    );
  }

  // ... reszta logiki tworzenia użytkownika
});
```

**Zalety:**
- ✅ Serverless (zgodny z Vercel)
- ✅ Persystentny (działa między deploys)
- ✅ Analytics (monitoring użycia)
- ✅ Skalowalne

**Wady:**
- ❌ Wymaga Upstash account (darmowy tier: 10k requests/day)
- ❌ Dodatkowe dependency

### Opcja 2: In-Memory Rate Limiting (MVP / Development)

**Stack:**
- Map/Object w pamięci
- Sliding window algorithm
- Brak persystencji

**Przykład:**

```typescript
// lib/middleware/simple-rate-limit.ts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function simpleRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Reset jeśli window expired
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: maxRequests - 1, resetAt };
  }

  // Sprawdź limit
  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment
  entry.count++;
  rateLimitStore.set(identifier, entry);
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Cleanup old entries (run periodically)
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup co 5 minut
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
```

**Zalety:**
- ✅ Brak external dependencies
- ✅ Szybkie (in-memory)
- ✅ Proste do implementacji

**Wady:**
- ❌ Nie działa w serverless (każda funkcja ma osobną pamięć)
- ❌ Resetuje się przy każdym deploy
- ❌ Nie współdzielone między instancjami

### Opcja 3: Database-Based Rate Limiting (Supabase)

**Stack:**
- Tabela `rate_limits` w Supabase
- Query + cleanup trigger

**Przykład:**

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_lookup ON rate_limits(identifier, endpoint, window_start);

-- Cleanup trigger (usuń stare wpisy)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_rate_limits
  AFTER INSERT ON rate_limits
  EXECUTE FUNCTION cleanup_rate_limits();
```

**Zalety:**
- ✅ Persystentny
- ✅ Współdzielony między wszystkimi instancjami
- ✅ Nie wymaga dodatkowych serwisów

**Wady:**
- ❌ Wolniejsze (network latency)
- ❌ Dodatkowe obciążenie bazy danych
- ❌ Bardziej złożone w implementacji

## Rekomendacja

### Dla MVP / Development:
**Opcja 2** (In-Memory) - proste, szybkie, wystarczające dla małej liczby adminów

### Dla Produkcji:
**Opcja 1** (Redis) - skalowalne, niezawodne, industry standard

## Plan Implementacji (Faza Post-MVP)

1. **Wybór rozwiązania** - Upstash Redis (Opcja 1)
2. **Setup Upstash account** - Free tier wystarczający na start
3. **Implementacja rate limiter middleware** - `lib/middleware/rate-limit.ts`
4. **Integracja z admin endpoints** - Dodać do każdego endpoint
5. **Monitoring** - Logować rate limit violations w audit_logs
6. **Testing** - Testy integracyjne z rate limiting
7. **Dokumentacja** - Instrukcje dla adminów

## Monitoring Rate Limits

Dodać do audit_logs:

```typescript
await AuditLogService.createLog({
  userId: adminUserId,
  action: "RATE_LIMIT_EXCEEDED",
  resourceType: "rate_limit",
  details: {
    endpoint: "/api/admin/users",
    limit: 10,
    remaining: 0,
    resetAt: resetTimestamp,
  },
  ipAddress: AuditLogService.getClientIp(request),
});
```

## Frontend Handling

Dodać obsługę 429 (Rate Limit Exceeded) w `api-client.ts`:

```typescript
if (response.status === 429) {
  const data = await response.json();
  const resetAt = new Date(data.error.reset);
  const secondsRemaining = Math.ceil(
    (resetAt.getTime() - Date.now()) / 1000
  );

  throw new Error(
    `Rate limit exceeded. Please wait ${secondsRemaining} seconds before trying again.`
  );
}
```

## Koszt Implementacji

- **Czas implementacji:** ~2-3 godziny (z testami)
- **Koszt infrastruktury:** $0 (Upstash free tier)
- **Maintainance:** Minimalny

---

**Data utworzenia:** 2025-01-22  
**Status:** ZAPLANOWANE - Implementacja po MVP  
**Priorytet:** ŚREDNI (Nice-to-have przed production scale)

