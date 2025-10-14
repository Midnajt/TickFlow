<analiza>
1. Struktura kodu i główne komponenty:
   - Katalog `app/actions`: 
     • `ai/complete.ts` – Server Action do uzyskiwania sugestii AI  
   - Katalog `app/api`: 
     • Endpoiny autoryzacji:git add .*: `/auth/login`, `/auth/logout`, `/auth/change-password`, `/auth/session`  
     • Endpoiny kategorii: `/categories`, `/categories/[categoryId]/route.ts`, `/agent-categories/me`, `/agent-categories/[categoryId]/agents`  
     • Endpoiny ticketów: `/tickets`, `/tickets/[ticketId]/route.ts`, `/tickets/[ticketId]/assign`, `/tickets/[ticketId]/status`  
     • Endpoiny AI: `/ai/complete`  
   - Katalog `app/components`: 
     • Layouty i formularze: `AuthLayout.tsx`, `LoginForm.tsx`, `ChangePasswordForm.tsx`, `LogoutButton.tsx`  
     • Nagłówki i alerty: `DashboardHeader.tsx`, `ErrorAlert.tsx`  
     • Komponenty ticketów: `CreateTicketForm.tsx`, `TicketFilters.tsx`, `TicketCard.tsx`, `TicketList.tsx`, `TicketDetailsDialog.tsx`  
     • Przykładowy: `examples/AiExampleComponent.tsx`  
   - Katalog `app/hooks`: 
     • `useTickets.ts`, `useRealtimeTickets.ts`, `useCategories.ts` – logika pobierania i real-time  
   - Katalog `app/lib`: 
     • Klienci: `supabase.ts`, `supabase-server.ts`, `api-client.ts`  
     • Serwisy aplikacyjne: `services/auth.ts`, `services/categories.ts`, `services/tickets.ts`, `services/agent-categories.ts`  
     • Integracja AI: `services/openrouter/index.ts` + `errors.ts`  
     • Walidatory Zod: `validators/auth.ts`, `validators/categories.ts`, `validators/tickets.ts`, `validators/ai.ts`  
     • Middleware: `rate-limiter.ts`  
   - Pozostałe:  
     • `layout.tsx`, `page.tsx` (główny dashboard), `login/page.tsx`, `change-password/page.tsx`, `tickets/page.tsx`, `ai-demo/page.tsx`  
2. Krytyczne funkcjonalności:
   - Autentykacja i zarządzanie sesją (NextAuth + Supabase)  
   - Wymuszenie zmiany hasła przy pierwszym logowaniu  
   - Tworzenie, filtrowanie i wyświetlanie ticketów  
   - Przypisywanie i zamykanie ticketów (RBAC: USER vs AGENT)  
   - Real-time synchronizacja listy ticketów (Supabase Realtime + `useRealtimeTickets`)  
   - Sugestie klasyfikacji AI (Server Action + OpenRouter)  
   - Walidacja formularzy (React-Hook-Form + Zod)  
3. Zależności i mapa przepływów:
   • UI (React Components) → Hooks (`useTickets`, `useRealtimeTickets`) → Serwisy (`services/tickets`) → API Routes (`app/api/tickets`) → Prisma → PostgreSQL  
   • Formularze (React-Hook-Form + Zod) → Server Actions lub API Routes  
   • Autentykacja: NextAuth (Credentials) → Middleware → API Routes → Supabase  
   • Real-time: Supabase Realtime → Hooks → UI aktualizuje listę  
   • AI: Server Action → `app/lib/services/openrouter` → zewnętrzny API → UI  
4. Obszary ryzyka i złożoności:
   - Logika RBAC na poziomie backend i frontend (uprawnienia agent vs user)  
   - Trudne do testowania real-time subskrypcje i synchronizacja listy  
   - Walidacja dynamicznych, zależnych pól formularza (kategoria → podkategoria)  
   - Integracja z zewnętrznym serwisem AI i przetwarzanie struktur JSON  
   - Ścieżki edge-case: błędy sieci, przerywane połączenia, rate-limiting  
   - Zarządzanie stanem sesji i wymuszona zmiana hasła  
