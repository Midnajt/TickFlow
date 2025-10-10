# 📋 Plan Implementacji Endpointów Ticketów - TickFlow MVP

**Projekt:** TickFlow - System zgłaszania ticketów IT  
**Wersja:** MVP 1.0  
**Data utworzenia:** 10 października 2025

---

## 🎯 Cele
1. Utworzenie endpointów API do obsługi ticketów (CRUD)
2. Implementacja bezpieczeństwa opartego na rolach (USER/AGENT)
3. Dodanie seed data dla kategorii, podkategorii i przypisań agentów
4. Walidacja danych za pomocą Zod

---

## 📦 **Faza 1: Seed Data (Wypełnienie Bazy Danych)**

### 1.1 Skrypt: `scripts/seed-categories.ts`
**Cel:** Wypełnienie tabel `categories`, `subcategories`, `agent_categories`

**Dane do utworzenia:**
```typescript
Categories (4):
├── Hardware (ID: uuid1)
│   ├── Komputer
│   ├── Drukarka
│   └── Monitor
├── Software (ID: uuid2)
│   ├── Instalacja oprogramowania
│   ├── Aktualizacja systemu
│   └── Licencje
├── Sieć (ID: uuid3)
│   ├── Problem z internetem
│   ├── VPN
│   └── WiFi
└── Konta i dostępy (ID: uuid4)
    ├── Reset hasła
    ├── Nowe konto
    └── Uprawnienia
```

**Agent Assignments:**
- `admin@tickflow.com` (AGENT) → Wszystkie kategorie (Hardware, Software, Sieć, Konta)
- `agent@tickflow.com` (AGENT) → Hardware, Software

**Komenda uruchomienia:**
```bash
npm run seed:categories
```

---

## 🛠️ **Faza 2: Walidatory Zod**

### 2.1 Plik: `app/lib/validators/tickets.ts`

**Schematy do utworzenia:**

```typescript
// CreateTicketSchema
- title: string (min 3, max 200)
- description: string (min 10, max 2000)
- subcategoryId: uuid

// UpdateTicketStatusSchema  
- status: enum [OPEN, IN_PROGRESS, RESOLVED, CLOSED]

// GetTicketsQuerySchema
- status?: enum
- assignedToMe?: boolean
- page?: number (min 1, default 1)
- limit?: number (min 1, max 100, default 20)
- sortBy?: string (default "createdAt")
- sortOrder?: enum [asc, desc] (default "desc")
```

### 2.2 Plik: `app/lib/validators/categories.ts`

```typescript
// GetCategoriesQuerySchema
- includeSubcategories?: boolean (default true)
```

---

## 🔒 **Faza 3: Service Layer (Logika Biznesowa)**

### 3.1 Plik: `app/lib/services/tickets.ts`

**Klasa:** `TicketService`

**Metody:**

#### a) `createTicket(userId: string, command: CreateTicketCommand): Promise<TicketDTO>`
- Weryfikacja roli USER
- Sprawdzenie czy subcategory istnieje
- Utworzenie ticketu z `status: OPEN`
- `created_by_id = userId`
- `assigned_to_id = null`
- Zwrócenie pełnego DTO z join'ami

#### b) `getTickets(userId: string, userRole: UserRole, params: GetTicketsParams): Promise<TicketsListDTO>`
- **USER:** Tylko swoje tickety (`created_by_id = userId`)
- **AGENT:** Tickety z przypisanych kategorii (przez `agent_categories`)
- Filtrowanie po `status`, `assignedToMe`
- Paginacja (page, limit)
- Sortowanie
- Join: subcategory → category, users (creator, assignee)

#### c) `getTicketById(userId: string, userRole: UserRole, ticketId: string): Promise<TicketDTO>`
- Sprawdzenie uprawnień (RLS automatycznie filtruje)
- Pełne dane ticketu z relacjami

#### d) `assignTicket(agentId: string, ticketId: string): Promise<TicketAssignmentDTO>`
- Weryfikacja roli AGENT
- Sprawdzenie czy agent ma dostęp do kategorii ticketu
- Przypisanie: `assigned_to_id = agentId`
- Zmiana statusu na `IN_PROGRESS`
- Aktualizacja `updated_at`

#### e) `updateTicketStatus(agentId: string, ticketId: string, status: TicketStatus): Promise<TicketStatusUpdateDTO>`
- Weryfikacja roli AGENT
- Sprawdzenie uprawnień do ticketu
- Aktualizacja statusu
- Aktualizacja `updated_at`

### 3.2 Plik: `app/lib/services/categories.ts`

**Klasa:** `CategoryService`

**Metody:**

#### a) `getCategories(includeSubcategories: boolean): Promise<CategoriesListDTO>`
- Pobranie wszystkich kategorii
- Opcjonalnie z subcategories (LEFT JOIN)

#### b) `getCategoryById(categoryId: string, includeSubcategories: boolean): Promise<CategoryDTO>`
- Jedna kategoria z opcjonalnymi podkategoriami

