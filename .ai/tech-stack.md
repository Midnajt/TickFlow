## TickFlow - Stack Technologiczny

Projekt: TickFlow – System zgłaszania ticketów IT
Wersja: MVP 1.0
Data aktualizacji: 22 października 2025

### 🛠️ Stack technologiczny
#### Frontend & Backend
Framework:       Next.js 15 (App Router)
Language:        TypeScript
Styling:         Tailwind CSS 4
UI Components:   shadcn/ui + Radix UI
Form Handling:   React Hook Form + Zod validation
State:           React Server Components (RSC) + Server Actions

#### Database & Real-time
Database:        PostgreSQL (Supabase)
Data access:     supabase-js (bez ORM)
Migrations:      Supabase SQL (folder `supabase/migrations`)
Real-time:       Supabase Realtime (WebSocket)
Hosting DB:      Supabase Cloud (free tier)

#### Autentykacja
Auth Library:    NextAuth.js v5 (Auth.js)
Strategy:        Credentials (email + password)
Session:         JWT (HttpOnly cookie)
Password:        bcryptjs hashing

#### Deployment
Development/Staging:  Vercel (free)
Production (opcjonalnie): Vercel lub własny Node.js
Database (zawsze):     Supabase Cloud
Realtime (zawsze):     Supabase Realtime

### Dlaczego Supabase Realtime?

✅ Działa niezależnie od lokalizacji aplikacji Next.js
✅ Darmowy tier wystarczający na projekt
✅ Łatwa integracja (PostgreSQL replication)
✅ Automatic reconnection
✅ Bez własnego serwera WebSocket

### 📦 Dependencies (bez JSON)

#### Runtime

next ^15.5

react ^19.2

next-auth ^5.0.0-beta.29

@supabase/supabase-js ^2.74

bcryptjs ^3.0

zod ^4.1

react-hook-form ^7.64

lucide-react ^0.545

#### Dev

typescript ^5.9

tailwindcss ^4.1

@vitejs/plugin-react ^5

vitest ^3.2

@vitest/coverage-v8 ^3.2

@testing-library/react ^16.3

@testing-library/jest-dom ^6.9

@playwright/test ^1.56

msw ^2.11

happy-dom ^20 / jsdom ^27

#### Testing (narzędzia pomocnicze)

node-mocks-http ^1.17

@faker-js/faker ^10

### 🌍 Environment Variables
#### Development (.env.local)
```dotenv
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-here"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."
SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."  # tylko po stronie serwera

# OpenRouter (AI Suggestions)
OPENROUTER_API_KEY="sk-or-v1-..."
```

#### Production (Vercel)
```dotenv
# NextAuth
NEXTAUTH_URL="https://tickflow.vercel.app"
NEXTAUTH_SECRET="prod-secret"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."
SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."  # tylko po stronie serwera

# OpenRouter (AI Suggestions)
OPENROUTER_API_KEY="sk-or-v1-..."
```
Bezpieczeństwo: SERVICE_ROLE_KEY wyłącznie na serwerze (RSC/route handlers/server actions), nigdy w przeglądarce.

