# TickFlow - Product Requirements Document (PRD)

## 📋 Informacje o dokumencie

**Projekt:** TickFlow - System zgłaszania ticketów IT  
**Właściciel:** Marcin  
**Data utworzenia:** 6 października 2025  
**Wersja:** MVP 1.0  

> 📖 **Stack technologiczny:** Szczegóły techniczne (framework, database, dependencies, setup) znajdują się w `.ai/tech-stack.md`

---

## 🎯 1. Cel projektu

### 1.1 Problem biznesowy
Pracownicy spoza działu IT w firmie potrzebują prostego i efektywnego sposobu zgłaszania problemów technicznych do działu IT. Obecne rozwiązania (email, Teams) są nieefektywne i nie pozwalają na:
- Śledzenie statusu zgłoszenia
- Priorytetyzację problemów
- Uniknięcie duplikacji pracy (kilku agentów bierze to samo zgłoszenie)

### 1.2 Cel rozwiązania
Stworzyć aplikację webową umożliwiającą:
- **Użytkownikom:** łatwe zgłaszanie problemów IT i śledzenie ich statusu w czasie rzeczywistym
- **Agentom IT:** efektywne zarządzanie zgłoszeniami z real-time visibility (kto pracuje nad czym)

### 1.3 Sukces projektu
- ✅ Aplikacja wdrożona i używana przez dział IT w firmie
- ✅ Redukcja duplikacji pracy (kilku agentów na jednym tickecie)
- ✅ Przejrzystość statusu zgłoszeń dla użytkowników
- ✅ Nauka Next.js, NextAuth, Real-time przez developera

---

## 👥 2. Role użytkowników (MVP)

### 2.1 USER (Użytkownik)
**Kim jest:** Pracownik firmy spoza działu IT  
**Czego potrzebuje:**
- Zgłosić problem IT
- Wybrać kategorię problemu
- Zobaczyć status swojego zgłoszenia w czasie rzeczywistym
- Wiedzieć kto pracuje nad jego problemem

**Uprawnienia:**
- ✅ Tworzenie ticketów
- ✅ Przeglądanie własnych ticketów
- ✅ Widok statusu ticketu (real-time)
- ❌ Nie widzi ticketów innych użytkowników
- ❌ Nie może przypisywać ani zamykać ticketów

### 2.2 AGENT (Agent IT)
**Kim jest:** Pracownik działu IT obsługujący zgłoszenia w swoim obszarze specjalizacji  
**Czego potrzebuje:**
- Zobaczyć listę otwartych zgłoszeń **tylko w kategoriach do których ma dostęp**
- Wiedzieć w czasie rzeczywistym które tickety są już przypisane
- Przypisać ticket do siebie
- Zmienić status ticketu (rozpoczęcie pracy, zakończenie)
- Zgłosić własny ticket (agenci też mogą potrzebować pomocy)

**Uprawnienia:**
- ✅ Przeglądanie ticketów **tylko w przypisanych kategoriach/podkategoriach**
- ✅ Przypisywanie ticketów do siebie (tylko w swoich kategoriach)
- ✅ Zmiana statusu ticketów (Open → In Progress → Closed)
- ✅ Widok real-time (kto wziął jaki ticket w moich kategoriach)
- ✅ Tworzenie ticketów (może zgłosić problem)
- ❌ Nie widzi ticketów z innych kategorii (do których nie ma dostępu)
- ❌ Nie może zarządzać kategoriami

**Przykład:**
- Agent "Jan Kowalski" ma dostęp do: Hardware, Network
- Agent "Anna Nowak" ma dostęp do: Software, Account & Access
- Jan widzi TYLKO tickety z Hardware i Network
- Anna widzi TYLKO tickety z Software i Account & Access

---

## 🎨 3. Funkcjonalności MVP

### 3.1 MUST HAVE (Tydzień 1-4)

#### 🔐 Autentykacja i zarządzanie użytkownikami
- [ ] Logowanie (email + hasło)
- [ ] Wylogowanie
- [ ] Ochrona route'ów (middleware)
- [ ] Session management
- [ ] **Wymuszenie zmiany hasła** przy pierwszym logowaniu (hasło domyślne: `Start!125`)
- [ ] Formularz zmiany hasła (pierwszy raz + reset)
- [ ] Walidacja siły hasła (min. 8 znaków, litera, cyfra, znak specjalny)
- [ ] **Reset hasła** przez administratora (nie przez email - admin zmienia w bazie na `Start!125`)

