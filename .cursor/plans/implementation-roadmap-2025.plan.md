# 🗺️ TickFlow - Plan Wdrażania Zmian (2025)

**Dokument:** Implementation Roadmap
**Data:** Październik 2025
**Status:** Draft - Planowanie
**Właściciel:** Tim Developerski

---

## 📊 Executive Summary

Plan zawiera strategiczną mapę wdrażania nowych funkcjonalności dla TickFlow na podstawie:
- **PRD** - wymagania biznesowe (role: USER, AGENT, ADMIN)
- **Tech-Stack** - architektura techniczna (Next.js 15, Supabase, Prisma)
- **Notes** - priorytetyzowane grupy zadań (GRUPA 1-5)

**Cel:** Stworzenie pełnofunkcyjnego panelu administracyjnego, usprawnienie zarządzania ticketami, implementacja systemu logowania i optymalizacja UX/UI.

---

## 🎯 Strategia Implementacji

### Fazy Projektu

```
FAZA 1: Foundation (Tygodnie 1-2)
├─ Grupa 2: Bug Fixes & Core Ticket Features
├─ Przygotowanie bazy danych
└─ Migracje Supabase

FAZA 2: Admin Panel (Tygodnie 3-5)
├─ Grupa 1: Administrator Management Dashboard
├─ Zarządzanie użytkownikami
├─ Zarządzanie kategoriami
└─ Zarządzanie agentami

FAZA 3: Enhanced Features (Tygodnie 6-7)
├─ Grupa 3: AI Suggestions Improvements
├─ Grupa 4: Logging & Audit System
└─ Testowanie integracyjne

FAZA 4: Polishing (Tydzień 8)
├─ Grupa 5: UX/UI Improvements
├─ Bug fixes
└─ Performance optimization

FAZA 5: Release & Deployment (Tydzień 9)
├─ Finalne testy E2E
├─ Security audit
└─ Deployment na produkcję
```

---

## 📋 GRUPA 1: Panel Administratora - Zarządzanie Danymi

**Priorytet:** 🔴 WYSOKI | **Złożoność:** 🟠 Średnia-Wysoka | **Estymacja:** 3-4 tygodnie

### 1.1 Zarządzanie Kategoriami i Podkategoriami

#### Zadania:
- [ ] **T1.1.1** - Stwórz widok/dashboard: Admin > Categories Management
  - Tabela kategorii z kolumnami: ID, Name, Description, Subcategories Count, Actions
  - Tabelę podkategorii z kolumnami: ID, Category, Name, Description, AssignedAgents
  - Możliwość edycji opisu kategorii i podkategorii in-place
  
#### Spec Techniczny:
```typescript
// Endpoint do aktualizacji opisu kategorii
POST /api/admin/categories/:id
Body: { description: string, aiDescription?: string }

// Endpoint do pobrania kategorii z agentami
GET /api/admin/categories?includeAgents=true

// Endpoint AI description - pole do AI context
GET /api/admin/categories/:id/ai-context
```

#### Implementacja:
- **Frontend Component:** `app/components/admin/CategoriesManagement.tsx`
- **API Route:** `app/api/admin/categories/[id].ts`
- **Server Action:** `app/actions/admin/updateCategory.ts`
- **DB Migration:** Nowe kolumny w tabeli categories (aiDescription, aiContext)

#### Kryteria Akceptacji:
- ✅ Admin widzi tabelę wszystkich kategorii
- ✅ Admin może edytować opis kategorii
- ✅ Admin widzi, którzy agenci obsługują daną kategorię
- ✅ Widoczne jest AI description dla każdej kategorii
- ✅ Zmiany są natychmiast widoczne (real-time)

---

### 1.2 Zarządzanie Użytkownikami i Agentami

