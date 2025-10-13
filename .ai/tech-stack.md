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
```

Bezpieczeństwo: SERVICE_ROLE_KEY tylko po stronie serwera; nigdy w przeglądarce.

### 📁 Folder Structure
tickflow/
```text
├── .ai/
│   ├── prd.md
│   └── tech-stack.md (ten dokument)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/user/{tickets,new-ticket}/
│   │   ├── (dashboard)/agent/{tickets,my-tickets}/
│   │   ├── api/auth/[...nextauth]/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/{ui,tickets,auth}/
│   ├── lib/{auth.ts,db.ts,supabase.ts,validators/}
│   └── hooks/useRealtimeTickets.ts
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

createTicket(formData) – walidacja Zod → insert Ticket

assignTicket(ticketId) – kontrola dostępu do kategorii → update assignedToId & status=IN_PROGRESS

closeTicket(ticketId) – tylko właściciel przypisania → status=CLOSED

changePassword(old, next) – weryfikacja hasła → update user + passwordResetRequired=false

Uwaga: w MVP preferujemy Server Actions zamiast klasycznych API routes.

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

 .env.local uzupełnione

 npm install ukończone

 npx prisma db push + npx prisma db seed

 npm run dev startuje bez błędów

 Login testowy: user@firma.pl / Start!125

 Po zalogowaniu wymuszona zmiana hasła działa

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