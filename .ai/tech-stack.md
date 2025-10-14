## TickFlow - Stack Technologiczny

Projekt: TickFlow – System zgłaszania ticketów IT
Wersja: MVP 1.0
Data aktualizacji: 6 października 2025

### 🛠️ Stack technologiczny
#### Frontend & Backend
Framework:       Next.js 14+ (App Router)
Language:        TypeScript
Styling:         Tailwind CSS
UI Components:   shadcn/ui
Form Handling:   React Hook Form + Zod validation
State:           React Server Components + Server Actions

#### Database & Real-time
Database:        PostgreSQL (Supabase)
ORM:             Prisma
Real-time:       Supabase Realtime (WebSocket)
Hosting DB:      Supabase Cloud (darmowy tier: 500MB)

#### Autentykacja
Auth Library:    NextAuth.js v5 (Auth.js)
Strategy:        Credentials (email + password)
Session:         JWT
Password:        bcrypt hashing

#### Deployment
Development/Staging:  Vercel (darmowy)
Production (docelowo): Node.js server (własna domena)
Database (zawsze):     Supabase Cloud
Real-time (zawsze):    Supabase WebSocket (działa niezależnie od hostingu)

### Dlaczego Supabase Real-time?

✅ Działa niezależnie od lokalizacji aplikacji Next.js
✅ Darmowy tier wystarczający na projekt
✅ Łatwa integracja (PostgreSQL Replication)
✅ Automatic reconnection
✅ Bez własnego serwera WebSocket

### 📦 Dependencies (bez JSON)

#### Runtime

next ^14.2

react ^18.3

next-auth ^5 (beta / v5)

@supabase/supabase-js ^2.45

@prisma/client ^5.18

bcrypt ^5.1

zod ^3.23

react-hook-form ^7.52

#### Dev

prisma ^5.18

typescript ^5.5

tailwindcss ^3.4

@types/bcrypt ^5.0

#### Testing

vitest ^2.1

@testing-library/react ^16.1

@playwright/test ^1.48

msw ^2.6

node-mocks-http ^1.16

@faker-js/faker ^9.3

Tip: trzymaj wersje w ryzach przez ~ dla patchy na prodzie, ^ na dev.

### 🌍 Environment Variables
#### Development (.env.local)
```dotenv
# Database
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-here"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."
SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."
# OpenRouter (AI Suggestions)
OPENROUTER_API_KEY="sk-or-v1-..."
```

#### Production (Vercel)
```dotenv
# Database
DATABASE_URL="postgresql://..." # Supabase

# NextAuth
NEXTAUTH_URL="https://tickflow.vercel.app"
NEXTAUTH_SECRET="prod-secret"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."
SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."
# OpenRouter (AI Suggestions)
OPENROUTER_API_KEY="sk-or-v1-..."
```

Bezpieczeństwo: SERVICE_ROLE_KEY tylko po stronie serwera; nigdy w przeglądarce.

### 📁 Folder Structure
tickflow/
```text
├── .ai/
│   ├── prd.md
│   └── tech-stack.md (ten dokument)
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── user/{tickets,new-ticket}/
│   │   └── agent/{tickets,my-tickets}/
│   ├── ai-demo/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── ai/complete/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── tickets/
│   │   ├── auth/
│   │   └── examples/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── supabase.ts
│   │   ├── validators/
│   │   └── services/openrouter/
│   ├── actions/
│   │   └── ai/complete.ts
│   ├── layout.tsx
│   └── page.tsx
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

### 🧩 Model danych (ERD) – skrót
User (1) ──creates──> (N) Ticket
User (1) ──assigned──> (N) Ticket
Category (1) ──has──> (N) Subcategory
Subcategory (1) ──has──> (N) Ticket
User(Agent) (N) ──has access to──> (N) Category


#### Relacje kluczowe

Agent ↔ Category (many-to-many) – dostęp agenta do kategorii

Category ↔ Subcategory (one-to-many)

Subcategory ↔ Ticket (one-to-many)

### 🗃️ Prisma Schema (źródło prawdy dla ORM)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  passwordResetRequired Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  ticketsCreated  Ticket[] @relation("CreatedTickets")
  ticketsAssigned Ticket[] @relation("AssignedTickets")
  agentCategories AgentCategory[]
}

enum Role {
  USER
  AGENT
}

model Category {
  id            String        @id @default(cuid())
  name          String        @unique
  description   String?
  subcategories Subcategory[]
  agents        AgentCategory[]
  createdAt     DateTime      @default(now())
}

model Subcategory {
  id          String   @id @default(cuid())
  name        String
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  tickets     Ticket[]
  createdAt   DateTime @default(now())

  @@unique([categoryId, name])
  @@index([categoryId])
}

model AgentCategory {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([userId, categoryId])
  @@index([userId])
  @@index([categoryId])
}

model Ticket {
  id            String       @id @default(cuid())
  title         String
  description   String       @db.VarChar(300)
  status        TicketStatus @default(OPEN)
  subcategoryId String
  subcategory   Subcategory  @relation(fields: [subcategoryId], references: [id])
  createdById   String
  createdBy     User         @relation("CreatedTickets", fields: [createdById], references: [id])
  assignedToId  String?
  assignedTo    User?        @relation("AssignedTickets", fields: [assignedToId], references: [id])
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([status])
  @@index([assignedToId])
  @@index([createdById])
  @@index([subcategoryId])
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}
```