#### Zadania:
- [ ] **T1.2.1** - Stwórz widok: Admin > Users Management
  - Tabela użytkowników: ID, Email, Name, Role, CreatedAt, Actions
  - Filtrowanie po roli (USER, AGENT, ADMIN)
  - Sortowanie po nazwie, dacie utworzenia
  
- [ ] **T1.2.2** - Stwórz widok: Admin > Agents Management
  - Tabela agentów: ID, Email, Name, Assigned Categories, Status, Actions
  - Możliwość przypisywania kategorii agentom (multi-select)
  - Wskaźnik ilości ticketów przypisanych

#### Spec Techniczny:
```typescript
// Endpoint do pobrania użytkowników
GET /api/admin/users?role=AGENT&sortBy=name&order=asc

// Endpoint do zmiany roli użytkownika
PATCH /api/admin/users/:id
Body: { role: "AGENT" | "USER" | "ADMIN" }

// Endpoint do zarządzania kategoriami agenta
PATCH /api/admin/agents/:id/categories
Body: { categoryIds: string[] }

// Endpoint do wymuszenia restartu hasła
POST /api/admin/users/:id/force-password-reset
Body: { forceReset: boolean }
```

#### Implementacja:
- **Frontend:** `app/components/admin/UsersManagement.tsx`, `app/components/admin/AgentsManagement.tsx`
- **API Routes:** `app/api/admin/users/[id].ts`, `app/api/admin/agents/[id].ts`
- **Server Actions:** `app/actions/admin/updateUser.ts`, `app/actions/admin/updateAgentCategories.ts`

#### Kryteria Akceptacji:
- ✅ Admin widzi listę wszystkich użytkowników
- ✅ Admin może zmieniać role użytkowników
- ✅ Admin może wymusić zmianę hasła dla użytkownika
- ✅ Admin widzi, które kategorie są przypisane agentom
- ✅ Admin może edytować przypisania kategorii

---

### 1.3 Tworzenie Nowych Użytkowników

#### Zadania:
- [ ] **T1.3.1** - Stwórz formularz: Admin > Create User
  - Pola: Email, Name, Role (AGENT/USER), Initial Password
  - Walidacja emaila (unikalność)
  - Generowanie tymczasowego hasła lub opcja własnego
  - Po utworzeniu: flag `passwordResetRequired = true`

#### Spec Techniczny:
```typescript
// Endpoint do utworzenia użytkownika
POST /api/admin/users
Body: {
  email: string,
  name: string,
  role: "AGENT" | "USER" | "ADMIN",
  password?: string,  // Jeśli nie podane - wygeneruje losowe
  categoryIds?: string[]  // Dla roli AGENT
}

Response: {
  id: string,
  email: string,
  temporaryPassword: string,
  passwordResetRequired: true
}
```

#### Implementacja:
- **Frontend:** `app/components/admin/CreateUserModal.tsx`
- **API Route:** `app/api/admin/users.ts` (POST)
- **Server Action:** `app/actions/admin/createUser.ts`
- **Validator:** Nowy schema w `app/lib/validators/adminUsers.ts`

#### Kryteria Akceptacji:
- ✅ Admin może tworzyć nowych użytkowników
- ✅ Nowy użytkownik ma flagę `passwordResetRequired = true`
- ✅ System generuje hasło tymczasowe (lub akceptuje podane)
- ✅ Email jest unikalny
- ✅ Dla agentów można przypisać kategorie przy tworzeniu

---

### 1.4 System Logów i Audytu

#### Zadania:
- [ ] **T1.4.1** - Stwórz tabelę Audit Logs w bazie
  - Kolumny: id, userId, action, resource, resourceId, changes, timestamp, ipAddress
  
- [ ] **T1.4.2** - Stwórz widok: Admin > Audit Logs
  - Tabela logów: User, Action, Resource, When, Details
  - Filtry: Po użytkowniku, typie akcji, dacie
  - Sortowanie po dacie (newest first)

#### Spec Techniczny:

