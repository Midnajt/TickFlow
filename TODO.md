🛠 Porównaj SPECIFICATIONS.md i wykorzystane w niej technologie do różnych modeli i sprawdź czy zaproponują to smao lub podważą wybór technologii.

---

# 📋 Szczegółowy Plan Działania - TickFlow

## 🔍 1. Analiza Wymagań

### 1.1 Role i Hierarchia
- **4 role użytkowników**: User → Agent → Manager → Admin
- **Dziedziczenie uprawnień**: każda wyższa rola dziedziczy uprawnienia niższych
- **RBAC (Role-Based Access Control)** - kluczowe dla bezpieczeństwa

### 1.2 Encje Domenowe
1. **User** (Użytkownik, Agent, Manager, Admin)
   - Email (unikalny, login)
   - Hasło (haszowane)
   - Rola (enum: USER, AGENT, MANAGER, ADMIN)
   - Przypisane kategorie/podkategorie (dla Agent/Manager)
   - Timestamps (created, updated, lastLogin)

2. **Category** (Kategoria)
   - Nazwa
   - Opis
   - Przypisany Manager (może być wielu)
   - Utworzona przez Admin

3. **Subcategory** (Podkategoria)
   - Nazwa
   - Opis
   - Relacja do Category (many-to-one)
   - Przypisani Agenci
   - Utworzona przez Manager