### 3.3 Plik: `app/lib/services/agent-categories.ts`

**Klasa:** `AgentCategoryService`

**Metody:**

#### a) `getAgentCategories(agentId: string): Promise<GetAgentCategoriesResponseDTO>`
- Pobranie kategorii przypisanych do agenta
- Join z `categories`

#### b) `getAgentsByCategory(categoryId: string): Promise<GetAgentsByCategoryResponseDTO>`
- Lista agentów dla danej kategorii
- Join `agent_categories` → `users`

---

## 🌐 **Faza 4: API Routes (Next.js App Router)**

### 4.1 `app/api/tickets/route.ts`

#### **GET** `/api/tickets`
- Query params: status, assignedToMe, page, limit, sortBy, sortOrder
- Autentykacja: Required (JWT)
- Walidacja: GetTicketsQuerySchema
- Service: `TicketService.getTickets()`
- Response: `TicketsListDTO`

#### **POST** `/api/tickets`
- Body: `CreateTicketCommand`
- Autentykacja: Required (USER role)
- Walidacja: CreateTicketSchema
- Service: `TicketService.createTicket()`
- Response: `TicketDTO` (201)

### 4.2 `app/api/tickets/[ticketId]/route.ts`

#### **GET** `/api/tickets/:ticketId`
- Autentykacja: Required
- Service: `TicketService.getTicketById()`
- Response: `TicketDTO`
- Error: 404 jeśli brak uprawnień lub nie istnieje

### 4.3 `app/api/tickets/[ticketId]/assign/route.ts`

#### **POST** `/api/tickets/:ticketId/assign`
- Body: `AssignTicketCommand` (ticketId w path)
- Autentykacja: Required (AGENT role)
- Service: `TicketService.assignTicket()`
- Response: `TicketAssignmentDTO`

### 4.4 `app/api/tickets/[ticketId]/status/route.ts`

#### **PATCH** `/api/tickets/:ticketId/status`
- Body: `{ status: TicketStatus }`
- Autentykacja: Required (AGENT role)
- Walidacja: UpdateTicketStatusSchema
- Service: `TicketService.updateTicketStatus()`
- Response: `TicketStatusUpdateDTO`

### 4.5 `app/api/categories/route.ts`

#### **GET** `/api/categories`
- Query: `includeSubcategories?: boolean`
- Autentykacja: Required
- Service: `CategoryService.getCategories()`
- Response: `CategoriesListDTO`

### 4.6 `app/api/categories/[categoryId]/route.ts`

#### **GET** `/api/categories/:categoryId`
- Query: `includeSubcategories?: boolean`
- Service: `CategoryService.getCategoryById()`
- Response: `CategoryDTO`

### 4.7 `app/api/agent-categories/me/route.ts`

#### **GET** `/api/agent-categories/me`
- Autentykacja: Required (AGENT role)
- Service: `AgentCategoryService.getAgentCategories()`
- Response: `GetAgentCategoriesResponseDTO`

### 4.8 `app/api/agent-categories/[categoryId]/agents/route.ts`

#### **GET** `/api/agent-categories/:categoryId/agents`
- Autentykacja: Required (AGENT role)
- Service: `AgentCategoryService.getAgentsByCategory()`
- Response: `GetAgentsByCategoryResponseDTO`

---

## 🔐 **Faza 5: Middleware i Utilities**

### 5.1 `app/lib/utils/auth.ts` (rozszerzenie istniejącego)

**Dodać funkcje:**

```typescript
// Pobranie userId i role z tokenu
async function getAuthenticatedUser(request: Request): Promise<UserSessionDTO>

// Sprawdzenie czy użytkownik ma rolę
function requireRole(user: UserSessionDTO, role: UserRole): void

// Sprawdzenie czy agent ma dostęp do kategorii
async function checkAgentCategoryAccess(agentId: string, categoryId: string): Promise<boolean>
```

### 5.2 `app/lib/utils/api-response.ts` (nowy)

**Standardowe odpowiedzi API:**

```typescript
function successResponse<T>(data: T, status = 200)
function errorResponse(message: string, code: string, status: number)
function validationErrorResponse(errors: ZodError)
```

### 5.3 `app/lib/utils/supabase-auth.ts` (nowy)

**Helper do ustawiania auth context w Supabase:**

```typescript
// Ustawienie userId w Supabase dla RLS
function setSupabaseAuthContext(userId: string)
```

---

## 🧪 **Faza 6: Testy Manualne (Postman/Thunder Client)**

### 6.1 Scenariusz USER:

```
1. POST /api/auth/login (user@tickflow.com) → Otrzymaj token
2. GET /api/categories → Lista kategorii i podkategorii
3. POST /api/tickets → Utwórz ticket (Hardware → Komputer)
4. GET /api/tickets → Zobacz swoje tickety
5. GET /api/tickets/:id → Szczegóły ticketu
```