```sql
-- Migration: 20251021_create_audit_logs.sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at TIMESTAMP DEFAULT now(),
  INDEX (user_id, created_at),
  INDEX (resource, created_at)
);
```

```typescript
// Endpoint do pobrania logów
GET /api/admin/audit-logs?userId=&action=&resource=&fromDate=&toDate=&limit=50&offset=0

// Server Action Helper - automatycznie logować akcje
async function logAuditEvent(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "FORCE_PASSWORD_RESET",
  resource: string,
  resourceId: string,
  changes?: object
): Promise<void>
```

#### Implementacja:
- **DB Migration:** `supabase/migrations/20251021_create_audit_logs.sql`
- **Prisma Model:** Dodaj `AuditLog` do `schema.prisma`
- **Frontend:** `app/components/admin/AuditLogsView.tsx`
- **API Route:** `app/api/admin/audit-logs.ts`
- **Utility:** `app/lib/services/auditLog.ts` - helper do logowania
- **Middleware:** Dodaj automatyczne logowanie kluczowych akcji

#### Kryteria Akceptacji:
- ✅ Wszystkie akcje admina są logowane
- ✅ Admin widzi tabelę logów z historią
- ✅ Dostęp do szczegółów zmian (before/after)
- ✅ Filtry działają poprawnie
- ✅ Logi nie mogą być usunięte przez admina (append-only)

---

## 📋 GRUPA 2: Zarządzanie Ticketami - Nowe Funkcje

**Priorytet:** 🔴 WYSOKI | **Złożoność:** 🟠 Średnia | **Estymacja:** 1-2 tygodnie

### 2.1 Przywracanie Ticketu (Reopen)

#### Zadania:
- [ ] **T2.1.1** - Dodaj akcję "Przywróć ticket"
  - Zmiana statusu: CLOSED → OPEN
  - Tylko admin i właściciel agenta mogą
  - Logowanie akcji

#### Spec Techniczny:
```typescript
// Endpoint
POST /api/tickets/:id/reopen
Response: { id, status: "OPEN", updatedAt }

// Server Action
async function reopenTicket(ticketId: string): Promise<Result<Ticket>>

// DB: Dodaj kolumnę reopenedCount lub reopenedAt
ALTER TABLE tickets ADD COLUMN reopened_count INT DEFAULT 0;
ALTER TABLE tickets ADD COLUMN reopened_at TIMESTAMP;
```

#### Implementacja:
- **API Route:** `app/api/tickets/[id]/reopen.ts`
- **Server Action:** `app/actions/tickets/reopenTicket.ts`
- **UI Component:** Dodaj button w `TicketDetailsDialog.tsx`
- **Validation:** Sprawdzenie uprawnień i statusu

#### Kryteria Akceptacji:
- ✅ Admin może przywrócić dowolny ticket
- ✅ Agent może przywrócić ticket przypisany do siebie
- ✅ Status zmienia się z CLOSED na OPEN
- ✅ Zmiana jest logowana
- ✅ Real-time update dla obserwujących ticket

---

### 2.2 Przekazanie Ticketu (Transfer)

#### Zadania:
- [ ] **T2.2.1** - Dodaj akcję "Przekaż ticket"
  - Zmiana `assignedToId` na innego agenta
  - Tylko admin i obecny agent mogą
  - Walidacja: nowy agent ma dostęp do kategorii ticketu

#### Spec Techniczny:
```typescript
// Endpoint
POST /api/tickets/:id/transfer
Body: { transferToId: string, comment?: string }
Response: { id, assignedToId, updatedAt, transferredFrom }

// Server Action
async function transferTicket(
  ticketId: string,
  transferToId: string,
  comment?: string
): Promise<Result<Ticket>>

// Validation:
// 1. Agent transferToId musi być przypisany do kategorii ticketu
// 2. Ticket musi być w statusie OPEN lub IN_PROGRESS
// 3. transferToId != currentAssignedToId
```