4. **Ticket**
   - Tytuł (wymagane, string)
   - Opis (wymagane, string, max 500 znaków)
   - Status (enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
   - Kategoria (wymagane, ObjectId ref)
   - Podkategoria (wymagane, ObjectId ref)
   - Twórca (User)
   - Przypisany Agent (opcjonalnie)
   - Timestamps (created, updated, resolved, closed)
   - Historia zmian

5. **Comment** (Komentarz)
   - Treść
   - Autor (User/Agent/Manager)
   - Ticket (relacja)
   - Timestamp

6. **AuditLog** (Log Audytu)
   - Typ akcji (enum)
   - User ID
   - IP Address
   - Timestamp
   - Dodatkowe dane (JSON)

7. **SystemLog** (Log Systemowy)
   - Poziom (ERROR, WARN, INFO)
   - Wiadomość
   - Stack trace
   - Timestamp

8. **EmailService** (Serwis Email)
   - Wysyłanie notyfikacji email do użytkowników
   - Typy notyfikacji:
     - **Nowe konto utworzone** (do nowego użytkownika z hasłem tymczasowym)
     - Ticket utworzony (do agentów w subcategory)
     - Ticket przyjęty (do twórcy ticketu)
     - Ticket zaktualizowany/zmiana statusu (do twórcy ticketu)
     - Ticket rozwiązany (do twórcy ticketu)
     - Nowy komentarz (do twórcy i przypisanego agenta)
     - Reset hasła (link do zmiany hasła)
   - Template engine dla emaili
   - Queue system dla masowego wysyłania

### 1.3 Kluczowe Funkcjonalności
- ✅ Autoryzacja (JWT/NextAuth + RBAC)
- ✅ **BRAK samoobsługowej rejestracji** - tylko Manager/Admin tworzy konta
- ✅ Tworzenie ticketów z wyborem kategorii/podkategorii
- ✅ Real-time updates (WebSocket) przy przypisaniu ticketu
- ✅ System komentarzy
- ✅ Statystyki dla Manager/Admin
- ✅ System logów (audit + system)
- ✅ Reset hasła (self-service) - jedyna opcja self-service dla użytkowników
- ✅ **Email notifications** - powiadomienia o zmianach w ticketach + welcome email
- ✅ **Widoczność przypisanego agenta** - użytkownik widzi kto przyjął jego ticket

---

## 🏗️ 2. Projekt Architektury

### 2.1 Struktura Folderów

```
TickFlow/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes group
│   │   │   ├── login/
│   │   │   └── reset-password/       # Jedyna self-service opcja
│   │   ├── (dashboard)/              # Dashboard routes group
│   │   │   ├── user/                 # Panel użytkownika
│   │   │   ├── agent/                # Panel agenta
│   │   │   ├── manager/              # Panel managera
│   │   │   └── admin/                # Panel admina
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   ├── tickets/
│   │   │   ├── categories/
│   │   │   ├── subcategories/
│   │   │   ├── users/
│   │   │   ├── comments/
│   │   │   ├── stats/
│   │   │   └── logs/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                   # React Components
│   │   ├── ui/                       # Reusable UI components
│   │   ├── forms/                    # Form components
│   │   ├── tickets/                  # Ticket-related components
│   │   ├── dashboard/                # Dashboard components
│   │   └── layout/                   # Layout components (Navbar, Sidebar)
│   ├── lib/                          # Utilities & configs
│   │   ├── db/                       # Database connection
│   │   │   └── mongodb.ts
│   │   ├── auth/                     # Auth utilities
│   │   │   ├── jwt.ts
│   │   │   └── rbac.ts
│   │   ├── websocket/                # WebSocket setup
│   │   │   └── socket.ts
│   │   ├── email/                    # Email service
│   │   │   ├── emailService.ts
│   │   │   ├── templates/            # Email templates
│   │   │   │   ├── welcomeUser.tsx   # Nowe konto + hasło tymczasowe
│   │   │   │   ├── resetPassword.tsx
│   │   │   │   ├── ticketCreated.tsx
│   │   │   │   ├── ticketAssigned.tsx
│   │   │   │   ├── ticketResolved.tsx
│   │   │   │   └── ticketCommented.tsx
│   │   │   └── queue.ts              # Email queue (optional)
│   │   ├── validators/               # Zod schemas
│   │   └── utils.ts
│   ├── models/                       # Mongoose models
│   │   ├── User.ts
│   │   ├── Category.ts
│   │   ├── Subcategory.ts
│   │   ├── Ticket.ts
│   │   ├── Comment.ts
│   │   ├── AuditLog.ts
│   │   └── SystemLog.ts
│   ├── types/                        # TypeScript types
│   │   ├── auth.ts
│   │   ├── ticket.ts
│   │   └── index.ts
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTickets.ts
│   │   └── useWebSocket.ts
│   ├── middleware/                   # API middleware
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   └── errorHandler.ts
│   └── middleware.ts                 # Next.js middleware (route protection)
├── public/
├── .env.local                        # Environment variables
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

### 2.2 Stack Technologiczny - Uzasadnienie

**Frontend:**
- ✅ **Next.js 15** (App Router) - SSR, routing, API routes w jednym
- ✅ **TypeScript** - type safety, lepsze DX
- ✅ **TailwindCSS** - szybki development, konsystentny design
- ✅ **shadcn/ui** - gotowe komponenty wysokiej jakości

**Backend:**
- ✅ **Next.js API Routes** - prostsze deployment, ten sam projekt
- ⚠️ **Alternatywa**: Osobny Node.js + Express (jeśli potrzebna większa skalowalność)

**Database:**
- ✅ **MongoDB + Mongoose** - elastyczne schema, łatwe relacje
- ✅ **MongoDB Atlas** - managed, backup, monitoring

**Real-time:**
- ✅ **Socket.io** - prosty setup, fallback do long-polling
- ⚠️ **Alternatywa**: Pusher, Ably (managed solutions)

**Autoryzacja:**
- ✅ **NextAuth.js v5 (Auth.js)** - najlepsza integracja z Next.js
- ✅ **JWT** - stateless, skalowalne
- ✅ **bcrypt** - haszowanie haseł

**Walidacja:**
- ✅ **Zod** - runtime validation, type inference

**State Management:**
- ✅ **React Context + Hooks** (dla prostych stanów)
- ⚠️ **Zustand/Redux** (jeśli aplikacja się rozrośnie)

**Testing:**
- ✅ **Jest + React Testing Library** - unit tests
- ✅ **Playwright** - e2e tests

**Email Service:**
- ✅ **Resend** - nowoczesny email API (darmowy: 100 emaili/dzień)
- ✅ **React Email** - type-safe email templates w React/TSX
- ⚠️ **Alternatywa**: SendGrid, Mailgun, AWS SES

### 2.3 Database Schema (MongoDB)

```typescript
// User Schema
{
  _id: ObjectId,
  email: string (unique, indexed),
  password: string (hashed),
  role: enum ['USER', 'AGENT', 'MANAGER', 'ADMIN'],
  firstName: string,
  lastName: string,
  assignedCategories: ObjectId[] (ref: Category) // dla Manager
  assignedSubcategories: ObjectId[] (ref: Subcategory) // dla Agent
  createdBy: ObjectId (ref: User),
  isActive: boolean,
  mustChangePassword: boolean, // true dla nowo utworzonych użytkowników
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}

// Category Schema
{
  _id: ObjectId,
  name: string (unique),
  description: string,
  managers: ObjectId[] (ref: User, role: MANAGER),
  createdBy: ObjectId (ref: User, role: ADMIN),
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

// Subcategory Schema
{
  _id: ObjectId,
  name: string,
  description: string,
  category: ObjectId (ref: Category),
  agents: ObjectId[] (ref: User, role: AGENT),
  createdBy: ObjectId (ref: User, role: MANAGER),
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

// Ticket Schema
{
  _id: ObjectId,
  title: string (required, minLength: 1, maxLength: 200),
  description: string (required, minLength: 1, maxLength: 500),
  status: enum ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  category: ObjectId (ref: Category, required),
  subcategory: ObjectId (ref: Subcategory, required),
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User, role: AGENT) // nullable, populated w response dla User
  assignedAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Comment Schema
{
  _id: ObjectId,
  ticket: ObjectId (ref: Ticket),
  author: ObjectId (ref: User),
  content: string,
  isInternal: boolean, // komentarze tylko dla agentów
  createdAt: Date,
  updatedAt: Date
}

// AuditLog Schema
{
  _id: ObjectId,
  action: enum ['LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'TICKET_CREATED', ...],
  userId: ObjectId (ref: User),
  targetId: ObjectId, // ID obiektu, którego dotyczy akcja
  targetType: enum ['TICKET', 'USER', 'CATEGORY', ...],
  ipAddress: string,
  userAgent: string,
  metadata: Object (JSON),
  createdAt: Date
}

// SystemLog Schema
{
  _id: ObjectId,
  level: enum ['ERROR', 'WARN', 'INFO', 'DEBUG'],
  message: string,
  stackTrace: string,
  context: Object (JSON),
  createdAt: Date
}
```

### 2.4 API Endpoints

#### Auth
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/logout` - Wylogowanie
- `POST /api/auth/reset-password` - Reset hasła (self-service)
- `POST /api/auth/change-password` - Zmiana hasła (po resecie)
- `GET /api/auth/me` - Pobranie danych aktualnego użytkownika

**⚠️ BRAK PUBLICZNEJ REJESTRACJI**: Użytkownicy nie mogą się sami rejestrować. Konta tworzy tylko Manager/Admin przez `/api/users`

#### Tickets
- `GET /api/tickets` - Lista ticketów (filtrowana wg roli)
- `GET /api/tickets/:id` - Szczegóły ticketu
- `POST /api/tickets` - Utworzenie ticketu (USER+)
- `PATCH /api/tickets/:id` - Aktualizacja ticketu
- `PATCH /api/tickets/:id/assign` - Przypisanie ticketu (AGENT+)
- `PATCH /api/tickets/:id/status` - Zmiana statusu (AGENT+)
- `DELETE /api/tickets/:id` - Usunięcie ticketu (ADMIN)

#### Comments
- `GET /api/tickets/:id/comments` - Lista komentarzy
- `POST /api/tickets/:id/comments` - Dodanie komentarza

#### Categories
- `GET /api/categories` - Lista kategorii
- `GET /api/categories/:id` - Szczegóły kategorii
- `POST /api/categories` - Utworzenie kategorii (ADMIN)
- `PATCH /api/categories/:id` - Aktualizacja kategorii (ADMIN)
- `DELETE /api/categories/:id` - Usunięcie kategorii (ADMIN)

#### Subcategories
- `GET /api/subcategories` - Lista podkategorii
- `GET /api/subcategories/:id` - Szczegóły podkategorii
- `POST /api/subcategories` - Utworzenie podkategorii (MANAGER+)
- `PATCH /api/subcategories/:id` - Aktualizacja podkategorii (MANAGER+)
- `DELETE /api/subcategories/:id` - Usunięcie podkategorii (MANAGER+)

#### Users
- `GET /api/users` - Lista użytkowników (filtrowana wg uprawnień)
- `GET /api/users/:id` - Szczegóły użytkownika
- `POST /api/users` - Utworzenie użytkownika (MANAGER+)
- `PATCH /api/users/:id` - Aktualizacja użytkownika
- `DELETE /api/users/:id` - Deaktywacja użytkownika

#### Stats
- `GET /api/stats/agent` - Statystyki agentów (MANAGER+)
- `GET /api/stats/user` - Statystyki użytkowników (ADMIN)
- `GET /api/stats/tickets` - Ogólne statystyki ticketów

#### Logs
- `GET /api/logs/audit` - Logi audytu (ADMIN)
- `GET /api/logs/system` - Logi systemowe (ADMIN)

#### WebSocket Events
- `ticket:created` - Nowy ticket
- `ticket:assigned` - Ticket przypisany
- `ticket:updated` - Ticket zaktualizowany
- `ticket:commented` - Nowy komentarz
- `user:online` - Użytkownik online

---

## ⚠️ 3. Obsługa Edge Cases

### 3.1 User Management
- ❓ Użytkownik próbuje uzyskać dostęp do /register lub POST /api/auth/register → 404 Not Found (endpoint nie istnieje)
- ❓ Użytkownik próbuje stworzyć konto przez API → 403 Forbidden (tylko Manager/Admin może tworzyć użytkowników)
- ❓ Co się dzieje gdy Manager zostanie zdegradowany? → Przepisać jego tickety
- ❓ Co się dzieje gdy Agent zostanie usunięty? → Odpisać jego tickety
- ❓ Manager tworzy Agenta - czy może przypisać go do kategorii, do której Manager nie ma dostępu? → NIE
- ❓ Użytkownik próbuje się zalogować po deaktywacji → Blokada + komunikat
- ❓ Równoczesne logowanie z różnych urządzeń → Dozwolone, track sessions
- ❓ Manager tworzy użytkownika - jaki email dostaje nowy user? → Email z hasłem tymczasowym + instrukcje
- ❓ Nowy użytkownik loguje się z hasłem tymczasowym → Redirect do zmiany hasła (mustChangePassword: true)
- ❓ Użytkownik nie zmieni hasła z tymczasowego → Może dalej pracować, ale banner "Zmień hasło" (opcjonalnie wymusić)

### 3.2 Ticket Management
- ❓ Agent przypisuje ticket do siebie - co jeśli inny Agent zrobił to samo w tym samym czasie? → Optymistic locking (version field)
- ❓ Użytkownik tworzy ticket w nieistniejącej kategorii → Walidacja + error
- ❓ Użytkownik tworzy ticket bez tytułu → Walidacja + error "Tytuł jest wymagany"
- ❓ Użytkownik tworzy ticket bez opisu → Walidacja + error "Opis jest wymagany"
- ❓ Użytkownik wpisuje opis dłuższy niż 500 znaków → Walidacja + error "Opis może mieć maksymalnie 500 znaków"
- ❓ Użytkownik próbuje stworzyć ticket bez kategorii/podkategorii → Walidacja + error
- ❓ Podkategoria zostaje usunięta - co z ticketami? → Soft delete lub przepisanie do kategorii nadrzędnej
- ❓ Ticket ma komentarze, ale został usunięty → Soft delete ticketów
- ❓ Agent widzi ticket, ale w międzyczasie został odpisany z podkategorii → Real-time update + usunięcie z widoku

### 3.3 Category/Subcategory
- ❓ Kategoria ma tickety, ale Admin chce ją usunąć → Blokada lub soft delete
- ❓ Manager tworzy podkategorię w kategorii, do której stracił dostęp → Walidacja przy każdym request
- ❓ Kategoria bez Managerów → Dozwolone, Admin może zarządzać

### 3.4 Real-time Updates
- ❓ Użytkownik jest offline - co z WebSocket events? → Aktualizacja przy następnym zalogowaniu
- ❓ WebSocket connection fails → Fallback do polling lub long-polling
- ❓ High load - tysiące użytkowników online → WebSocket rooms per category/subcategory

### 3.5 Permissions
- ❓ Manager próbuje zobaczyć tickety spoza swoich kategorii → 403 Forbidden
- ❓ User próbuje edytować cudzy ticket → 403 Forbidden
- ❓ Direct API call bypassing UI → Middleware RBAC check na każdym endpoint

### 3.6 Data Integrity
- ❓ Race condition przy tworzeniu użytkownika z tym samym email → Unique index + try/catch
- ❓ Orphaned documents (subcategory bez category) → Cascade delete lub foreign key check
- ❓ Inconsistent stats (cache) → Periodic recalculation + cache invalidation

### 3.7 Email Notifications
- ❓ Email service down - co z notyfikacjami? → Queue system z retry logic
- ❓ User nie ma emaila lub nieprawidłowy email → Walidacja przy tworzeniu użytkownika
- ❓ Spam protection - limit emaili per user → Rate limiting dla notyfikacji
- ❓ User chce wyłączyć notyfikacje → Preferencje w profilu użytkownika (future)
- ❓ Email template rendering fails → Fallback do plain text + log error
- ❓ Batch notification dla wielu agentów → Queue system, grupowanie emaili

---

## 🚨 4. Obsługa Błędów

### 4.1 Frontend Error Handling

```typescript
// Global Error Boundary
- ErrorBoundary component dla React errors
- Fallback UI z opcją "Report Error"
- Log errors do system logs

// API Error Handling
- Centralized API client z interceptorami
- Unified error format: { success: false, error: { code, message, details } }
- Toast notifications dla user-facing errors
- Retry logic dla network errors

// Form Validation
- Client-side validation z Zod
- Real-time field validation
- Accessible error messages
- Ticket form validation:
  * Tytuł: wymagany, minLength: 1, maxLength: 200
  * Opis: wymagany, minLength: 1, maxLength: 500
  * Kategoria: wymagana
  * Podkategoria: wymagana
  * Live character counter dla opisu (X/500)
```

### 4.2 Backend Error Handling

```typescript
// API Route Error Handling
- try/catch w każdym route handler
- Custom error classes (ValidationError, AuthError, NotFoundError, etc.)
- Error middleware do centralized handling
- Proper HTTP status codes

// Database Errors
- Connection errors → Retry logic
- Validation errors → 400 Bad Request
  * Ticket bez tytułu/opisu → "Tytuł i opis są wymagane"
  * Opis > 500 znaków → "Opis może mieć maksymalnie 500 znaków"
  * Brak kategorii/podkategorii → "Kategoria i podkategoria są wymagane"
- Duplicate key errors → 409 Conflict
- Not found errors → 404 Not Found

// WebSocket Errors
- Connection errors → Auto-reconnect
- Authentication errors → Disconnect + redirect to login
- Emit errors back to client

// Logging
- Winston/Pino dla structured logging
- Different log levels (ERROR, WARN, INFO, DEBUG)
- Log to SystemLog collection
- Optional: Send critical errors to external service (Sentry)

// Email Service Errors
- Email send failures → Retry logic (3 attempts)
- Invalid recipient → Log warning, skip
- Template rendering errors → Fallback to plain text
- Rate limit exceeded → Queue for later
- Service unavailable → Queue system with exponential backoff
```

### 4.3 User Feedback

```typescript
// Success Messages
- Toast notifications
- Success states w UI
- Loading states

// Error Messages
- User-friendly error messages (nie techniczne)
- Sugestie rozwiązania
- Contact support option

// Validation Errors
- Field-level errors
- Form-level errors
- Clear messaging
```

---

## 🧪 5. Strategia Testowania

### 5.1 Unit Tests (Jest)

```typescript
// Models
- Mongoose model validation
- Schema defaults
- Virtual fields
- Instance methods

// Utilities
- Auth helpers (JWT, bcrypt)
- RBAC logic
- Validators (Zod schemas)
- Date formatters

// Hooks
- useAuth hook
- useTickets hook
- useWebSocket hook
```

### 5.2 Integration Tests (Jest + Supertest)

```typescript
// API Routes
- Auth flow (login, logout, reset password)
- CRUD operations dla każdej encji
- Permission checks
- Data validation
- Error handling

// Database
- MongoDB in-memory dla testów
- Transaction handling
- Cascade operations
```

### 5.3 E2E Tests (Playwright)

```typescript
// Critical User Flows
1. User registration → login → create ticket
2. Agent login → view tickets → assign ticket → add comment → resolve
3. Manager login → create subcategory → assign agent → view stats
4. Admin login → create category → assign manager → view logs

// Real-time Tests
- Ticket assignment updates drugi browser
- Comment pojawia się real-time

// Responsive Tests
- Mobile, tablet, desktop views
```

### 5.4 Performance Tests

```typescript
// Load Testing (Artillery/k6)
- 100+ concurrent users
- Real-time WebSocket connections
- Database query performance

// Metrics
- API response time < 200ms
- Page load time < 2s
- Time to interactive < 3s
```

---

## 🤔 6. Decyzje do Podjęcia

### 6.1 Techniczne

1. **NextAuth vs Custom JWT?**
   - ✅ Rekomendacja: NextAuth.js v5 (lepszy DX, security best practices)
   - ⚠️ Custom JWT tylko jeśli potrzebna pełna kontrola

2. **Separate API Backend?**
   - ✅ Start: Next.js API routes (prostsze)
   - ⚠️ Przejście na osobny backend jeśli:
     - Potrzeba mikroservices
     - Potrzeba osobnego scaling
     - Potrzeba non-Next.js clientów

3. **MongoDB Atlas vs Self-hosted?**
   - ✅ Rekomendacja: Atlas (managed, backup, monitoring)
   - ⚠️ Self-hosted tylko dla compliance/cost optimization

4. **WebSocket Deployment?**
   - ⚠️ Vercel nie wspiera WebSockets
   - ✅ Opcje:
     - Separate WebSocket server (Railway, Render, DigitalOcean)
     - Pusher/Ably (managed)
     - Polling fallback dla Vercel

5. **File Uploads (przyszłość)?**
   - Tickets z attachmentami?
   - ✅ Cloudinary, AWS S3, Uploadthing

6. **Email Service** (WYMAGANY)
   - Reset password, notifications
   - ✅ **Rekomendacja: Resend** (nowoczesny, prosty API, darmowy tier)
   - ⚠️ Alternatywy: SendGrid, Mailgun, AWS SES
   - ✅ React Email dla templates (type-safe, preview)

7. **Internationalization (i18n)?**
   - Polski + Angielski?
   - ✅ next-intl (jeśli tak)

8. **Temporary Password Strategy?**
   - ✅ Rekomendacja: Generować silne losowe hasło (12+ znaków)
   - ✅ Wysłać w welcome email
   - ✅ Wymusić zmianę hasła przy pierwszym logowaniu (flag: `mustChangePassword`)
   - ⚠️ Alternatywa: Magic link do ustawienia hasła (bez wysyłania hasła przez email)

### 6.2 Biznesowe/UX

1. **Ticket Priority** ❌ USUNIĘTY
   - Nie implementujemy systemu priorytetów w MVP

2. **Ticket Deadline/SLA?**
   - Czy tickety mają termin realizacji?
   - Automated reminders?

3. **Email Notifications** ✅ WYMAGANE
   - ✅ Nowy ticket → Notyfikacja do wszystkich agentów w subcategory
   - ✅ Ticket przyjęty → Notyfikacja do twórcy ticketu (widzi kto przyjął)
   - ✅ Zmiana statusu → Notyfikacja do twórcy ticketu
   - ✅ Ticket rozwiązany → Notyfikacja do twórcy ticketu
   - ✅ Nowy komentarz → Notyfikacja do twórcy i przypisanego agenta
   - ⚠️ Opcja wyłączenia notyfikacji → Future enhancement (preferencje użytkownika)

4. **Search & Filters?**
   - Full-text search (MongoDB Atlas Search / Algolia)?
   - Zaawansowane filtry (data, status, kategoria, agent)?

5. **Pagination?**
   - Infinite scroll vs classic pagination?
   - Ilość ticketów per page?

6. **Dark Mode?**
   - ✅ Rekomendacja: TAK (next-themes)

7. **Mobile App?**
   - Progressive Web App (PWA)?
   - Native app (React Native)?

8. **Widoczność przypisanego agenta dla User** ✅ WYMAGANE
   - User na liście swoich ticketów widzi informację kto przyjął ticket
   - Populate `assignedTo` field w API response dla ticketów użytkownika
   - UI: Pokazać imię i nazwisko agenta + avatar (opcjonalnie)

---

## 🕳️ 7. Rabbit Holes (Pułapki do Uniknięcia)

### 7.1 Over-engineering
- ❌ NIE implementuj mikroservices od razu
- ❌ NIE dodawaj GraphQL jeśli REST wystarczy
- ❌ NIE używaj Redis cache jeśli nie ma performance issues
- ✅ Start simple, scale when needed

### 7.2 Premature Optimization
- ❌ NIE optymalizuj zapytań DB przed zmierzeniem
- ❌ NIE dodawaj CDN jeśli nie ma traffic
- ✅ Measure first, optimize later

### 7.3 Real-time Complexity
- ❌ NIE implementuj własnego WebSocket protocol
- ❌ NIE próbuj syncować całego state przez WebSocket
- ✅ Użyj Socket.io, emituj tylko zmiany

### 7.4 Permission Hell
- ❌ NIE sprawdzaj permissions w 10 miejscach
- ✅ Centralize RBAC logic w middleware
- ✅ Use decorators/HOCs dla route protection

### 7.5 State Management Overkill
- ❌ NIE dodawaj Redux dla 3 stanów globalnych
- ✅ Start z Context API
- ✅ Dodaj Zustand jeśli Context się rozrośnie

### 7.6 Testing Everything
- ❌ NIE pisz testów dla każdej linii kodu od razu
- ✅ Testuj critical paths
- ✅ 80% coverage to dobry cel

### 7.7 Perfect UI From Day 1
- ❌ NIE spędzaj tygodnia na idealnym designie
- ✅ Użyj shadcn/ui, dostosuj później
- ✅ Focus na functionality first

---

## ✅ 8. Lista Zadań do Zaimplementowania

### Phase 1: Fundament (Tydzień 1-2)

#### Setup & Configuration
- [ ] Zainstalować i skonfigurować MongoDB Atlas
- [ ] Dodać zmienne środowiskowe (.env.local)
- [ ] Skonfigurować TypeScript strict mode
- [ ] Zainstalować shadcn/ui components
- [ ] Skonfigurować Prettier + ESLint
- [ ] Setup Git hooks (Husky) dla pre-commit linting

#### Database Models
- [ ] Utworzyć model User (Mongoose)
- [ ] Utworzyć model Category (Mongoose)
- [ ] Utworzyć model Subcategory (Mongoose)
- [ ] Utworzyć model Ticket (Mongoose):
  - [ ] title: { type: String, required: true, minLength: 1, maxLength: 200 }
  - [ ] description: { type: String, required: true, minLength: 1, maxLength: 500 }
  - [ ] category: { type: ObjectId, ref: 'Category', required: true }
  - [ ] subcategory: { type: ObjectId, ref: 'Subcategory', required: true }
  - [ ] status, createdBy, assignedTo, timestamps
- [ ] Utworzyć model Comment (Mongoose)
- [ ] Utworzyć model AuditLog (Mongoose)
- [ ] Utworzyć model SystemLog (Mongoose)
- [ ] Dodać indexes (email unique, timestamps)

#### Authentication
- [ ] Zainstalować i skonfigurować NextAuth.js v5
- [ ] Utworzyć API route dla login (sprawdzaj mustChangePassword flag)
- [ ] Utworzyć API route dla logout
- [ ] Zaimplementować JWT strategy
- [ ] Zaimplementować password hashing (bcrypt)
- [ ] Zaimplementować generator silnych haseł tymczasowych
- [ ] Utworzyć login page (UI)
- [ ] Utworzyć reset password page (UI) - self-service
- [ ] Utworzyć change password page (dla nowych użytkowników)
- [ ] Utworzyć middleware do route protection
- [ ] Zaimplementować RBAC middleware
- [ ] Zaimplementować redirect po loginie jeśli mustChangePassword=true
- [ ] **BRAK register route** - użytkownicy tworzeni tylko przez Manager/Admin

#### TypeScript Types
- [ ] Zdefiniować types dla User
- [ ] Zdefiniować types dla Ticket:
  - [ ] title: string (required, max 200)
  - [ ] description: string (required, max 500)
  - [ ] category: ObjectId (required)
  - [ ] subcategory: ObjectId (required)
  - [ ] status, createdBy, assignedTo, timestamps
- [ ] Zdefiniować types dla Category/Subcategory
- [ ] Zdefiniować types dla API responses
- [ ] Zdefiniować types dla Email notifications
- [ ] Zdefiniować enums (Role, Status, EmailNotificationType, etc.)

#### Email Service Setup
- [ ] Zainstalować Resend (lub SendGrid)
- [ ] Zainstalować @react-email/components
- [ ] Skonfigurować API key w .env
- [ ] Utworzyć EmailService class w lib/email/emailService.ts
- [ ] Utworzyć email templates (React Email):
  - [ ] **welcomeUser.tsx** (nowe konto + hasło tymczasowe)
  - [ ] resetPassword.tsx (link do resetu hasła)
  - [ ] ticketCreated.tsx
  - [ ] ticketAssigned.tsx
  - [ ] ticketStatusChanged.tsx
  - [ ] ticketResolved.tsx
  - [ ] ticketCommented.tsx
- [ ] Zaimplementować queue system (opcjonalnie Bull/BullMQ)
- [ ] Dodać error handling i retry logic
- [ ] Dodać rate limiting dla wysyłania emaili

---

### Phase 2: Core Functionality (Tydzień 3-4)

#### Ticket System
- [ ] API: GET /api/tickets (z filtrowaniem wg roli, populate assignedTo dla User)
- [ ] API: POST /api/tickets (create ticket) + **Email: Notify agents**
- [ ] API: GET /api/tickets/[id] (ticket details, populate assignedTo)
- [ ] API: PATCH /api/tickets/[id] (update ticket) + **Email: Notify creator**
- [ ] API: PATCH /api/tickets/[id]/assign (assign to agent) + **Email: Notify creator (kto przyjął)**
- [ ] API: PATCH /api/tickets/[id]/status (change status) + **Email: Notify creator**
- [ ] UI: Ticket list component (pokazać przypisanego agenta dla User)
- [ ] UI: Ticket detail component (pokazać przypisanego agenta)
- [ ] UI: Create ticket form z walidacją:
  - [ ] Pole "Kategoria" (select, wymagane)
  - [ ] Pole "Podkategoria" (select, wymagane, filtrowane wg kategorii)
  - [ ] Pole "Tytuł" (text input, wymagane, max 200 znaków)
  - [ ] Pole "Opis" (textarea, wymagane, max 500 znaków)
  - [ ] Live character counter dla opisu (X/500)
  - [ ] Walidacja real-time + błędy pod polami
- [ ] UI: Ticket status badges
- [ ] UI: Assigned agent display (imię, nazwisko, opcjonalnie avatar)
- [ ] Walidacja: Zod schemas dla ticket operations:
  - [ ] createTicketSchema (title: required max 200, description: required max 500, category: required, subcategory: required)
  - [ ] updateTicketSchema
  - [ ] assignTicketSchema

#### Category/Subcategory System
- [ ] API: CRUD dla Categories (ADMIN only)
- [ ] API: CRUD dla Subcategories (MANAGER+)
- [ ] UI: Category management (Admin panel)
- [ ] UI: Subcategory management (Manager panel)
- [ ] UI: Category/Subcategory select w ticket form
- [ ] Walidacja: Manager może tworzyć subcategory tylko w swoich kategoriach

#### Comment System
- [ ] API: GET /api/tickets/[id]/comments
- [ ] API: POST /api/tickets/[id]/comments + **Email: Notify creator & assigned agent**
- [ ] UI: Comments list component
- [ ] UI: Add comment form
- [ ] UI: Comment author display
- [ ] Walidacja: Tylko osoby z dostępem do ticketu mogą komentować

---

### Phase 3: User Management (Tydzień 5)

#### User CRUD
- [ ] API: GET /api/users (filtrowane wg roli)
- [ ] API: POST /api/users (create user by Manager/Admin):
  - [ ] Generuj silne hasło tymczasowe
  - [ ] Ustaw mustChangePassword: true
  - [ ] **Email: Welcome + hasło tymczasowe + instrukcje**
- [ ] API: GET /api/users/[id]
- [ ] API: PATCH /api/users/[id] (update user)
- [ ] API: DELETE /api/users/[id] (soft delete)
- [ ] UI: User list (Manager/Admin panel)
- [ ] UI: Create user form (Manager/Admin panel)
- [ ] UI: Edit user form
- [ ] Walidacja: Manager tworzy tylko USER/AGENT, Admin tworzy wszystkie role
- [ ] **BRAK publicznego register endpoint** - tylko przez panel Manager/Admin

#### Password Management (Self-Service)
- [ ] API: POST /api/auth/reset-password (send reset link) - **self-service**
- [ ] API: POST /api/auth/change-password (with token) - **self-service**
- [ ] API: POST /api/auth/first-time-password-change (dla mustChangePassword=true)
- [ ] UI: Reset password page (publiczna)
- [ ] UI: Change password form
- [ ] UI: First-time password change page (wymuszone dla nowych użytkowników)
- [ ] Email: Send reset password email (Resend/SendGrid)
- [ ] Walidacja: Password strength requirements
- [ ] Po zmianie hasła: ustaw mustChangePassword=false
- [ ] **To jedyna opcja self-service** - użytkownicy nie mogą się sami rejestrować

#### Assignment Logic
- [ ] API: Assign Manager to Category
- [ ] API: Assign Agent to Subcategory
- [ ] UI: Manager assignment (Admin panel)
- [ ] UI: Agent assignment (Manager panel)
- [ ] Walidacja: Agent może być przypisany tylko do subcategory w kategoriach jego Managera

---

### Phase 4: Dashboards (Tydzień 6)

#### User Dashboard
- [ ] UI: Layout dla User panel
- [ ] UI: "Moje tickety" list **z widocznym przypisanym agentem**
- [ ] UI: Ticket filters (status, data)
- [ ] UI: Create ticket button
- [ ] UI: Ticket details view **z informacją o przypisanym agencie**
- [ ] UI: Component dla wyświetlania agenta (avatar + imię/nazwisko)

#### Agent Dashboard
- [ ] UI: Layout dla Agent panel
- [ ] UI: "Dostępne tickety" list (w przypisanych subcategories)
- [ ] UI: "Moje tickety" list (assigned)
- [ ] UI: "Assign to me" button
- [ ] UI: Status change dropdown
- [ ] UI: Comment section

#### Manager Dashboard
- [ ] UI: Layout dla Manager panel
- [ ] UI: Category/Subcategory management section
- [ ] UI: Agent assignment section
- [ ] UI: User creation form
- [ ] UI: Statistics section (placeholder)

#### Admin Dashboard
- [ ] UI: Layout dla Admin panel
- [ ] UI: Category management section
- [ ] UI: Manager assignment section
- [ ] UI: Manager creation form
- [ ] UI: Statistics section (placeholder)
- [ ] UI: Logs viewer (placeholder)

---

### Phase 5: Real-time (Tydzień 7)

#### WebSocket Setup
- [ ] Zainstalować Socket.io (client + server)
- [ ] Utworzyć WebSocket server (separate lub Next.js custom server)
- [ ] Zaimplementować authentication dla WebSocket
- [ ] Utworzyć rooms per category/subcategory
- [ ] Hook: useWebSocket

#### Real-time Events
- [ ] Event: ticket:created → notify Agents w subcategory
- [ ] Event: ticket:assigned → remove from other Agents' lists
- [ ] Event: ticket:updated → update ticket w UI
- [ ] Event: ticket:commented → show new comment
- [ ] Event: user:online → show online status (nice-to-have)

#### Fallback
- [ ] Polling fallback dla browsers bez WebSocket
- [ ] Reconnection logic
- [ ] Offline mode indicator

---

### Phase 6: Statistics (Tydzień 8)

#### Manager Stats
- [ ] API: GET /api/stats/agent (tickets per agent)
- [ ] API: GET /api/stats/tickets/avg-resolution-time
- [ ] UI: Agent performance chart (shadcn/ui charts)
- [ ] UI: Avg resolution time display
- [ ] UI: Filter by date range

#### Admin Stats
- [ ] API: GET /api/stats/user (tickets per user)
- [ ] API: GET /api/stats/overview (wszystkie metryki)
- [ ] UI: User activity chart
- [ ] UI: System-wide metrics
- [ ] UI: Category breakdown chart

#### Caching
- [ ] Zaimplementować cache dla stats (in-memory lub Redis)
- [ ] Cache invalidation przy zmianach ticketów
- [ ] Periodic recalculation (cron job)

---

### Phase 7: Logging & Audit (Tydzień 9)

#### Audit Logging
- [ ] Middleware: Log wszystkie auth events
- [ ] Middleware: Log ticket operations
- [ ] Middleware: Log user management operations
- [ ] Middleware: Log category/subcategory operations
- [ ] Middleware: Capture IP address
- [ ] API: GET /api/logs/audit (Admin only)

#### System Logging
- [ ] Setup Winston/Pino
- [ ] Log errors do SystemLog collection
- [ ] Log warnings
- [ ] Error tracking (optional: Sentry integration)
- [ ] API: GET /api/logs/system (Admin only)

#### UI
- [ ] UI: Audit logs table (Admin panel)
- [ ] UI: System logs table (Admin panel)
- [ ] UI: Log filters (date, action type, user)
- [ ] UI: Log export (CSV/JSON)

---

### Phase 8: Polish & Testing (Tydzień 10-11)

#### Error Handling
- [ ] Global ErrorBoundary component
- [ ] API error handling middleware
- [ ] Toast notifications dla errors
- [ ] User-friendly error messages
- [ ] Loading states dla wszystkich async operations

#### Validation
- [ ] Zod schemas dla wszystkich API inputs:
  - [ ] Ticket: title (required, 1-200 chars), description (required, 1-500 chars)
  - [ ] User: email, password strength
  - [ ] Category/Subcategory: name, description
- [ ] Client-side validation dla forms:
  - [ ] Ticket form: real-time validation z character counters
  - [ ] User form: email format, password requirements
  - [ ] Pokazywanie błędów inline pod polami
- [ ] Server-side validation dla wszystkich endpoints
- [ ] Sanitization inputs (XSS prevention)
- [ ] Test edge cases: puste stringi, whitespace, special characters

#### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode (next-themes)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Loading skeletons
- [ ] Empty states
- [ ] 404/403/500 error pages
- [ ] Banner "Zmień hasło" dla użytkowników z mustChangePassword=true (opcjonalnie)

#### Testing
- [ ] Unit tests dla models (włącznie z mustChangePassword)
- [ ] Unit tests dla utilities (generator haseł tymczasowych)
- [ ] Unit tests dla EmailService (mocked)
- [ ] Integration tests dla API routes (z email notifications)
- [ ] Integration tests dla user creation flow (welcome email)
- [ ] E2E tests dla critical flows:
  - [ ] Manager tworzy użytkownika → user dostaje email → loguje się → zmienia hasło
  - [ ] User resetuje hasło (self-service)
- [ ] Test coverage report
- [ ] CI/CD setup (GitHub Actions)

#### Performance
- [ ] Database indexes
- [ ] API response caching
- [ ] Image optimization
- [ ] Code splitting
- [ ] Bundle size analysis
- [ ] Lighthouse audit

---

### Phase 9: Deployment (Tydzień 12)

#### Pre-deployment
- [ ] Environment variables documentation
- [ ] Database migrations strategy
- [ ] Backup strategy
- [ ] Monitoring setup (Vercel Analytics, Sentry)
- [ ] Security audit
- [ ] Rate limiting (API routes)

#### Deployment
- [ ] Deploy frontend (Vercel)
- [ ] Deploy WebSocket server (Railway/Render/DO)
- [ ] Setup MongoDB Atlas production cluster
- [ ] Setup domains & SSL
- [ ] CORS configuration
- [ ] Environment secrets

#### Post-deployment
- [ ] Smoke tests na production
- [ ] Monitor logs
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Bug tracking setup

---

### Phase 10: Future Enhancements (Backlog)

#### Features
- [ ] User preferences dla email notifications (opcja wyłączenia)
- [ ] Email digest (zbiorczy email zamiast indywidualnych)
- [ ] File attachments dla tickets
- [ ] Ticket templates
- [ ] Bulk operations (bulk assign, bulk close)
- [ ] Advanced search (full-text)
- [ ] Ticket history/timeline
- [ ] SLA management
- [ ] Auto-assignment (round-robin)
- [ ] Ticket escalation
- [ ] Customer satisfaction survey

#### Technical
- [ ] GraphQL API (jeśli potrzebne)
- [ ] Microservices architecture (jeśli potrzebne)
- [ ] Redis caching
- [ ] Elasticsearch dla search
- [ ] Separate admin backend
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Multi-tenant support

---

## 📊 Estimate Timeline

- **Phase 1-2**: 4 tygodnie (Fundament + Core)
- **Phase 3-4**: 2 tygodnie (Users + Dashboards)
- **Phase 5-6**: 2 tygodnie (Real-time + Stats)
- **Phase 7-8**: 2 tygodnie (Logs + Polish)
- **Phase 9**: 1 tydzień (Deployment)

**Total: ~11-12 tygodni dla MVP**

---

## 🎯 Definition of Done (MVP)

MVP jest gotowe gdy:
- ✅ Wszystkie 4 role działają z właściwymi uprawnieniami
- ✅ User może stworzyć ticket
- ✅ Agent może przypisać i rozwiązać ticket
- ✅ Manager może zarządzać podkategoriami i agentami
- ✅ Admin może zarządzać kategoriami i managerami
- ✅ Real-time updates działają przy przypisaniu ticketu
- ✅ **Email notifications działają dla wszystkich operacji na ticketach**
- ✅ **User widzi kto przyjął jego ticket (przypisany agent)**
- ✅ Statystyki pokazują podstawowe metryki
- ✅ Audit logs śledzą krytyczne operacje
- ✅ Aplikacja jest zdeployowana i dostępna
- ✅ Podstawowe testy przechodzą (włącznie z email service)
- ✅ Dokumentacja README jest aktualna

---

## 📚 Dokumenty do Utworzenia

- [ ] `.env.example` z wszystkimi zmiennymi (MongoDB, JWT, Email Service, WebSocket)
- [ ] `CONTRIBUTING.md` z guidelines
- [ ] `API.md` z dokumentacją API
- [ ] `DEPLOYMENT.md` z instrukcjami deployment
- [ ] `CHANGELOG.md` dla wersjonowania
- [ ] User documentation (wiki)
- [ ] Email templates documentation (podgląd i customization)

---

**💡 Ostatnia aktualizacja**: 2025-10-03 v1.3
**👤 Autor**: Marcin
**🎯 Status**: Ready to start implementation

---

## 📝 Changelog Planu

### 2025-10-03 v1.3
- ✅ **Doprecyzowano**: Struktura ticketu - tytuł i opis są WYMAGANE
- ✅ **Dodano**: Opis ticketu ma limit 500 znaków (validation)
- ✅ **Dodano**: Tytuł ticketu ma limit 200 znaków (validation)
- ✅ **Dodano**: Kategoria i podkategoria są WYMAGANE przy tworzeniu ticketu
- ✅ **Dodano**: Live character counter dla pola opisu (X/500)
- ✅ **Zaktualizowano**: Database Schema - ticket validation rules
- ✅ **Zaktualizowano**: Edge cases dla ticket validation (3.2)
- ✅ **Zaktualizowano**: Form validation requirements (4.1)
- ✅ **Zaktualizowano**: Phase 1 tasks - Database Models z validation
- ✅ **Zaktualizowano**: Phase 2 tasks - Create ticket form z szczegółami
- ✅ **Zaktualizowano**: Phase 8 tasks - Validation details

### 2025-10-03 v1.2
- ⚠️ **WYJAŚNIONO**: BRAK samoobsługowej rejestracji - tylko Manager/Admin tworzy konta
- ❌ **Usunięto**: `/register` route i `POST /api/auth/register` endpoint
- ✅ **Dodano**: Welcome email template (nowe konto + hasło tymczasowe)
- ✅ **Dodano**: Reset password email template
- ✅ **Dodano**: Edge cases dla prób rejestracji (3.1)
- ✅ **Zaktualizowano**: Phase 1 & Phase 3 tasks (BRAK register, tylko reset hasła self-service)
- ✅ **Wyjaśniono**: Reset hasła to **jedyna self-service opcja** dla użytkowników

### 2025-10-03 v1.1
- ❌ **Usunięto**: Priorytet ticketu (Priority enum) - nie jest potrzebny w MVP
- ✅ **Dodano**: Email Service (Resend + React Email) - wymagany w MVP
- ✅ **Dodano**: Email notifications przy wszystkich operacjach na ticketach
- ✅ **Dodano**: Widoczność przypisanego agenta dla użytkownika (populate assignedTo)
- ✅ **Dodano**: Sekcja Email Service Setup w Phase 1
- ✅ **Dodano**: Edge cases dla Email Notifications (3.7)
- ✅ **Dodano**: Email Error Handling (4.2)

### 2025-10-03 v1.0
- ✅ Początkowy szczegółowy plan działania