5. Impikacje testowe dla stosu technologicznego:
   - Next.js App Router: testy integracyjne API Routes można uruchamiać z `next-test-api-route-handler` lub bezpośrednio przez `supertest`  
   - Server Components vs Client Components: jednostkowe testy dla komponentów z `jest` + `@testing-library/react` (wspierające RSC)  
   - Server Actions: testy jednostkowe/mokowane na poziomie funkcji (można importować i wywoływać z `vitest`)  
   - Zod: testy walidatorów jako zwykłe testy jednostkowe  
   - Supabase: mokowanie klienta supabase za pomocą `msw` lub `jest-mock`  
   - Real-time: symulacja zdarzeń Realtime przez podmianę hooków lub testy integracyjne z lokalną instancją supabase-emulator  
   - E2E: Playwright / Cypress do scenariuszy end-to-end (logowanie, tworzenie, przypisanie, zamknięcie ticketu)  
6. Krótkie podsumowanie dostępnych narzędzi:
   - Unit & Integration: Jest / Vitest, Testing Library, MSW, supertest  
   - E2E: Playwright (polecany dla Next.js), opcjonalnie Cypress  
   - Linter: built-in Next.js ESLint + Prettier  
   - Coverage: `c8` / built-in Jest coverage  
7. Wstępna priorytetyzacja:
   a) Autentykacja & wymuszona zmiana hasła  
   b) Tworzenie i walidacja ticketu (formularz, Zod, serwis)  
   c) API Routes ticketów: tworzenie, pobieranie listy, przypisanie, status  
   d) Real-time subskrypcje  
   e) Integracja AI  
   f) UI komponenty (TicketCard, TicketList)  
   g) Hooki i serwisy pomocnicze  
</analiza>

# Plan Testów – TickFlow

## 1. Przegląd Projektu
TickFlow to aplikacja webowa do zarządzania ticketami IT z rolami USER i AGENT.  
Back-end: Next.js App Router, TypeScript, Prisma + PostgreSQL (Supabase), NextAuth v5.  
Front-end: React Server Components, Shadcn UI, Tailwind CSS, React Hook Form + Zod.  
Real-time: Supabase Realtime.  
AI Suggestions: OpenRouter (GPT-4o-mini).

## 2. Strategia Testowania
- Podział na warstwy:  
  • *Unit Tests* – logika walidacji (Zod), serwisy (`services/*`), walidatory, utility.  
  • *Integration Tests* – API Routes, Server Actions, baza testowa (in-memory lub testowa instancja Supabase/Prisma).  
  • *Component Tests* – UI komponenty z React Testing Library.  
  • *E2E Tests* – Playwright: pełne scenariusze użytkownika, w tym real-time, RBAC i AI.  
- CI: automatycznie uruchamiane wszystkie testy, coverage threshold ≥ 80%.
- **Test Runner: Vitest** – wybrany ze względu na lepszą kompatybilność z Next.js 15, React 19, Turbopack i natywne ESM.

## 3. Obszary Priorytetowe
1. Autentykacja: login, logout, wymuszenie zmiany hasła  
2. Formularz tworzenia ticketu: zależne walidacje Zod  
3. API Routes ticketów: create, list, assign, status update (RBAC)  
4. Real-time subskrypcje i filtrowanie listy w hooku `useRealtimeTickets`  
5. AI Suggestions: Server Action + integracja OpenRouter  
6. Generyczne komponenty: `TicketList`, `TicketCard`, `DashboardHeader`

## 4. Typy Testów

### 4.1 Testy Jednostkowe
- Zod schemas: `validators/*.ts`  
- Utility: `app/lib/utils`, `rate-limiter`  
- Serwisy: `services/auth`, `services/tickets`, `services/categories`, `services/openrouter` (moking fetch)  
- Hooki pure: funkcje formatujące, pipeline danych  