#### Implementacja:
- **API Route:** `app/api/tickets/[id]/transfer.ts`
- **Server Action:** `app/actions/tickets/transferTicket.ts`
- **UI Component:** Modal z dropdown do wyboru agenta
- **Real-time:** Update dla obu agentów

#### Kryteria Akceptacji:
- ✅ Agent może przekazać ticket innemu agentowi z tej samej kategorii
- ✅ Admin może przekazać ticket dowolnemu agentowi
- ✅ System waliduje dostęp agenta do kategorii
- ✅ Historia transferów jest rejestrowana
- ✅ Real-time notyfikacja dla obu stron

---

### 2.3 Fix: Admin Nie Może Przyjąć Zgłoszenia

#### Zadania:
- [ ] **T2.3.1** - Debug i napraw: Admin powinien móc przypisać sobie ticket

#### Spec Techniczny:
```typescript
// Punkt problemu jest w walidacji uprawnień
// app/api/tickets/[id]/assign.ts - sprawdzić logikę

// Powinno być:
if (user.role === "ADMIN") {
  // Admin ma dostęp do wszystkich ticketów i kategorii
} else if (user.role === "AGENT") {
  // Sprawdź czy agent ma dostęp do tej kategorii
}
```

#### Implementacja:
- **Debugging:** Przejrzyj `app/api/tickets/[id]/assign.ts`
- **Fix:** Aktualizuj walidację roli
- **Tests:** Dodaj test case dla admina
- **Audit:** Zaloguj akcję

#### Kryteria Akceptacji:
- ✅ Admin może przypisać sobie ticket
- ✅ Agent może przypisać sobie ticket (jeśli ma dostęp do kategorii)
- ✅ Brak błędów 403/401

---

## 📋 GRUPA 3: Usprawnienia AI Suggestions

**Priorytet:** 🟡 ŚREDNI | **Złożoność:** 🟢 Niska-Średnia | **Estymacja:** 1 tydzień

### 3.1 Ulepszenie Zawartości Sugestii AI

#### Zadania:
- [ ] **T3.1.1** - Modyfikacja promptu AI
  - Zwracaj tylko propozycje do samodzielnego rozwiązania przez użytkownika
  - Jeśli nic nie ma - nie wymyślaj na siłę
  - Dodaj pole `selfServiceSteps` z konkretnymi krokami

#### Spec Techniczny:
```typescript
// app/lib/services/openrouter/index.ts - aktualizuj prompt

const SYSTEM_PROMPT = `
  You are a helpful IT support classifier. Analyze the user's problem and:
  1. Suggest the most relevant category and subcategory
  2. Provide ONLY actionable self-service steps the user can try
  3. If no self-service solution exists, set selfServiceSteps to empty array
  4. Be honest - don't invent solutions if you don't have any

  Response format:
  {
    "categoryId": "...",
    "subcategoryId": "...",
    "summary": "...",
    "selfServiceSteps": ["Step 1", "Step 2"],
    "requiresSupport": boolean
  }
`

// Response type
interface AiSuggestion {
  categoryId: string
  subcategoryId: string
  summary: string
  selfServiceSteps: string[]
  requiresSupport: boolean
}
```

#### Implementacja:
- **Update:** `app/lib/services/openrouter/index.ts`
- **Frontend:** Aktualizuj wyświetlanie sugestii
- **Validator:** Nowy Zod schema dla nowego formatu

#### Kryteria Akceptacji:
- ✅ AI zwraca realistyczne kroki do samodzielnego rozwiązania
- ✅ Nie ma zmyślonych rozwiązań
- ✅ Pole `requiresSupport` jest dokładne
- ✅ Format odpowiedzi jest konsystentny

---

### 3.2 Logowanie Sugestii AI

#### Zadania:
- [ ] **T3.2.1** - Dodaj logowanie każdego użycia AI suggestions
  - Co: Zawartość textarea, sugestia zwrócona, czy użytkownik ją zastosował
  - Gdzie: Tabela `ai_suggestions_log`
  - Kiedy: Log przed wysłaniem request do OpenRouter