### 🌱 Seed danych (skrót – TS)
```ts
// prisma/seed.ts (skrót najważniejszych danych)
const DEFAULT_PASSWORD = 'Start!125';

const categoriesWithSubcategories = [
  { name: 'Hardware', description: 'Problemy sprzętowe',
    subcategories: ['Komputer/Laptop','Drukarka','Monitor','Akcesoria (mysz, klawiatura)','Inne'] },
  { name: 'Software', description: 'Problemy z oprogramowaniem',
    subcategories: ['Instalacja programu','Problem z aplikacją','Licencje','Aktualizacje','Inne'] },
  { name: 'Network', description: 'Problemy z siecią',
    subcategories: ['Brak internetu','Wolne WiFi','VPN','Dostęp do serwera','Inne'] },
  { name: 'Account & Access', description: 'Dostępy i konta',
    subcategories: ['Reset hasła','Dostęp do systemu','Uprawnienia','Konto email','Inne'] },
  { name: 'Other', description: 'Pozostałe problemy',
    subcategories: ['Inne problemy'] },
];

const users = [
  { email: 'jan.kowalski@firma.pl', name: 'Jan Kowalski', role: 'AGENT', password: DEFAULT_PASSWORD, passwordResetRequired: true },
  { email: 'anna.nowak@firma.pl', name: 'Anna Nowak', role: 'AGENT', password: DEFAULT_PASSWORD, passwordResetRequired: true },
  { email: 'user@firma.pl',       name: 'Testowy User',   role: 'USER',  password: DEFAULT_PASSWORD, passwordResetRequired: true },
];

const agentCategoryAssignments = [
  { agent: 'jan.kowalski@firma.pl',  categories: ['Hardware','Network'] },
  { agent: 'anna.nowak@firma.pl',    categories: ['Software','Account & Access','Other'] },
];
```

### 🔐 Matryca uprawnień (RBAC – MVP)
```text
Akcja / Rola	USER	AGENT
Logowanie	✅	✅
Tworzenie ticketu	✅	✅
Podgląd własnych ticketów	✅	✅
Podgląd cudzych ticketów	❌	⚠️ (tylko w swoich kategoriach i tylko „otwarte”)
Przypisywanie ticketu	❌	✅ (tylko ze swoich kategorii)
Zmiana statusu ticketu	❌	✅ (przypisane do siebie)
Zarządzanie kategoriami	❌	❌
```
### ⚡ Real-time: kanały i zdarzenia

Źródło: Supabase Realtime (replikacja tabel)

Kanały logiczne (tabele): Ticket, opcjonalnie AgentCategory

Zdarzenia:

ticket.created – nowy ticket (po INSERT)

ticket.assigned – przypisanie (po UPDATE.assignedToId)

ticket.status_changed – zmiana statusu (po UPDATE.status)

Filtrowanie po stronie klienta:

Agent: subskrybuje tylko tickety z własnych kategorii (JOIN: Ticket → Subcategory → Category → AgentCategory)

User: subskrybuje tylko tickety gdzie createdById = session.user.id

Zasada anty-duplikacyjna: po assignedToId != null ticket znika z listy „do wzięcia” u innych agentów z tej kategorii.

### 🧪 Walidacje formularzy (Zod – biznesowe reguły MVP)

Hasło (zmiana przy 1. logowaniu): min. 8 znaków, min. 1 litera, 1 cyfra, 1 znak specjalny.

Ticket:

categoryId – wymagane

subcategoryId – wymagane, zależne od kategorii

title – wymagane, min. 5 znaków

description – wymagane, max. 300 znaków (licznik znaków w UI)

### 🔒 Bezpieczeństwo

NextAuth v5 (Credentials + JWT), sesje krótkie, odświeżanie przez ponowne logowanie (MVP).

Hashing haseł: bcrypt.

Wymuszenie zmiany hasła: passwordResetRequired = true dla kont z hasłem domyślnym.