### 6.2 Scenariusz AGENT:

```
1. POST /api/auth/login (agent@tickflow.com) → Otrzymaj token
2. GET /api/agent-categories/me → Moje przypisane kategorie
3. GET /api/tickets → Zobacz tickety z moich kategorii
4. POST /api/tickets/:id/assign → Przypisz ticket do siebie
5. PATCH /api/tickets/:id/status → Zmień status na IN_PROGRESS
6. PATCH /api/tickets/:id/status → Zmień status na RESOLVED
```

### 6.3 Scenariusz bezpieczeństwa:

```
1. USER próbuje dostać się do /api/agent-categories/me → 403
2. USER próbuje zobaczyć ticket innego usera → 404 (RLS)
3. AGENT próbuje zobaczyć ticket z kategorii nie-przypisanej → 404 (RLS)
4. AGENT próbuje przypisać ticket spoza swoich kategorii → 403
```

---

## 📁 **Struktura Plików (Podsumowanie)**

```
app/
├── api/
│   ├── tickets/
│   │   ├── route.ts (GET, POST)
│   │   └── [ticketId]/
│   │       ├── route.ts (GET)
│   │       ├── assign/
│   │       │   └── route.ts (POST)
│   │       └── status/
│   │           └── route.ts (PATCH)
│   ├── categories/
│   │   ├── route.ts (GET)
│   │   └── [categoryId]/
│   │       └── route.ts (GET)
│   └── agent-categories/
│       ├── me/
│       │   └── route.ts (GET)
│       └── [categoryId]/
│           └── agents/
│               └── route.ts (GET)
├── lib/
│   ├── services/
│   │   ├── tickets.ts ✨ NOWY
│   │   ├── categories.ts ✨ NOWY
│   │   └── agent-categories.ts ✨ NOWY
│   ├── validators/
│   │   ├── tickets.ts ✨ NOWY
│   │   └── categories.ts ✨ NOWY
│   └── utils/
│       ├── api-response.ts ✨ NOWY
│       └── supabase-auth.ts ✨ NOWY
scripts/
└── seed-categories.ts ✨ NOWY
```

---

## ⚡ **Kolejność Implementacji (Krok po kroku)**

1. ✅ **Seed Data** → `scripts/seed-categories.ts`
2. ✅ **Walidatory** → `validators/tickets.ts`, `validators/categories.ts`
3. ✅ **Utilities** → `utils/api-response.ts`, `utils/supabase-auth.ts`, rozszerzenie `utils/auth.ts`
4. ✅ **Services** → `services/categories.ts` (najprostszy)
5. ✅ **Services** → `services/agent-categories.ts`
6. ✅ **Services** → `services/tickets.ts` (najbardziej złożony)
7. ✅ **API Routes** → `/api/categories/*`
8. ✅ **API Routes** → `/api/agent-categories/*`
9. ✅ **API Routes** → `/api/tickets/*`
10. ✅ **Testy** → Manualne testy w Postman/Thunder Client

---

## 🎯 **Kluczowe Decyzje Techniczne**

### Security:
- ✅ RLS policies w bazie danych (już zaimplementowane)
- ✅ JWT authentication (już zaimplementowane)
- ✅ Role-based access control w service layer
- ✅ Walidacja Zod na wszystkich endpointach

### Performance:
- ✅ Indeks na `(status, assigned_to_id)` (już w DB)
- ✅ Paginacja dla listy ticketów
- ✅ Selective joins (includeSubcategories tylko gdy potrzebne)

### Best Practices:
- ✅ Service layer oddzielony od API routes
- ✅ TypeScript strict mode
- ✅ DTOs dla wszystkich responses (już zdefiniowane w `types.ts`)
- ✅ Centralized error handling

---

## 📝 **Dodatkowe Notatki**

1. **Supabase RLS**: Polityki już działają - nie trzeba ręcznie filtrować w kodzie, wystarczy używać `supabaseServer` z auth context
2. **Real-time**: Na razie pominięte (można dodać później)
3. **Soft delete**: Tickety nie można usuwać (zgodnie z RLS policies)
4. **Agent auto-assignment**: Na razie manual (można dodać logikę load-balancing później)

---

## 🔄 **Status Implementacji**

| Faza | Komponent | Status | Notatki |
|------|-----------|--------|---------|
| 1 | Seed Data | ⏳ TODO | - |
| 2 | Walidatory | ⏳ TODO | - |
| 3 | Utilities | ⏳ TODO | - |
| 4 | Services | ⏳ TODO | - |
| 5 | API Routes | ⏳ TODO | - |
| 6 | Testy | ⏳ TODO | - |

**Legenda:**
- ⏳ TODO - Do zrobienia
- 🚧 IN PROGRESS - W trakcie
- ✅ DONE - Gotowe
- ❌ BLOCKED - Zablokowane

---

*Dokument będzie aktualizowany w trakcie implementacji.*