#### Spec Techniczny:
```sql
-- Migration: 20251021_create_ai_suggestions_log.sql
CREATE TABLE ai_suggestions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  ticket_id uuid REFERENCES tickets(id),
  user_input text NOT NULL,
  ai_suggestion jsonb,
  was_applied boolean DEFAULT NULL,
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  INDEX (user_id, created_at),
  INDEX (was_applied)
);
```

```typescript
// Helper function
async function logAiSuggestion(
  userId: string,
  userInput: string,
  suggestion: AiSuggestion,
  ticketId?: string
): Promise<void>

// Endpoint
POST /api/admin/ai-suggestions-log
```

#### Implementacja:
- **DB Migration:** `supabase/migrations/20251021_create_ai_suggestions_log.sql`
- **Prisma Model:** Dodaj `AiSuggestionLog`
- **Action:** Aktualizuj `app/actions/ai/complete.ts` aby logował
- **Frontend:** Dodaj tracking czy użytkownik zastosował sugestię
- **Admin View:** `app/components/admin/AiSuggestionsLog.tsx`

#### Kryteria Akceptacji:
- ✅ Każda sugestia AI jest logowana
- ✅ Log zawiera: input, output, user, timestamp
- ✅ Można zobaczyć, czy sugestja została zastosowana
- ✅ Admin ma widok statystyk

---

## 📋 GRUPA 4: System Logowania i Audytu

**Priorytet:** 🟡 ŚREDNI | **Złożoność:** 🟠 Średnia | **Estymacja:** 1-2 tygodnie

### 4.1 Logowanie Akcji Logowania (Login Audit)

#### Zadania:
- [ ] **T4.1.1** - Dodaj logowanie logowań i prób logowania
  - Tabelka: `login_logs`
  - Kolumny: userId, email, success, ipAddress, userAgent, timestamp
  - Logowanie zarówno sukcesów jak i błędów

#### Spec Techniczny:
```sql
-- Migration: 20251021_create_login_logs.sql
CREATE TABLE login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  email varchar(255) NOT NULL,
  success boolean NOT NULL,
  failure_reason varchar(255),
  ip_address inet,
  user_agent text,
  created_at TIMESTAMP DEFAULT now(),
  INDEX (user_id, created_at),
  INDEX (success, created_at)
);
```

```typescript
// Update: app/lib/auth.ts lub auth middleware
async function logLoginAttempt(
  email: string,
  success: boolean,
  failureReason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void>
```

#### Implementacja:
- **DB Migration:** `supabase/migrations/20251021_create_login_logs.sql`
- **Prisma Model:** Dodaj `LoginLog`
- **Auth Handler:** Aktualizuj `app/api/auth/[...nextauth]/route.ts`
- **Middleware:** Dodaj logowanie w auth middleware

#### Kryteria Akceptacji:
- ✅ Logowania są rejestrowane
- ✅ Błędy logowania też są logowane
- ✅ IP i User-Agent są zachowywane
- ✅ Admin może przeglądać historię logowań

---

### 4.2 Admin Audit Dashboard

#### Zadania:
- [ ] **T4.2.1** - Połącz wszystkie logi w jeden admin dashboard
  - Widok: Admin > System Logs
  - Zakładki: Audit Logs, Login Logs, AI Suggestions Log
  - Filtry, sortowanie, eksport

#### Spec Techniczny:
```typescript
// Unified endpoint
GET /api/admin/system-logs?type=audit|login|ai&fromDate=&toDate=&limit=50

// Admin component
app/components/admin/SystemLogsView.tsx
```

#### Implementacja:
- **Frontend:** Unified dashboard z zakładkami
- **API:** Route do łączenia logów
- **Export:** Opcja CSV/JSON