### 4.2 Testy Integracyjne
- API Routes: z użyciem `node-mocks-http` + Vitest przeciwko testowej bazie (Prisma + Supabase‐emulator)  
- Server Actions: wywołanie funkcji `completeAi`, `createTicket`, `assignTicket`, `closeTicket`, `changePassword` z mokami zależności
- MSW dla mockowania zewnętrznych API (OpenRouter, Supabase)

**Przykład testu API Route:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/tickets/route'

describe('POST /api/tickets', () => {
  it('should create ticket with valid data', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { title: 'Test', description: 'Test desc' }
    })
    const response = await POST(req)
    expect(response.status).toBe(201)
  })
})
```  

### 4.3 Testy Komponentów (UI)
- Renderowanie i interakcje z komponentami formularzy (React Hook Form + Toasty)  
- Stany błędów i loadingu (dialogi, alerty)  
- TicketCard / TicketList: filtrowanie, paginacja, brak wyników  

### 4.4 Testy Funkcjonalne / E2E
- Scenariusze:
  1. Login → wymuszona zmiana hasła → dashboard  
  2. Tworzenie nowego ticketu → walidacje → widok listy  
  3. Agent loguje się → widzi własne kategorie → przypisuje ticket → status IN_PROGRESS  
  4. Real-time: drugi agent nie widzi przypisanego ticketu  
  5. Zamykanie ticketu → status CLOSED → aktualizacja list  
  6. Sugestie AI: wypełnienie opisu → integracja → uzupełnienie formularza  

## 5. Narzędzia Testowe

### 5.1 Stos Testowy (Zaktualizowany)
| Warstwa | Narzędzie | Uzasadnienie |
|---------|-----------|--------------|
| **Test Runner** | **Vitest 2.x** | Natywne ESM, 10-20x szybszy niż Jest, kompatybilny z Turbopack, zero-config TS |
| **Component Testing** | **@testing-library/react 16.x** | Standard branżowy, user-centric approach, wsparcie dla React 19 |
| **E2E Testing** | **Playwright 1.48+** | Oficjalnie polecany przez Next.js, najlepsze wsparcie dla RSC i real-time |
| **API Mocking** | **MSW 2.x** | Mockowanie na poziomie network, działa w testach i przeglądarce |
| **API Route Testing** | **node-mocks-http** | Lekkie mockowanie req/res dla Next.js API Routes |
| **Coverage** | **@vitest/coverage-v8** | Built-in w Vitest, szybki, dokładny |
| **Debugowanie** | **@vitest/ui** | Graficzny interfejs do analizy i debugowania testów |
| **Dane testowe** | **@faker-js/faker** | Generowanie realistycznych danych testowych |

### 5.2 Dependencies do instalacji
```json
{
  "devDependencies": {
    // Core testing (Vitest)
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/ui": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    
    // Testing Library
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.0",
    
    // E2E
    "@playwright/test": "^1.48.0",
    
    // Mocking & Utilities
    "msw": "^2.6.0",
    "node-mocks-http": "^1.16.1",
    "jsdom": "^25.0.0",
    "@faker-js/faker": "^9.3.0"
  }
}
```

### 5.3 Scripts package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

### 5.4 Konfiguracja Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true, // opcjonalnie: expect, describe bez importu
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/.*rc.*',
        'supabase/migrations/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app')
    }
  }
})
```