**Zarządzanie użytkownikami:**
- ❌ Brak rejestracji przez UI
- ✅ Nowych użytkowników dodaje admin bezpośrednio w bazie (lub przez seed)
- ✅ Domyślne hasło: `Start!125`
- ✅ Domyślna rola: `USER`
- ✅ Rolę `AGENT` nadaje admin ręcznie w bazie + przypisuje kategorie w `AgentCategory`

#### 📝 Zarządzanie ticketami
- [ ] **USER:** Formularz tworzenia ticketu
  - Kategoria (select z dropdown - required)
  - Podkategoria (select z dropdown zależny od kategorii - required)
  - Tytuł (text input - required, min. 5 znaków)
  - Opis (textarea - required, max. 300 znaków)
- [ ] **USER:** Lista własnych ticketów z statusem
- [ ] **USER:** Widok szczegółów ticketu
- [ ] **AGENT:** Formularz tworzenia ticketu (identyczny jak USER)
- [ ] **AGENT:** Lista ticketów (nieprzyjętych) **TYLKO z moich kategorii/podkategorii**
- [ ] **AGENT:** Przycisk "Weź ticket" (przypisanie do siebie)
- [ ] **AGENT:** Lista przypisanych do mnie ticketów
- [ ] **AGENT:** Zmiana statusu ticketu
  - Open → In Progress (automatycznie gdy weźmie)
  - In Progress → Closed
- [ ] **SYSTEM:** Filtrowanie ticketów na podstawie przypisania Agent ↔ Category
- [ ] **SYSTEM:** Walidacja długości opisu (max 300 znaków)

#### ⚡ Real-time Updates
- [ ] **AGENT:** Gdy inny agent przypisze ticket (z moich kategorii), znika z mojej listy (real-time)
- [ ] **USER:** Gdy agent zmieni status, widzę update (real-time)
- [ ] **AGENT:** Licznik dostępnych ticketów aktualizuje się live (tylko moje kategorie)
- [ ] **AGENT:** Nie widzę ticketów z kategorii do których nie mam dostępu

#### 🏷️ Kategorie, Podkategorie i przypisanie Agentów (Hardcoded w MVP)

**Stałe kategorie i podkategorie** (bez możliwości dodawania przez UI):

1. **Hardware**
   - Komputer/Laptop
   - Drukarka
   - Monitor
   - Akcesoria (mysz, klawiatura)
   - Inne

2. **Software**
   - Instalacja programu
   - Problem z aplikacją
   - Licencje
   - Aktualizacje
   - Inne

3. **Network**
   - Brak internetu
   - Wolne WiFi
   - VPN
   - Dostęp do serwera
   - Inne

4. **Account & Access**
   - Reset hasła
   - Dostęp do systemu
   - Uprawnienia
   - Konto email
   - Inne

5. **Other**
   - Inne problemy

**Przypisanie Agentów do kategorii:**
- Agent może mieć dostęp do 1 lub więcej kategorii (i wszystkich ich podkategorii)
- Przypisanie będzie w bazie danych (tabela `AgentCategory`)
- W seedach utworzymy przykładowe przypisania:
  ```
  Jan Kowalski (Agent) → Hardware, Network
  Anna Nowak (Agent) → Software, Account & Access, Other
  ```
- Agent widzi tickety TYLKO z kategorii do których ma dostęp

### 3.2 NICE TO HAVE (Po kursie - Faza 2)

❌ **Odkładamy na później:**
- Role: Manager, Admin
- Dynamiczne tworzenie kategorii/podkategorii przez UI
- Dynamiczne przypisywanie agentów do kategorii przez UI (w MVP: tylko przez seed/SQL)
- Panel admina do zarządzania użytkownikami (w MVP: ręcznie w bazie)
- Statystyki i raporty
- Logi audytowe
- AI sugestie kategorii/podkategorii
- Reset hasła przez email (w MVP: admin ręcznie w bazie)
- Komentarze do ticketów
- Załączniki (screenshoty)
- Priorytetyzacja ticketów
- SLA tracking
- Email notifications