#### Kryteria Akceptacji:
- ✅ Wszystkie logi w jednym miejscu
- ✅ Filtry działają
- ✅ Możliwość eksportu
- ✅ Performance OK dla dużych zbiorów

---

## 📋 GRUPA 5: UX/UI i Poprawki Techniczne

**Priorytet:** 🟢 NISKI-ŚREDNI | **Złożoność:** 🟢 Niska | **Estymacja:** 1 tydzień

### 5.1 Mobile Scroll Fix - AI Suggestions

#### Zadania:
- [ ] **T5.1.1** - Po kliknięciu "Zastosuj sugestie" scrolluj do kategorii
  - Na urządzeniach mobilnych
  - Smooth scroll
  - Focus na kategoriach

#### Implementacja:
```typescript
// app/components/tickets/CreateTicketForm.tsx
const applySuggestions = async (suggestion: AiSuggestion) => {
  // ... apply logic ...
  
  // Smooth scroll to category select
  if (window.innerWidth < 768) {
    setTimeout(() => {
      const categorySelect = document.getElementById('categorySelect')
      categorySelect?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }
}
```

#### Kryteria Akceptacji:
- ✅ Na mobile scroll działa
- ✅ Kategorie są widoczne
- ✅ UX jest smooth

---

### 5.2 Zmiana Nazwy Użytkownika

#### Zadania:
- [ ] **T5.2.1** - Dodaj możliwość zmiany nazwy użytkownika
  - Widok: User Account Settings
  - Pole: Name
  - Walidacja i update

#### Spec Techniczny:
```typescript
// Endpoint
PATCH /api/users/profile
Body: { name: string }

// Server Action
async function updateUserName(newName: string): Promise<Result<User>>
```

#### Implementacja:
- **Frontend:** Aktualizuj `app/components/account/AccountPageClient.tsx`
- **API:** `app/api/users/profile.ts` (PATCH)
- **Server Action:** `app/actions/users/updateProfile.ts`

#### Kryteria Akceptacji:
- ✅ Użytkownik może zmienić imię
- ✅ Zmiana widoczna wszędzie
- ✅ Real-time update

---

### 5.3 Konfiguracja: Wyświetlanie Użytkowników

#### Zadania:
- [ ] **T5.3.1** - Ukryj user management na produkcji
  - Warunkiem: Środowisko = development
  - Na prod: admin tabele usunięte lub disabled

#### Implementacja:
```typescript
// app/components/admin/AdminNavigation.tsx
const canAccessUserManagement = process.env.NODE_ENV === 'development'

// Lub przez env variable
const ENABLE_USER_MANAGEMENT = process.env.NEXT_PUBLIC_ADMIN_USER_MANAGEMENT === 'true'
```

#### Kryteria Akceptacji:
- ✅ Na DEV: pełny dostęp
- ✅ Na PROD: ukryte menu

---

### 5.4 Analiza Biznesowa: Status Resolved vs Closed

#### Zadania:
- [ ] **T5.4.1** - Sesja planistyczna: czy oba statuy mają sens?
  
  **Propozycja:**
  - `OPEN` - ticket nowy, bez przypisania
  - `IN_PROGRESS` - ticket przypisany, agent pracuje
  - `CLOSED` - ticket zamknięty, koniec
  
  **Pytanie:** Czy potrzebujemy `RESOLVED` jako osobny status?
  
  **Decyzja:** ❌ Nie. Usunąć `RESOLVED`, mieć tylko 3 statuy.

#### Dokumentacja:
- [ ] Zaktualizuj schema.prisma
- [ ] Migracja: zmień istniejące tickety
- [ ] Update frontend

---

### 5.5 Weryfikacja: Agenci Przypisani do Kategorii