### 5.5 Konfiguracja Playwright
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```  

## 6. Plan Wykonania
| Etap                  | Zakres                                  | Czas        | Narzędzia |
|-----------------------|-----------------------------------------|-------------|-----------|
| 0. Setup środowiska   | Instalacja Vitest, Playwright, MSW, konfiguracja | 0.5 dnia | npm install + config |
| 1. Konfiguracja CI/CD | GitHub Actions, coverage reports        | 0.5 dnia    | GitHub Actions |
| 2. Testy jednostkowe  | Walidatory, utility, serwisy            | 2–3 dni     | Vitest + MSW |
| 3. Testy integracyjne | API Routes, Server Actions              | 3–4 dni     | Vitest + node-mocks-http |
| 4. Testy komponentów  | Formularze, ticket components           | 2 dni       | Vitest + Testing Library |
| 5. E2E (Playwright)   | Pełne scenariusze użytkownika           | 3–4 dni     | Playwright |
| 6. Stabilizacja       | Poprawki testów, threshold coverage ≥80%| 1–2 dni     | Vitest UI dla debugowania |
| 7. Dokumentacja       | Raport pokrycia, instrukcje uruchomienia| 1 dzień     | Markdown + badges |

**Łącznie: ~12-16 dni roboczych**

## 7. Kryteria Akceptacji
- ★ Coverage ≥ 80% na kodzie TS (unit + integration)  
- ★ Wszystkie krytyczne scenariusze E2E przechodzą bez błędów  
- ★ Brak regresji w autoryzacji i RBAC  
- ★ Stabilne testy (deterministyczne, bez flaky)  
- ★ Automatyczny raport w CI oraz badge coverage w README  
- ★ Instrukcja uruchomienia testów (`npm test`, `npm run test:e2e`) dostępna w README  
- ★ Testy wykonują się szybko: unit <10s, integration <30s, E2E <2min
- ★ Vitest UI dostępne lokalnie do debugowania (`npm run test:ui`)

## 8. Uwagi Specjalne dla Next.js 15 + React 19

### 8.1 Kompatybilność z nowoczesnym stackiem
- **Next.js 15** + **React 19** + **Turbopack**: Vitest lepiej radzi sobie z bleeding edge technologiami
- **Zod v4**: Upewnij się że wszystkie testing utilities wspierają najnowszą wersję (masz override w package.json)
- **NextAuth v5 (beta)**: Mockowanie może być trudne - użyj MSW + test doubles dla sesji

### 8.2 Testowanie Server Components
```typescript
// app/components/__tests__/ServerComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

// Mock Server Action
vi.mock('@/app/actions/ai/complete', () => ({
  completeAi: vi.fn().mockResolvedValue({ suggestions: [] })
}))

test('renders server component', async () => {
  const { container } = render(await ServerComponent())
  expect(container).toBeInTheDocument()
})
```

### 8.3 Testowanie Real-time Supabase
- Użyj MSW do mockowania WebSocket connections
- Testuj hooki `useRealtimeTickets` z symulowanymi zdarzeniami
- W E2E testuj rzeczywiste połączenia z Supabase test instance

### 8.4 CI/CD (GitHub Actions)
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

## 9. Zasoby i Dokumentacja

### 9.1 Oficjalne dokumentacje
- [Vitest Documentation](https://vitest.dev/)
- [Playwright for Next.js](https://nextjs.org/docs/app/building-your-application/testing/playwright)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)

### 9.2 Przykładowe testy dla TickFlow
Katalog `tests/` zawiera:
```
tests/
├── setup.ts                    # Vitest setup
├── mocks/
│   ├── handlers.ts            # MSW handlers
│   └── supabase.ts            # Supabase mocks
├── unit/
│   ├── validators.test.ts     # Zod schemas
│   └── services.test.ts       # Business logic
├── integration/
│   ├── api/                   # API Routes
│   └── actions/               # Server Actions
├── components/
│   ├── forms.test.tsx         # Form components
│   └── tickets.test.tsx       # Ticket components
└── e2e/
    ├── auth.spec.ts           # Authentication flows
    ├── tickets.spec.ts        # Ticket management
    └── realtime.spec.ts       # Real-time features
```

> Po realizacji wszystkich etapów projekt zostaje uznany za przetestowany oraz gotowy do wdrożenia.