Separacja danych: zapytania zawsze filtrowane po roli i kontekście (user: createdById; agent: kategorie).

Klucze: SUPABASE_SERVICE_ROLE_KEY tylko po stronie serwera.

Rate limiting (MVP – lekki): prosty ogranicznik na endpoint logowania i tworzenia ticketów (edge/middleware).

### 🧰 Server Actions (MVP – przykładowe operacje)
completeAi(formData) – analiza opisu → zwraca sugestie AI (kategoria, tytuł itp.)
createTicket(formData) – walidacja Zod → insert Ticket
assignTicket(ticketId) – kontrola dostępu do kategorii → update assignedToId & status=IN_PROGRESS
closeTicket(ticketId) – tylko właściciel przypisania → status=CLOSED
changePassword(old, next) – weryfikacja hasła → update user + passwordResetRequired=false

Uwaga: w MVP preferujemy Server Actions zamiast klasycznych API routes.

### 🤖 AI & Machine Learning
#### AI Suggestions (Ticket Classification)
Aplikacja wykorzystuje AI do automatycznej klasyfikacji zgłoszeń na podstawie opisu problemu. Funkcja "Sugestia AI" w formularzu tworzenia ticketu:
- **Serwis:** OpenRouter (`openrouter.ai`) jako brama do modeli językowych.
- **Model:** Domyślnie `openai/gpt-4o-mini` dla optymalnego balansu między szybkością, kosztem i jakością.
- **Funkcjonalność:** Analizuje opis użytkownika i zwraca ustrukturyzowaną odpowiedź JSON zawierającą:
    - `categoryId` (sugerowana kategoria)
    - `subcategoryId` (sugerowana podkategoria)
    - `summary` (krótkie podsumowanie problemu)
    - `suggestedSteps` (proponowane kroki do rozwiązania)
- **Implementacja:** Wywoływane przez Server Action (`/app/actions/ai/complete.ts`), które korzysta z dedykowanego serwisu (`/app/lib/services/openrouter`).
- **Bezpieczeństwo:** Klucz `OPENROUTER_API_KEY` jest używany wyłącznie po stronie serwera i nigdy nie jest eksponowany do klienta.

### 🧪 Testing & Quality Assurance

#### Strategia Testowania
TickFlow implementuje wielowarstwową strategię testowania zapewniającą wysoką jakość kodu i niezawodność aplikacji:

**Poziomy testowania:**
- **Unit Tests** – walidatory Zod, utility functions, business logic
- **Integration Tests** – API Routes, Server Actions, database interactions
- **Component Tests** – React components z Testing Library
- **E2E Tests** – pełne scenariusze użytkownika z Playwright

**Cel pokrycia:** ≥80% dla całego kodu TypeScript

#### Stos Technologiczny Testów

**Test Runner & Framework:**
- **Vitest 2.x** – nowoczesny test runner, 10-20x szybszy niż Jest
  - Natywne wsparcie ESM
  - Zero-config TypeScript
  - Kompatybilny z Next.js 15 + Turbopack
  - Built-in coverage przez @vitest/coverage-v8

**Component Testing:**
- **@testing-library/react 16.x** – user-centric testing approach
- **@testing-library/jest-dom** – custom matchers dla DOM
- **@testing-library/user-event** – symulacja interakcji użytkownika

**E2E Testing:**
- **Playwright 1.48+** – oficjalnie polecany przez Next.js
  - Multi-browser support (Chromium, Firefox, WebKit)
  - Wsparcie dla React Server Components
  - Auto-wait dla elementów
  - Screenshot & video recording
  - Parallel execution

**Mocking & Utilities:**
- **MSW 2.x** – mockowanie na poziomie network layer
  - Działa w testach i przeglądarce
  - Service Worker dla realistic mocking
- **node-mocks-http** – mockowanie Request/Response dla API Routes
- **@faker-js/faker** – generowanie realistycznych danych testowych