#### Zadania:
- [ ] **T5.5.1** - Weryfikuj i udokumentuj: Agenci ↔ Kategorie
  
  **Status:** ✅ Potwierdzono - model jest poprawny
  - Agenci przypisani do **Kategorii**, nie Podkategorii
  - Relacja: M2M przez tabelę `agent_categories`
  - Podkategorie dziedziczą dostęp przez Kategorię

#### Dokumentacja:
- [ ] Zaktualizuj README z tego samego powodu

---

## 🏗️ Plany Implementacyjne - Harmonogram

### Timeline (9 Tygodni)

```
┌─ TYDZIEŃ 1-2: FAZA 1 - Foundation
│  ├─ T2.3.1: Fix - Admin bug
│  ├─ T2.1.1: Reopen Ticket
│  ├─ T2.2.1: Transfer Ticket
│  └─ DB migrations & tests
│
├─ TYDZIEŃ 3-5: FAZA 2 - Admin Panel
│  ├─ T1.1.1: Categories Management
│  ├─ T1.2.1: Users Management
│  ├─ T1.2.2: Agents Management
│  ├─ T1.3.1: Create User
│  ├─ T1.4.1: Audit Logs Table
│  ├─ T1.4.2: Audit Logs View
│  └─ Integration testing
│
├─ TYDZIEŃ 6-7: FAZA 3 - Enhanced Features
│  ├─ T3.1.1: AI Improvements
│  ├─ T3.2.1: AI Logging
│  ├─ T4.1.1: Login Audit
│  ├─ T4.2.1: System Logs Dashboard
│  └─ E2E testing
│
├─ TYDZIEŃ 8: FAZA 4 - Polishing
│  ├─ T5.1.1: Mobile Scroll
│  ├─ T5.2.1: Change Username
│  ├─ T5.3.1: Dev-only User Mgmt
│  ├─ T5.4.1: Status Review
│  ├─ T5.5.1: Documentation
│  └─ Bug fixes
│
└─ TYDZIEŃ 9: FAZA 5 - Release
   ├─ Final E2E tests
   ├─ Security audit
   └─ Production deployment
```

---

## 📦 Zmiany w Bazie Danych

### Nowe Tabele (Migrations)

```sql
-- 1. Audit Logs
supabase/migrations/20251021_create_audit_logs.sql

-- 2. AI Suggestions Log  
supabase/migrations/20251021_create_ai_suggestions_log.sql

-- 3. Login Logs
supabase/migrations/20251021_create_login_logs.sql
```

### Zmiany w Istniejących Tabelach

```sql
-- Categories: dodaj AI fields
ALTER TABLE categories 
  ADD COLUMN ai_description TEXT,
  ADD COLUMN ai_context JSONB;

-- Users: upewnij się że ma passwordResetRequired
-- (powinno być już, ale sprawdzić)

-- Tickets: dodaj tracking reopenów i transferów
ALTER TABLE tickets 
  ADD COLUMN reopened_count INT DEFAULT 0,
  ADD COLUMN reopened_at TIMESTAMP,
  ADD COLUMN transferred_from_id UUID REFERENCES users(id);
```

### Prisma Schema Updates

```prisma
// Dodaj nowe modele
model AuditLog { ... }
model LoginLog { ... }
model AiSuggestionLog { ... }

// Update User model
model User {
  // ... existing ...
  auditLogs AuditLog[]
  loginLogs LoginLog[]
}

// Update Category model
model Category {
  // ... existing ...
  aiDescription String?
  aiContext Json?
}

// Update Ticket model
model Ticket {
  // ... existing ...
  reopenedCount Int @default(0)
  reopenedAt DateTime?
  transferredFrom User? @relation("TransferredTickets", fields: [transferredFromId], references: [id])
  transferredFromId String?
}
```

---

## 🔐 Bezpieczeństwo

### Access Control (RBAC)

```typescript
// Admin Routes - all require ADMIN role
app/api/admin/*

// Middleware check
if (user.role !== "ADMIN") {
  return new Response("Unauthorized", { status: 403 })
}

// Audit logging for sensitive operations
- User creation/deletion/role change
- Category modifications
- Password resets
- Login attempts
```