---

## 📊 4. Database Schema

### 4.1 Entity Relationship

```
User (1) ──creates──> (N) Ticket
User (1) ──assigned──> (N) Ticket
Category (1) ──has──> (N) Subcategory
Subcategory (1) ──has──> (N) Ticket
User (Agent) (N) ──has access to──> (N) Category  [many-to-many]
```

**Relacje:**
- Agent ↔ Category (many-to-many) - agent ma dostęp do kategorii
- Category ↔ Subcategory (one-to-many) - kategoria ma wiele podkategorii
- Subcategory ↔ Ticket (one-to-many) - podkategoria ma wiele ticketów

### 4.2 Prisma Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  role      Role     @default(USER)
  passwordResetRequired Boolean @default(true) // Wymusza zmianę hasła przy pierwszym logowaniu
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  ticketsCreated  Ticket[] @relation("CreatedTickets")
  ticketsAssigned Ticket[] @relation("AssignedTickets")
  agentCategories AgentCategory[] // Kategorie do których agent ma dostęp
}

enum Role {
  USER
  AGENT
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  subcategories Subcategory[]
  agents      AgentCategory[] // Agenci mający dostęp do tej kategorii
  createdAt   DateTime @default(now())
}

model Subcategory {
  id          String   @id @default(cuid())
  name        String
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  tickets     Ticket[]
  createdAt   DateTime @default(now())
  
  @@unique([categoryId, name]) // Nazwa podkategorii unikalna w ramach kategorii
  @@index([categoryId])
}

// Tabela pośrednia: Agent ↔ Category (many-to-many)
model AgentCategory {
  id         String   @id @default(cuid())
  userId     String   // Agent (User z role=AGENT)
  categoryId String
  
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([userId, categoryId]) // Agent nie może być 2x przypisany do tej samej kategorii
  @@index([userId])
  @@index([categoryId])
}