#### Konfiguracja Vitest
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
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', '**/*.config.*', 'supabase/migrations/'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './app') }
  }
})
```

#### Konfiguracja Playwright
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

#### Struktura Testów
```
tests/
├── setup.ts                    # Vitest setup & global mocks
├── mocks/
│   ├── handlers.ts            # MSW handlers
│   └── supabase.ts            # Supabase client mocks
├── unit/
│   ├── validators.test.ts     # Zod schemas validation
│   └── services.test.ts       # Business logic tests
├── integration/
│   ├── api/                   # API Routes tests
│   └── actions/               # Server Actions tests
├── components/
│   ├── forms.test.tsx         # Form components tests
│   └── tickets.test.tsx       # Ticket components tests
└── e2e/
    ├── auth.spec.ts           # Authentication flows
    ├── tickets.spec.ts        # Ticket management
    └── realtime.spec.ts       # Real-time features
```

#### Skrypty Testowe
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

#### Obszary Testowe

**Testy Jednostkowe:**
- Walidatory Zod (`validators/*.ts`)
- Utility functions (`lib/utils/*`)
- Rate limiter logic
- OpenRouter service (z mocked fetch)
- Auth utilities

**Testy Integracyjne:**
- API Routes: `/api/auth/*`, `/api/tickets/*`, `/api/categories/*`
- Server Actions: `completeAi`, `createTicket`, `assignTicket`, `closeTicket`
- Database interactions (Prisma + test database)

**Testy Komponentów:**
- Formularze: `LoginForm`, `ChangePasswordForm`, `CreateTicketForm`
- Komponenty ticketów: `TicketCard`, `TicketList`, `TicketDetailsDialog`
- Hooki: `useTickets`, `useRealtimeTickets`, `useCategories`

**Testy E2E (Playwright):**
1. Autentykacja: login → wymuszenie zmiany hasła → dashboard
2. User workflow: tworzenie ticketu → walidacje → lista ticketów
3. Agent workflow: widok kategorii → przypisanie → zmiana statusu
4. Real-time: synchronizacja list między użytkownikami
5. AI Suggestions: analiza opisu → sugestie kategorii

#### CI/CD Integration
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

#### Kryteria Akceptacji Testów
- ✅ Coverage ≥ 80% dla całego kodu TypeScript
- ✅ Wszystkie krytyczne scenariusze E2E przechodzą bez błędów
- ✅ Brak regresji w autoryzacji i RBAC
- ✅ Stabilne testy (deterministyczne, bez flaky tests)
- ✅ Automatyczny raport coverage w CI
- ✅ Szybkie wykonanie: unit <10s, integration <30s, E2E <2min

### 🧱 Decyzje architektoniczne (skrót)

App Router (przyszłość Next.js), Server Components (wydajność), Server Actions (prostsze mutacje).

Prisma > Drizzle – krzywa nauki i dokumentacja.

Supabase Realtime > custom WS – mniej utrzymania, szybciej do MVP.

NextAuth v5 > Clerk/Auth0 – kontrola nad schematem i koszty.

### 🧯 Błędy i logowanie

UI: spójne stany loading/empty/error, toasty dla akcji.

Serwer: logi błędów (console / Vercel logs), maskowanie danych wrażliwych.

Fallback realtime: w razie problemów – opcjonalny polling (np. co 5 s) w widokach agent/user.

### 🚀 Build & Deploy

Dev: npm run dev

Prisma: npx prisma db push → npx prisma db seed

Vercel: ustaw sekrety środowiskowe, włącz build Next.js, migracje przez prisma migrate deploy (w razie potrzeby).

Monitoring (proste): Vercel analytics + logi edge/functions.

### 🧪 Testy (lightweight na MVP)

Unit: walidacje Zod (schematy)

E2E (opcjonalnie): kilka krytycznych ścieżek w Playwright (login, create, assign, close)

Manual: smoke test po deployu (checklista poniżej)

### ✅ Setup Checklist

 Supabase: projekt + DATABASE_URL, ANON_KEY, SERVICE_ROLE_KEY

 NEXTAUTH_SECRET wygenerowany (openssl rand -base64 32)

 OPENROUTER_API_KEY dodany (dla AI suggestions)

 .env.local uzupełnione

 npm install ukończone

 npx prisma db push + npx prisma db seed

 npm run dev startuje bez błędów

 Login testowy: user@firma.pl / Start!125

 Po zalogowaniu wymuszona zmiana hasła działa

 npm test – testy jednostkowe przechodzą

 npm run test:e2e – testy E2E gotowe do uruchomienia

### 📚 Dokumentacja (linki)

Next.js – docs

Auth.js (NextAuth v5) – docs

Prisma – docs

Supabase Realtime – docs

shadcn/ui – docs

Tailwind CSS – docs

React Hook Form – docs

Zod – docs

(Celowo bez surowych URL – wkleisz w README, a tu utrzymujemy „czysty” kontekst pod prompty.)

### 📝 Notatki developerskie (do przypominania w promptach)

Kategorie i podkategorie są stałe w MVP (bez UI do edycji).

Agent widzi tylko kategorie, do których ma dostęp (JOIN po AgentCategory).

Przejęty ticket natychmiast znika z listy innych agentów tej kategorii (real-time).

Opis ticketu max 300 znaków, tytuł min. 5 znaków, oba wymagane.

Reset hasła (na potrzeby wsparcia): ustaw hasło na Start!125 i passwordResetRequired=true, system wymusi zmianę.