### Data Protection

- ✅ Service Role Key tylko po stronie serwera
- ✅ RLS policies w Supabase dla audit_logs
- ✅ IP logging dla login attempts
- ✅ Password hashing (bcrypt)
- ✅ No sensitive data in logs

---

## 🧪 Testowanie

### Unit Tests (Vitest)
- [ ] Validators dla nowych schematów
- [ ] Helpers dla audit logging
- [ ] AI suggestion parsing

### Integration Tests
- [ ] Admin API routes
- [ ] User creation flow
- [ ] Ticket transfer logic
- [ ] Audit log recording

### E2E Tests (Playwright)
- [ ] Admin login → Categories Management
- [ ] Create new user → Force password reset
- [ ] Transfer ticket → Real-time update
- [ ] Audit logs filtering

### Coverage Target
- ✅ ≥80% dla nowych komponentów
- ✅ Regresja testów: Zero failures

---

## 📊 Metryki Sukcesu

### Funkcjonalność
- ✅ Wszystkie 5 grup zadań ukończone
- ✅ Zero P1 bugów
- ✅ Zero regresji

### Wydajność
- ✅ Admin tables render <1s
- ✅ Audit logs query <500ms
- ✅ Real-time updates <2s

### Bezpieczeństwo
- ✅ Wszystkie akcje logowane
- ✅ RBAC enforced
- ✅ Brak data leaks

### UX
- ✅ Mobile responsiveness OK
- ✅ Accessibility score >90
- ✅ No console errors

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Testy lokalne przechodzą
- [ ] Code review zakończony
- [ ] Migrations tested na staging
- [ ] Env variables skonfigurowane
- [ ] Admin accounts created
- [ ] Backups wykonane

### Deployment Steps (na Vercel)

1. Push na branch `main`
2. Vercel CI runs tests
3. Manual approval
4. Deploy to production
5. Run Prisma migrate
6. Verify audit logs working
7. Smoke tests

### Rollback Plan

- Jeśli błędy: git revert, re-deploy
- DB rollback: Supabase backup restore
- Manual data fixes na prodzie

---

## 📝 Dokumentacja do Aktualizacji

- [ ] README.md - dodaj Admin Panel section
- [ ] .ai/tech-stack.md - dodaj info o audit system
- [ ] CONTRIBUTING.md - dodaj guidelines dla admin features
- [ ] .cursor/rules/* - aktualizuj rules dla admin components

---

## 🔗 Zależności i Ryzyko

### Zależności
- Migrations muszą być uruchomione w kolejności
- Tests muszą przechodzić przed deploy
- Supabase musi być dostępny (real-time)

### Ryzyka Mitigation
| Ryzyko | Mitigation |
|--------|-----------|
| Performance admin tables | Pagination, indexes, caching |
| Real-time z dużo logów | Archiving old logs, filtering |
| Auth context dla admina | RLS policies, middleware check |
| Data consistency | Transactions, validation |

---

## ✅ Kryteria Gotowości (Definition of Done)

Każde zadanie musi spełniać:

- ✅ Code review zatwierdzony
- ✅ Testy (unit + E2E) przechodzą
- ✅ Zero console warnings/errors
- ✅ Accessibility OK (a11y)
- ✅ Mobile responsive
- ✅ Dokumentacja zaktualizowana
- ✅ Commit message jasny i informatywny
- ✅ PR description zawiera context

---

## 📞 Kontakt & Eskalacja

| Kwestia | Owner |
|---------|-------|
| Architecture decisions | Tech Lead |
| Business rules | Product Owner |
| DB migrations | DevOps |
| Deployment blockers | Team Lead |

---

**Dokument Zaktualizowany:** 2025-10-21
**Wersja:** 1.0 - Initial Draft
**Status:** ⏳ Ready for Review