### 📁 Folder Structure (MVP)
```text
tickflow/
├── app/
│   ├── admin/{categories,users,logs}/
│   ├── api/**
│   ├── components/**
│   ├── actions/ai/**
│   ├── lib/
│   │   ├── services/**
│   │   ├── validators/**
│   │   ├── supabase.ts
│   │   └── supabase-server.ts
│   ├── layout.tsx
│   └── page.tsx
├── scripts/
│   ├── run-migration.ts          # helper: wyświetla SQL do skopiowania w Supabase
│   ├── seed-users.ts
│   ├── seed-categories.ts
│   ├── seed-navireo.ts
│   └── verify-foreign-keys.ts
├── supabase/
│   └── migrations/*.sql          # źródło prawdy dla schematu
├── tests/                        # unit/integration/component/e2e
├── public/
├── package.json
├── tailwind.config.ts
├── next.config.ts
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

Źródło typów: `app/lib/database.types.ts` (generowane ze schematu Supabase).

### 🌱 Seed danych (skrót – TS)
Dane seed uruchamiane scriptami (supabase-js + SERVICE_ROLE_KEY):
```bash
npm run seed:users
npm run seed:categories
npm run seed:navireo
```

### 🔐 Matryca uprawnień (RBAC – MVP)
```text
Akcja / Rola	USER	AGENT	ADMIN
Logowanie	✅	✅	✅
Tworzenie ticketu	✅	✅	✅
Podgląd własnych ticketów	✅	✅	✅
Podgląd cudzych ticketów	❌	⚠️ (tylko w swoich kategoriach)	✅
Przypisywanie ticketu	❌	✅ (ze swoich kategorii)	✅
Zmiana statusu ticketu	❌	✅ (przypisane do siebie)	✅
Admin panel	❌	❌	✅
```

### ⚡ Real-time: kanały i zdarzenia
Źródło: Supabase Realtime (replikacja tabel)

Kanały logiczne (tabele): Ticket, opcjonalnie AgentCategory

Zdarzenia:
- ticket.created – nowy ticket (po INSERT)
- ticket.assigned – przypisanie (po UPDATE.assigned_to_id)
- ticket.status_changed – zmiana statusu (po UPDATE.status)

Filtrowanie po stronie klienta:
- Agent: subskrybuje tickety z własnych kategorii (JOIN: Ticket → Subcategory → Category → AgentCategory)
- User: subskrybuje tylko tickety, gdzie created_by_id = session.user.id

Zasada anty-duplikacyjna: po assigned_to_id != null ticket znika z listy „do wzięcia” u innych agentów z tej kategorii.

### 🧪 Walidacje formularzy (Zod – biznesowe reguły MVP)
Hasło (zmiana przy 1. logowaniu): min. 8 znaków, min. 1 litera, 1 cyfra, 1 znak specjalny.

Ticket:
- categoryId – wymagane
- subcategoryId – wymagane, zależne od kategorii
- title – wymagane, min. 5 znaków
- description – wymagane, max. 300 znaków (licznik w UI)

### 🔒 Bezpieczeństwo
- NextAuth v5 (Credentials + JWT)
- Hashing haseł: bcryptjs
- Wymuszenie zmiany hasła: `force_password_change = true` dla kont startowych
- Separacja danych: zapytania filtrowane po roli i kontekście (user: created_by_id; agent: kategorie)
- Klucze: `SUPABASE_SERVICE_ROLE_KEY` tylko po stronie serwera
- Audit Logs: tabela `audit_logs` z RLS – SELECT dostępny wyłącznie dla `ADMIN`

### 🧰 Server Actions (MVP – przykładowe operacje)
completeAi(formData) – analiza opisu → sugestie AI (kategoria, tytuł itp.)

createTicket(formData) – walidacja Zod → insert Ticket

assignTicket(ticketId) – kontrola dostępu → update assigned_to_id & status=IN_PROGRESS

closeTicket(ticketId) – tylko właściciel przypisania → status=CLOSED

changePassword(old, next) – weryfikacja hasła → update user + force_password_change=false

Uwaga: w MVP preferujemy Server Actions i route handlers zamiast `pages/api`.

### 🤖 AI & Machine Learning
#### AI Suggestions (Ticket Classification)
- Serwis: OpenRouter (`openrouter.ai`)
- Model domyślny: `openai/gpt-4o-mini`
- Zwracany JSON: `categoryId`, `subcategoryId`, `summary`, `suggestedSteps`
- Implementacja: `/app/actions/ai/complete.ts` + serwis w `/app/lib/services`
- Bezpieczeństwo: `OPENROUTER_API_KEY` tylko na serwerze

### 🧪 Testing & Quality Assurance

#### Poziomy testowania
- Unit Tests – walidatory Zod, utils, business logic
- Integration Tests – API routes, Server Actions, database interactions (supabase-js)
- Component Tests – React components (Testing Library)
- E2E Tests – Playwright (flows RSC + UI)

#### Konfiguracja (skrót)
- Vitest 3.x, coverage v8, env jsdom/happy-dom
- Playwright 1.56, projekty: Chromium/Firefox, trace on-first-retry

### 🧱 Decyzje architektoniczne (skrót)
App Router + RSC + Server Actions.

supabase-js + SQL migrations (brak ORM) – prostota, mniejszy narzut, zgodność z RLS.

Supabase Realtime > custom WS – mniej utrzymania.

NextAuth v5 > Clerk/Auth0 – kontrola nad schematem i koszty.

### 🧯 Błędy i logowanie
UI: spójne stany loading/empty/error, toasty dla akcji.

Serwer: logi błędów (console/Vercel), maskowanie danych wrażliwych.

Fallback realtime: opcjonalny polling (np. co 5 s) w widokach agent/user.

### 🚀 Build & Deploy
Dev: `npm run dev`

Migracje: użyj helpera, aby wyświetlić SQL i wkleić w Supabase SQL Editor:
```bash
npm run migrate:audit-logs   # pojedyncza migracja
npm run migrate -- all       # pokaż wszystkie migracje
```

Seed: uruchom skrypty seed (supabase-js + SERVICE_ROLE_KEY):
```bash
npm run seed:users
npm run seed:categories
npm run seed-navireo
```

Monitoring (proste): Vercel analytics + logi edge/functions.

### ✅ Setup Checklist
- SUPABASE: projekt + URL, ANON_KEY, SERVICE_ROLE_KEY
- NEXTAUTH_SECRET wygenerowany (openssl rand -base64 32)
- OPENROUTER_API_KEY dodany (dla AI suggestions)
- `.env.local` uzupełnione
- `npm install` ukończone
- migracje wykonane w Supabase (SQL Editor)
- skrypty seed uruchomione
- `npm run dev` startuje bez błędów
- login testowy działa, wymuszenie zmiany hasła działa
- testy jednostkowe/integracyjne/E2E przechodzą lokalnie

### 📝 Notatki developerskie (MVP)
- Kategorie i podkategorie są stałe w MVP (bez UI do tworzenia/usuń); admin może edytować nazwy/opisy (wdrożone).
- Agent widzi tylko kategorie, do których ma dostęp (JOIN po AgentCategory).
- Przejęty ticket natychmiast znika z listy innych agentów tej kategorii (real-time).
- Opis ticketu max 300 znaków, tytuł min. 5 znaków (walidacja Zod).
- Reset hasła: wymuszenie zmiany hasła przy pierwszym logowaniu (`force_password_change`).