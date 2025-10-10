# TickFlow - Dokumentacja

Witaj w dokumentacji projektu TickFlow - systemu zarządzania zgłoszeniami IT z obsługą ról i uwierzytelnianiem.

## 📚 Spis treści

### 🔐 Uwierzytelnianie (Authentication)

#### [Steps 1-3 Summary](./steps-1-3-summary.md) ✨ **NOWE**
Podsumowanie implementacji kroków 1-3 (fundamenty systemu auth).

**Zawiera:**
- Zod schematy walidacji (loginSchema, changePasswordSchema)
- AuthService z 4 metodami (login, logout, changePassword, getSession)
- 4 REST API endpointy (login, logout, change-password, session)
- Konfiguracja JWT i bcrypt
- HttpOnly cookies
- Struktura plików

---

#### [Steps 4-6 Summary](./steps-4-6-summary.md) ✨ **NOWE**
Podsumowanie implementacji kroków 4-6 (security & utilities).

**Zawiera:**
- Rate limiter middleware (5 prób/min)
- Auth utility functions (getAuthToken, requireAuth, withAuth, withRole)
- Dokumentacja środowiska (.env.local)
- Integracja z istniejącymi endpointami
- Security best practices
- Production considerations

---

#### [Steps 7-9 Summary](./steps-7-9-summary.md) ✨
Podsumowanie implementacji kroków 7-9 (testowanie i UI).

**Zawiera:**
- Utworzenie testowych użytkowników (seed script)
- Implementacja strony logowania
- Dashboard z wyświetlaniem zalogowanego użytkownika
- Scenariusze testów manualnych
- Zrzuty ekranu (opis)
- Status implementacji

---

#### [Auth API Documentation](./auth-api-documentation.md)
Pełna dokumentacja REST API dla uwierzytelniania użytkowników.

**Zawiera:**
- Szczegółowy opis wszystkich 4 endpointów auth
- Przykłady request/response dla każdego endpointu
- Kody błędów i ich znaczenie
- Przykłady użycia (JavaScript, TypeScript, curl)
- Best practices i troubleshooting
- Migracja z NextAuth

**Endpointy:**
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/logout` - Wylogowanie
- `POST /api/auth/change-password` - Zmiana hasła
- `GET /api/auth/session` - Pobranie sesji

---

#### [Auth Implementation Summary](./auth-implementation-summary.md)
Podsumowanie implementacji systemu uwierzytelniania.

**Zawiera:**
- Lista zakończonych zadań
- Struktura utworzonych plików
- Użyte technologie
- Funkcje bezpieczeństwa
- Quick start guide
- Następne kroki (testy, deployment)

---

#### [Environment Setup Guide](./env-setup-guide.md)
Przewodnik konfiguracji zmiennych środowiskowych.

**Zawiera:**
- Lista wymaganych zmiennych `.env.local`
- Instrukcje pobrania credentials z Supabase
- Generowanie `JWT_SECRET`
- Best practices bezpieczeństwa
- Konfiguracja dla różnych środowisk (dev/staging/prod)

---

#### [Steps 7-9 Summary](./steps-7-9-summary.md) ✨ **NOWE**
Podsumowanie implementacji kroków 7-9 (testowanie i UI).

**Zawiera:**
- Utworzenie testowych użytkowników (seed script)
- Implementacja strony logowania
- Dashboard z wyświetlaniem zalogowanego użytkownika
- Scenariusze testów manualnych
- Zrzuty ekranu (opis)
- Status implementacji

---

## 🚀 Quick Start

### 1. Konfiguracja środowiska

Przeczytaj: [Environment Setup Guide](./env-setup-guide.md)

```bash
# Upewnij się że .env.local jest skonfigurowany
# JWT_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

### 2. Seed testowych użytkowników

```bash
# Dodaj testowych użytkowników do bazy
npm run seed:users
```

**Testowe konta:**
- `admin@tickflow.com` / `Admin123!@#` (AGENT)
- `agent@tickflow.com` / `Agent123!@#` (AGENT)
- `user@tickflow.com` / `User123!@#` (USER)

### 3. Uruchom aplikację

```bash
# Start dev server
npm run dev

# Otwórz http://localhost:3000
# Zostaniesz przekierowany na /login
# Zaloguj się testowym kontem
```