model Ticket {
  id          String       @id @default(cuid())
  title       String       // Min. 5 znaków (walidacja w Zod)
  description String       @db.VarChar(300) // Max 300 znaków
  status      TicketStatus @default(OPEN)
  
  subcategoryId String
  subcategory   Subcategory @relation(fields: [subcategoryId], references: [id])
  
  createdById String
  createdBy   User   @relation("CreatedTickets", fields: [createdById], references: [id])
  
  assignedToId String?
  assignedTo   User?   @relation("AssignedTickets", fields: [assignedToId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([assignedToId])
  @@index([createdById])
  @@index([subcategoryId])
}

enum TicketStatus {
  OPEN         // Nowy ticket, nikt nie przypisany
  IN_PROGRESS  // Agent przypisany, pracuje
  CLOSED       // Rozwiązany
}
```

### 4.3 Seed Data (Categories, Subcategories, Users, Assignments)

```typescript
// Domyślne hasło dla wszystkich nowych użytkowników
const DEFAULT_PASSWORD = 'Start!125' // bcrypt hashed w seedzie

// Kategorie z podkategoriami
const categoriesWithSubcategories = [
  {
    name: 'Hardware',
    description: 'Problemy sprzętowe',
    subcategories: ['Komputer/Laptop', 'Drukarka', 'Monitor', 'Akcesoria (mysz, klawiatura)', 'Inne']
  },
  {
    name: 'Software',
    description: 'Problemy z oprogramowaniem',
    subcategories: ['Instalacja programu', 'Problem z aplikacją', 'Licencje', 'Aktualizacje', 'Inne']
  },
  {
    name: 'Network',
    description: 'Problemy z siecią',
    subcategories: ['Brak internetu', 'Wolne WiFi', 'VPN', 'Dostęp do serwera', 'Inne']
  },
  {
    name: 'Account & Access',
    description: 'Dostępy i konta',
    subcategories: ['Reset hasła', 'Dostęp do systemu', 'Uprawnienia', 'Konto email', 'Inne']
  },
  {
    name: 'Other',
    description: 'Pozostałe problemy',
    subcategories: ['Inne problemy']
  }
]

// Przykładowi użytkownicy (wszyscy z hasłem Start!125)
const users = [
  { 
    email: 'jan.kowalski@firma.pl', 
    name: 'Jan Kowalski', 
    role: 'AGENT',
    password: DEFAULT_PASSWORD, // hashed
    passwordResetRequired: true 
  },
  { 
    email: 'anna.nowak@firma.pl', 
    name: 'Anna Nowak', 
    role: 'AGENT',
    password: DEFAULT_PASSWORD,
    passwordResetRequired: true 
  },
  { 
    email: 'user@firma.pl', 
    name: 'Testowy User', 
    role: 'USER',
    password: DEFAULT_PASSWORD,
    passwordResetRequired: true 
  }
]

// Przypisanie agentów do kategorii
const agentCategoryAssignments = [
  { agent: 'jan.kowalski@firma.pl', categories: ['Hardware', 'Network'] },
  { agent: 'anna.nowak@firma.pl', categories: ['Software', 'Account & Access', 'Other'] }
]
```

**Rezultat:**
- Wszyscy użytkownicy mają hasło: `Start!125`
- Przy pierwszym logowaniu muszą zmienić hasło
- Jan Kowalski (Agent) widzi tickety: Hardware (wszystkie podkategorie), Network (wszystkie podkategorie)
- Anna Nowak (Agent) widzi tickety: Software, Account & Access, Other (wszystkie podkategorie)

---

## 🎨 5. User Flows

### 5.1 User Flow - Pierwsze logowanie (zmiana hasła)

```
1. User dostaje konto od admina:
   - Email: jan.nowak@firma.pl
   - Hasło: Start!125

2. User wchodzi na stronę logowania
3. Wpisuje email + hasło Start!125
4. System wykrywa passwordResetRequired = true
5. Przekierowanie → "Musisz zmienić hasło"
6. User wypełnia formularz:
   - Stare hasło: Start!125
   - Nowe hasło: MojeHaslo123!
   - Powtórz hasło: MojeHaslo123!
7. Walidacja (min. 8 znaków, litera, cyfra, znak specjalny)
8. Hasło zmienione, passwordResetRequired = false
9. Przekierowanie → Dashboard
```

### 5.2 User Flow - Tworzenie ticketu

```
1. User loguje się (już po zmianie hasła) → Dashboard
2. Klika "Nowe zgłoszenie" → Formularz
3. Wypełnia krok po kroku:
   
   Step 1: Wybór kategorii
   - Kategoria: "Hardware" (dropdown)
   
   Step 2: Wybór podkategorii (zależny od kategorii)
   - Podkategoria: "Komputer/Laptop" (dropdown)
   
   Step 3: Szczegóły
   - Tytuł: "Komputer nie włącza się" (min. 5 znaków)
   - Opis: "Wciskam power button, nic się nie dzieje. Sprawdziłem kabel zasilający - jest podłączony." (max. 300 znaków, licznik: 112/300)

4. Klika "Wyślij"
5. Przekierowanie → Lista moich ticketów
6. Widzi ticket z statusem "Oczekuje" (OPEN)
```

### 5.3 Agent Flow - Przypisywanie ticketu

```
1. Agent Jan Kowalski loguje się → Dashboard agenta
   (Jan ma dostęp do: Hardware, Network)

2. Widzi listę ticketów TYLKO Z JEGO KATEGORII:
   - [OPEN] "Komputer nie włącza się" - User123 - Hardware ✅
   - [OPEN] "Wolne WiFi" - User456 - Network ✅
   
   NIE WIDZI:
   - [OPEN] "Brak dostępu do SharePoint" - Account & Access ❌ (to dla Anny)

3. Klika "Weź ticket" przy pierwszym (Hardware)
4. Ticket zmienia status → IN_PROGRESS
5. Ticket znika z listy innych agentów Hardware/Network (real-time!)
6. Agent widzi ticket w sekcji "Moje tickety"
7. Po naprawie: klika "Zamknij ticket"
8. Status → CLOSED
```

**Równolegle - Agent Anna Nowak:**
```
1. Anna loguje się (ma dostęp do: Software, Account & Access, Other)
2. Widzi:
   - [OPEN] "Brak dostępu do SharePoint" - Account & Access ✅
   
   NIE WIDZI:
   - [OPEN] "Komputer nie włącza się" - Hardware ❌ (to dla Jana)
   - [OPEN] "Wolne WiFi" - Network ❌ (to dla Jana)
```

### 5.4 Real-time Scenario - Dwóch agentów (ta sama kategoria)

```
Scenario: Ticket #123 jest w kategorii "Hardware"
          Agent Jan i Agent Piotr obaj mają dostęp do "Hardware"

Timeline:
10:00 - Agent Jan i Agent Piotr patrzą na listę ticketów
        Obaj widzą: [OPEN] Ticket #123 "Komputer nie włącza się" - Hardware
        
        Agent Anna (tylko Software) NIE widzi tego ticketu w ogóle ❌

10:01 - Agent Jan klika "Weź ticket" na #123
        → Ticket zmienia status: OPEN → IN_PROGRESS
        → assignedTo: Jan

10:01 - Agent Piotr widzi (real-time!):
        → Ticket #123 ZNIKA z jego listy
        → Licznik dostępnych ticketów Hardware: 5 → 4
        
        Agent Anna dalej nic nie widzi (nie ma dostępu do Hardware)

10:05 - Agent Jan klika "Zamknij ticket"
        → Status: IN_PROGRESS → CLOSED

10:05 - User (twórca ticketu) widzi (real-time!):
        → Status zmienił się na "Rozwiązano ✓"
```

### 5.5 Agent może zgłosić ticket

```
1. Agent Jan (specjalista Hardware/Network) ma problem z oprogramowaniem
2. Klika "Nowe zgłoszenie"
3. Wypełnia:
   - Kategoria: Software ← wybiera kategorię spoza swojej specjalizacji
   - Podkategoria: Problem z aplikacją
   - Tytuł: "Excel się crashuje"
   - Opis: "Przy otwieraniu dużych plików (>10MB) Excel zawiesza się i trzeba go zamknąć przez Task Manager." (max 300 znaków)
4. Ticket trafia do agentów Software (Anna Nowak)
5. Jan NIE widzi tego ticketu na swojej liście (to Software, nie jego kategoria)
6. Anna widzi i może go obsłużyć
```

### 5.6 Admin resetuje hasło użytkownika

```
Scenario: User zapomniał hasła

1. User kontaktuje się z adminem (email, telefon)
2. Admin otwiera bazę danych lub pgAdmin (Supabase)
3. Admin wykonuje SQL:
   UPDATE "User" 
   SET password = [bcrypt hash of 'Start!125'],
       passwordResetRequired = true
   WHERE email = 'user@firma.pl';

4. Admin informuje usera: "Hasło zresetowane do Start!125"
5. User loguje się z Start!125
6. System wymusza zmianę hasła (flow 5.1)
```

---

## 📅 6. Timeline i Milestones

**Total:** 4 tygodnie × 15 godzin = **60 godzin**

### TYDZIEŃ 1: Fundament (15h)
**Milestone:** Logowanie + wymuszenie zmiany hasła + struktura bazy

**Zadania:**
- [3h] Setup Next.js, Tailwind, shadcn/ui, TypeScript
- [2h] Supabase: projekt, PostgreSQL, Prisma schema (User, Category, Subcategory, AgentCategory, Ticket)
- [2h] Prisma setup, migracje, seed (kategorie, podkategorie, użytkownicy, przypisania)
- [1h] Layout aplikacji (navbar, sidebar)
- [3h] NextAuth.js v5 setup (bez rejestracji)
- [2h] Logowanie UI
- [2h] Middleware - ochrona route'ów + sprawdzenie passwordResetRequired

**Deliverable:**
- ✅ Możliwość logowania (email + hasło)
- ✅ Dashboard przekierowuje w zależności od roli
- ✅ W bazie: kategorie, podkategorie, użytkownicy testowi (hasło: Start!125)
- ✅ W bazie: przypisania Agent ↔ Category

---

### TYDZIEŃ 2: Zmiana hasła + CRUD Ticketów (15h)
**Milestone:** Wymuszenie zmiany hasła + tworzenie ticketów

**Zadania:**
- [2h] Formularz zmiany hasła + walidacja (min. 8 znaków, siła hasła)
- [1h] Server Action: zmiana hasła + update passwordResetRequired
- [1h] Middleware: przekierowanie jeśli passwordResetRequired = true
- [4h] Formularz tworzenia ticketu (kategoria → podkategoria → tytuł + opis)
  - Dropdown zależny (subcategories filtrowane po categoryId)
  - Licznik znaków opisu (max 300)
  - Walidacja Zod (tytuł min. 5, opis max 300)
- [2h] Server Action: create ticket
- [3h] Lista ticketów - widok User (tylko swoje)
- [2h] Widok szczegółów ticketu

**Deliverable:**
- ✅ Wymuszenie zmiany hasła przy pierwszym logowaniu
- ✅ User może zmienić hasło
- ✅ User tworzy tickety (kategoria + podkategoria + tytuł + opis max 300)
- ✅ User widzi swoje tickety

---

### TYDZIEŃ 3: Widok Agenta + Real-time (15h)
**Milestone:** Agent widzi tylko swoje kategorie + real-time działa

**Zadania:**
- [3h] Lista ticketów - widok Agent (tylko moje kategorie)
  - Query z JOIN: Ticket → Subcategory → Category → AgentCategory
  - Filtrowanie po userId agenta
- [2h] Agent może tworzyć tickety (ten sam formularz co User)
- [2h] Supabase Realtime: włączenie replication, setup
- [2h] Client: Supabase client setup
- [2h] Hook: useRealtimeTickets() + filtrowanie po kategoriach agenta
- [2h] Przypisywanie ticketu - UI + Server Action
- [2h] Real-time update: ticket znika z listy gdy inny weźmie

**Deliverable:**
- ✅ Agent widzi tylko tickety Z KATEGORII DO KTÓRYCH MA DOSTĘP
- ✅ Agent NIE widzi ticketów z innych kategorii
- ✅ Agent może tworzyć tickety
- ✅ Real-time działa z filtrowaniem po kategoriach
- ✅ Agent może wziąć ticket (przypisanie)

---

### TYDZIEŃ 4: Zmiana statusu + Polish + Deployment (15h)
**Milestone:** Pełny cykl życia ticketu + aplikacja online

**Zadania:**
- [2h] Zmiana statusu ticketu (In Progress → Closed) + UI
- [2h] Real-time update statusu dla User'a
- [1h] Seedy testowe (użytkownicy, tickety przykładowe)
- [2h] UI/UX improvements (loading states, transitions, toasty)
- [2h] Error handling (try-catch, error boundaries)
- [2h] Responsive design (mobile-friendly)
- [2h] Deployment Vercel + Supabase production
- [2h] Testing z prawdziwymi użytkownikami (dział IT)

**Deliverable:**
- ✅ Pełny cykl: User tworzy → Agent bierze → Agent zamyka → User widzi (real-time)
- ✅ Aplikacja online (Vercel)
- ✅ Przetestowana z działu IT
- ✅ README z instrukcjami (jak dodać nowego usera, jak zmienić rolę na Agent)
- ✅ Gotowa do wdrożenia produkcyjnego

---

## 🎯 7. Success Metrics

### 7.1 Metryki techniczne
- ✅ Real-time latency < 1 sekunda
- ✅ Zero duplikacji pracy (ten sam ticket przypisany 2x)
- ✅ Aplikacja działa na mobile (responsive)
- ✅ Zero błędów krytycznych w produkcji

### 7.2 Metryki biznesowe (post-launch)
- 🎯 Min. 5 użytkowników z działu używa aktywnie
- 🎯 Min. 20 ticketów zgłoszonych w pierwszym tygodniu
- 🎯 Avg. czas przypisania ticketu < 30 min
- 🎯 Użytkownicy preferują TickFlow vs email (survey)

### 7.3 Metryki edukacyjne (developer)
- ✅ Zrozumienie Next.js App Router
- ✅ Implementacja NextAuth.js
- ✅ Wdrożenie Real-time features
- ✅ Praca z Prisma ORM
- ✅ Deployment aplikacji Next.js

---

## 🚧 8. Ryzyka i mitigation

### 8.1 Ryzyko: Scope creep
**Prawdopodobieństwo:** Wysokie  
**Impact:** Wysoki (nie skończysz w 4 tygodnie)

**Mitigation:**
- ✅ Trzymaj się listy MUST HAVE
- ✅ Zapisuj pomysły do backlog (Faza 2)
- ✅ Co tydzień review: "czy to jest absolutnie potrzebne w MVP?"

### 8.2 Ryzyko: Real-time nie zadziała
**Prawdopodobieństwo:** Średnie  
**Impact:** Krytyczny

**Mitigation:**
- ✅ Zrób proof of concept w tydzień 1 (prosty przykład)
- ✅ Fallback: polling co 5s (brzydkie ale działa)
- ✅ Supabase ma świetną dokumentację + community

### 8.3 Ryzyko: Brak czasu (15h/tydzień może nie wystarczyć)
**Prawdopodobieństwo:** Średnie  
**Impact:** Wysoki

**Mitigation:**
- ✅ Użyj gotowych komponentów (shadcn/ui)
- ✅ Nie pisz custom CSS - tylko Tailwind
- ✅ Kopiuj przykłady z dokumentacji Next.js
- ✅ Jeśli tydzień 1-2 zajmuje więcej, upraszczaj dalej

### 8.4 Ryzyko: Next.js App Router jest nowy (learning curve)
**Prawdopodobieństwo:** Wysokie  
**Impact:** Średni

**Mitigation:**
- ✅ Przejrzyj oficjalne tutoriale Next.js (2-3h przed startem)
- ✅ Używaj Server Actions zamiast API routes (prostsze)
- ✅ Claude/Cursor pomogą z przykładami

---

## 📚 9. Resources i Dependencies

### 9.1 Wymagane konta (darmowe)
- [x] Supabase account
- [x] Vercel account
- [x] GitHub account (dla deploymentu)
- [x] Claude API access (już masz)

### 9.2 Dokumentacja

📖 **Szczegóły techniczne (dependencies, setup, folder structure):**  
Zobacz `.ai/tech-stack.md`

---

## 🎯 10. Definicja "Done"

### Aplikacja jest gotowa gdy:

#### ✅ Funkcjonalnie:
- [ ] User może się zalogować (email + hasło)
- [ ] Przy pierwszym logowaniu (hasło Start!125) system wymusza zmianę hasła
- [ ] User może stworzyć ticket (kategoria + podkategoria + tytuł + opis max 300 znaków)
- [ ] User widzi swoje tickety i ich status real-time
- [ ] Agent może stworzyć ticket (w dowolnej kategorii + podkategorii)
- [ ] Agent widzi otwarte tickety TYLKO Z KATEGORII DO KTÓRYCH MA DOSTĘP
- [ ] Agent NIE widzi ticketów z innych kategorii (nawet w bazie danych)
- [ ] Agent może przypisać ticket do siebie (tylko z jego kategorii)
- [ ] Ticket znika z listy innych agentów (tej kategorii) natychmiast (real-time)
- [ ] Agent może zamknąć ticket
- [ ] User widzi że jego ticket został zamknięty (real-time)
- [ ] Admin może zresetować hasło użytkownika (ręcznie w bazie SQL)

#### ✅ Technicznie:
- [ ] Zero błędów w konsoli
- [ ] Działa na Chrome, Firefox, Edge
- [ ] Responsywne na mobile (min. 375px szerokości)
- [ ] Deployment na Vercel - działa
- [ ] Database na Supabase - działa
- [ ] Real-time działa z <1s latency

#### ✅ Dokumentacja:
- [ ] README z instrukcją uruchomienia lokalnie
- [ ] README z credentials testowych użytkowników (wszyscy: Start!125)
- [ ] README z instrukcją jak dodać nowego użytkownika (SQL + bcrypt hash)
- [ ] README z instrukcją jak zmienić rolę USER → AGENT
- [ ] README z instrukcją jak przypisać agenta do kategorii
- [ ] README z instrukcją jak zresetować hasło (SQL)
- [ ] Komentarze w kluczowych miejscach kodu
- [ ] .env.example z wyjaśnieniem zmiennych

---

## 🚀 11. Post-MVP Roadmap (Faza 2)

Po ukończeniu MVP i kursie, możliwe rozszerzenia:

### Phase 2 (po kursie):
- Role: Manager (przegląd statystyk), Admin (zarządzanie użytkownikami)
- Dynamiczne kategorie/podkategorie przez UI
- Komentarze do ticketów (komunikacja User ↔ Agent)
- Załączniki (screenshots problemów)

### Phase 3 (długoterminowe):
- AI sugestie kategorii (Claude API)
- Email notifications (Resend)
- Dashboard ze statystykami
- Logi audytowe
- Reset hasła przez email
- SLA tracking (tickety muszą być rozwiązane w X godzin)

---

## 📝 12. Notatki developerskie

📖 **Decyzje architektoniczne, environment variables, folder structure:**  
Zobacz `.ai/tech-stack.md`

---

## ✅ 13. Checklist przed startem

Przed rozpoczęciem kodowania upewnij się że:

- [ ] Masz konto Supabase (darmowe)
- [ ] Utworzyłeś projekt w Supabase
- [ ] Masz DATABASE_URL z Supabase
- [ ] Masz ANON_KEY i SERVICE_ROLE_KEY
- [ ] Zainstalowałeś wszystkie dependencies (`npm install`)
- [ ] Wygenerowałeś NEXTAUTH_SECRET (`openssl rand -base64 32`)
- [ ] Utworzyłeś `.env.local` z wszystkimi zmiennymi
- [ ] Przeczytałeś Next.js App Router basics (2-3h)
- [ ] Zrobiłeś `npx prisma db push` (pierwsza migracja)
- [ ] Uruchomiłeś seed (`npx prisma db seed`) - tworzy kategorie, podkategorie, użytkowników
- [ ] Aplikacja odpala się lokalnie (`npm run dev`)
- [ ] Możesz się zalogować jako user@firma.pl / Start!125
- [ ] Po zalogowaniu system wymusza zmianę hasła

---

## 🎓 14. Learning Goals

### Główne cele edukacyjne:

1. **Next.js App Router** ⭐⭐⭐
   - Server Components vs Client Components
   - Server Actions (mutacje danych)
   - Routing (parallel routes, route groups)
   - Middleware dla auth

2. **NextAuth.js** ⭐⭐⭐
   - Credentials provider
   - Session management
   - Protected routes
   - Role-based access

3. **Real-time** ⭐⭐⭐
   - Supabase Realtime setup
   - PostgreSQL Replication
   - WebSocket connection w React
   - Cleanup i unsubscribe

4. **Prisma** ⭐⭐
   - Schema definition
   - Migrations
   - Relations (1-to-many)
   - Seeding

5. **TypeScript** ⭐
   - Type safety z Prisma
   - Zod validation
   - Type inference

---

## 📞 15. Support i Resources

### Gdy utkniesz:
1. **Dokumentacja** (zawsze pierwsza)
2. **Claude** (masz dostęp do API)
3. **Cursor** (AI pair programming)
4. **Stack Overflow** (dla specific errors)
5. **Next.js Discord** (community)

### Weekly Check-in (każdy weekend):
- ✅ Czy jesteś zgodnie z planem?
- ✅ Co poszło dobrze?
- ✅ Co było trudniejsze niż myślałeś?
- ✅ Czy trzeba coś wyciąć z scope?

---

## 🎉 Podsumowanie

**To jest ambitny ale realny projekt na 4 tygodnie.**

**Klucz do sukcesu:**
1. 🎯 **Trzymaj się MVP** - nie dodawaj features!
2. ⚡ **Użyj gotowych rozwiązań** - shadcn/ui, Supabase
3. 📚 **Naucz się przed, nie podczas** - przeczytaj docs Next.js
4. 🧪 **Testuj wcześnie** - real-time w tydzień 1 (proof of concept)
5. 💪 **Konsekwencja** - 15h/tydzień bez wyjątków

**Powodzenia Marcin! 🚀**

---

*Dokument żywy - aktualizuj w trakcie projektu.*