### 4. Test funkcjonalności

Przeczytaj: [Steps 7-9 Summary](./steps-7-9-summary.md) dla pełnych scenariuszy testowych

---

## 📁 Struktura projektu

```
tickflow/
├── app/
│   ├── api/auth/              # API endpoints
│   │   ├── login/
│   │   ├── logout/
│   │   ├── change-password/
│   │   └── session/
│   └── lib/
│       ├── validators/        # Zod schemas
│       ├── services/          # Business logic
│       ├── middleware/        # Rate limiter, etc.
│       └── utils/             # Auth utilities
│
├── documentation/             # Ta dokumentacja
│   ├── README.md
│   ├── auth-api-documentation.md
│   ├── auth-implementation-summary.md
│   └── env-setup-guide.md
│
├── src/
│   └── types.ts              # TypeScript types & DTOs
│
└── supabase/
    └── migrations/           # Database migrations
```

---

## 🔧 Tech Stack

- **Next.js 15** - App Router, Route Handlers
- **TypeScript 5** - Full type safety
- **Supabase** - Backend database & auth
- **Zod 4** - Runtime validation
- **jose** - JWT signing/verification
- **bcrypt** - Password hashing

---

## 🔐 Bezpieczeństwo

- ✅ HttpOnly cookies (XSS protection)
- ✅ SameSite=Strict (CSRF protection)
- ✅ bcrypt hashing (10 rounds)
- ✅ JWT expiration (7 days)
- ✅ Rate limiting (5 attempts/min)
- ✅ Strong password policy

---

## 📖 Więcej informacji

### Szczegółowa dokumentacja

| Temat | Dokument |
|-------|----------|
| **Steps 1-3 (Fundamenty)** | [steps-1-3-summary.md](./steps-1-3-summary.md) ✨ |
| **Steps 4-6 (Security)** | [steps-4-6-summary.md](./steps-4-6-summary.md) ✨ |
| **Steps 7-9 (Testing & UI)** | [steps-7-9-summary.md](./steps-7-9-summary.md) ✨ |
| **API Reference** | [auth-api-documentation.md](./auth-api-documentation.md) |
| **Setup & Configuration** | [env-setup-guide.md](./env-setup-guide.md) |
| **Implementation Details** | [auth-implementation-summary.md](./auth-implementation-summary.md) |

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

---

## 🐛 Troubleshooting

Najczęstsze problemy i rozwiązania znajdziesz w sekcji **Troubleshooting** w [Auth API Documentation](./auth-api-documentation.md#troubleshooting).

### Quick Fixes

- **Token invalid?** → Sprawdź `JWT_SECRET` w `.env.local`
- **Too many requests?** → Poczekaj 1 minutę
- **Cookie not set?** → Użyj `credentials: 'include'`

---

## 📝 Status projektu

### ✅ Zaimplementowane (MVP 1.0)

- [x] Authentication API (4 endpointy)
- [x] JWT-based sessions (HttpOnly cookies)
- [x] Rate limiting (5 prób/min)
- [x] Password validation (Zod + bcrypt)
- [x] Auth utilities & wrappers
- [x] **Login page** ✨
- [x] **Dashboard (po zalogowaniu)** ✨
- [x] **Logout functionality** ✨
- [x] **Test users seeding** ✨
- [x] Pełna dokumentacja

### 🔜 Planowane

- [ ] Change password page
- [ ] Tickets management (CRUD)
- [ ] Agent dashboard
- [ ] Real-time updates (Supabase)
- [ ] Categories & subcategories
- [ ] Activity history
- [ ] Notifications

---

## 🤝 Contributing

Projekt w fazie MVP - skupiamy się na prostych i szybkich rozwiązaniach.

### Code Style

- TypeScript dla wszystkich plików
- Functional programming patterns
- Server Components where possible
- Zod dla walidacji

### Before committing

```bash
# Lint check
npm run lint

# Build check
npm run build

# Type check
npx tsc --noEmit
```

---

## 📄 License

[Sprawdź plik LICENSE](../LICENSE)

---

**Ostatnia aktualizacja:** 2025-01-10  
**Wersja:** 1.0.0 (MVP)

