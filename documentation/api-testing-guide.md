# 🧪 Przewodnik Testowania API - TickFlow MVP

**Data utworzenia:** 13 października 2025  
**Wersja:** 1.0  
**Status:** ✅ Gotowe do testowania

---

## 📋 Spis treści

1. [Przygotowanie do testów](#przygotowanie-do-testów)
2. [Testowe konta](#testowe-konta)
3. [Scenariusze testowe](#scenariusze-testowe)
4. [Endpointy API](#endpointy-api)
5. [Przykłady żądań](#przykłady-żądań)

---

## 🚀 Przygotowanie do testów

### 1. Uruchomienie środowiska

```bash
# Uruchom serwer deweloperski
npm run dev

# W osobnym terminalu - seed użytkowników (jeśli nie było)
npm run seed:users

# Seed kategorii (jeśli nie było)
npm run seed:categories
```

### 2. Narzędzia testowe

Możesz użyć:
- **Thunder Client** (rozszerzenie VS Code)
- **Postman**
- **curl** (terminal)
- **Insomnia**

### 3. Base URL

```
http://localhost:3000/api
```

---

## 👥 Testowe konta

### Agenci (AGENT role)

| Email | Hasło | Przypisane kategorie |
|-------|-------|---------------------|
| `admin@tickflow.com` | `Admin123!@#` | Wszystkie (5) |
| `agent@tickflow.com` | `Agent123!@#` | Hardware, Software |
| `agent2@tickflow.com` | `Agent2123!@#` | *Brak (do dodania ręcznie)* |

### Użytkownicy (USER role)

| Email | Hasło | Uwagi |
|-------|-------|-------|
| `user@tickflow.com` | `User123!@#` | Standardowy użytkownik |
| `user2@tickflow.com` | `User2123!@#` | Dodatkowy użytkownik do testów |
| `newuser@tickflow.com` | `TempPass123!` | Wymaga zmiany hasła |

---

## 🧪 Scenariusze testowe

### 📝 Scenariusz 1: Użytkownik tworzy zgłoszenie

**Cel:** Sprawdzenie pełnego flow od logowania do utworzenia ticketu

**Kroki:**

1. **Login jako USER**
   ```http
   POST /api/auth/login
   {
     "email": "user@tickflow.com",
     "password": "User123!@#"
   }
   ```
   → Zapisz token z response (w cookie automatycznie)

2. **Pobierz kategorie**
   ```http
   GET /api/categories?includeSubcategories=true
   ```
   → Zapisz `subcategoryId` (np. z kategorii Hardware)

3. **Utwórz ticket**
   ```http
   POST /api/tickets
   {
     "title": "Nie działa drukarka",
     "description": "Drukarka HP w pokoju 204 nie drukuje. Wyświetla błąd E03.",
     "subcategoryId": "<subcategoryId z kroku 2>"
   }
   ```
   → Zapisz `ticketId` z response

4. **Sprawdź swoje tickety**
   ```http
   GET /api/tickets
   ```
   → Powinien zawierać utworzony ticket

5. **Sprawdź szczegóły ticketu**
   ```http
   GET /api/tickets/<ticketId>
   ```

**Oczekiwany rezultat:**
- ✅ Ticket utworzony ze statusem `OPEN`
- ✅ `created_by_id` = ID użytkownika
- ✅ `assigned_to_id` = `null`

---

### 🎯 Scenariusz 2: Agent przypisuje i rozwiązuje ticket

**Cel:** Sprawdzenie flow agenta

**Kroki:**

1. **Login jako AGENT**
   ```http
   POST /api/auth/login
   {
     "email": "agent@tickflow.com",
     "password": "Agent123!@#"
   }
   ```

2. **Sprawdź swoje kategorie**
   ```http
   GET /api/agent-categories/me
   ```
   → Powinien zwrócić Hardware i Software

3. **Pobierz dostępne tickety**
   ```http
   GET /api/tickets?status=OPEN
   ```
   → Powinien zawierać tickety z kategorii Hardware/Software

4. **Przypisz ticket do siebie**
   ```http
   POST /api/tickets/<ticketId>/assign
   ```
   → Status powinien zmienić się na `IN_PROGRESS`

5. **Sprawdź tylko swoje tickety**
   ```http
   GET /api/tickets?assignedToMe=true
   ```

6. **Zmień status na RESOLVED**
   ```http
   PATCH /api/tickets/<ticketId>/status
   {
     "status": "RESOLVED"
   }
   ```

7. **Zamknij ticket**
   ```http
   PATCH /api/tickets/<ticketId>/status
   {
     "status": "CLOSED"
   }
   ```

**Oczekiwany rezultat:**
- ✅ Ticket przypisany do agenta
- ✅ Status zmieniony: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- ✅ Real-time update (jeśli masz otwartą stronę `/tickets`)

---

### 🔒 Scenariusz 3: Testy bezpieczeństwa

**Cel:** Weryfikacja role-based access control

**Kroki:**

1. **USER próbuje dostać się do endpointu agenta**
   ```http
   # Login jako user@tickflow.com
   GET /api/agent-categories/me
   ```
   **Oczekiwany rezultat:** ❌ 403 Forbidden

2. **USER próbuje zobaczyć ticket innego użytkownika**
   ```http
   # Login jako user@tickflow.com
   # Utwórz ticket jako user2@tickflow.com
   # Spróbuj pobrać jako user@tickflow.com
   GET /api/tickets/<ticketId drugiego usera>
   ```
   **Oczekiwany rezultat:** ❌ 404 Not Found (RLS ukrywa)

3. **AGENT próbuje przypisać ticket spoza swoich kategorii**
   ```http
   # Login jako agent@tickflow.com (ma tylko Hardware/Software)
   # Utwórz ticket z kategorii Network
   POST /api/tickets/<networkTicketId>/assign
   ```
   **Oczekiwany rezultat:** ❌ 403 Forbidden

4. **Próba logowania bez credentials**
   ```http
   GET /api/tickets
   # Bez cookie auth-token
   ```
   **Oczekiwany rezultat:** ❌ 401 Unauthorized

---

### 🔄 Scenariusz 4: Real-time updates

**Cel:** Sprawdzenie Supabase Realtime

**Kroki:**

1. **Otwórz dwie karty przeglądarki:**
   - Karta 1: Zaloguj jako `user@tickflow.com` → Przejdź do `/tickets`
   - Karta 2: Zaloguj jako `agent@tickflow.com` → Przejdź do `/tickets`

2. **W Karcie 1 (USER):**
   - Kliknij "Nowe zgłoszenie"
   - Wypełnij formularz
   - Kliknij "Utwórz zgłoszenie"

3. **Obserwuj Kartę 2 (AGENT):**
   - Lista powinna automatycznie odświeżyć się
   - Nowy ticket powinien pojawić się bez ręcznego odświeżania

4. **W Karcie 2 (AGENT):**
   - Kliknij "Przypisz do mnie" na tickecie

5. **Obserwuj Kartę 1 (USER):**
   - Status ticketu powinien zmienić się na "W trakcie"
   - Powinien pojawić się agent w "Przypisane do"

**Oczekiwany rezultat:**
- ✅ Zmiany widoczne w czasie rzeczywistym
- ✅ Wskaźnik "Real-time aktywny" (zielona kropka) w headerze
- ✅ Brak opóźnień > 1s

---

## 📡 Endpointy API

### Authentication

| Endpoint | Metoda | Auth | Opis |
|----------|--------|------|------|
| `/api/auth/login` | POST | ❌ | Logowanie |
| `/api/auth/logout` | POST | ✅ | Wylogowanie |
| `/api/auth/session` | GET | ✅ | Pobierz sesję |
| `/api/auth/change-password` | POST | ✅ | Zmień hasło |

### Tickets

| Endpoint | Metoda | Auth | Opis |
|----------|--------|------|------|
| `/api/tickets` | GET | ✅ | Lista ticketów (role-based) |
| `/api/tickets` | POST | ✅ | Utwórz ticket |
| `/api/tickets/:id` | GET | ✅ | Szczegóły ticketu |
| `/api/tickets/:id/assign` | POST | ✅ AGENT | Przypisz do siebie |
| `/api/tickets/:id/status` | PATCH | ✅ AGENT | Zmień status |

### Categories

| Endpoint | Metoda | Auth | Opis |
|----------|--------|------|------|
| `/api/categories` | GET | ✅ | Lista kategorii |
| `/api/categories/:id` | GET | ✅ | Szczegóły kategorii |

### Agent Categories

| Endpoint | Metoda | Auth | Opis |
|----------|--------|------|------|
| `/api/agent-categories/me` | GET | ✅ AGENT | Moje kategorie |
| `/api/agent-categories/:id/agents` | GET | ✅ AGENT | Agenci w kategorii |

---

## 📝 Przykłady żądań (curl)

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@tickflow.com",
    "password": "User123!@#"
  }' \
  -c cookies.txt
```

### 2. Pobierz kategorie

```bash
curl http://localhost:3000/api/categories \
  -b cookies.txt
```

### 3. Utwórz ticket

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Problem z komputerem",
    "description": "Komputer nie włącza się po wczorajszej aktualizacji Windows",
    "subcategoryId": "UUID-SUBCATEGORY"
  }'
```

### 4. Pobierz tickety z filtrem

```bash
# Wszystkie tickety
curl "http://localhost:3000/api/tickets" -b cookies.txt

# Tylko otwarte
curl "http://localhost:3000/api/tickets?status=OPEN" -b cookies.txt

# Przypisane do mnie (AGENT)
curl "http://localhost:3000/api/tickets?assignedToMe=true" -b cookies.txt

# Z paginacją
curl "http://localhost:3000/api/tickets?page=1&limit=10" -b cookies.txt
```

### 5. Przypisz ticket (AGENT only)

```bash
curl -X POST http://localhost:3000/api/tickets/TICKET_ID/assign \
  -b cookies.txt
```

### 6. Zmień status (AGENT only)

```bash
curl -X PATCH http://localhost:3000/api/tickets/TICKET_ID/status \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "RESOLVED"
  }'
```

---

## ✅ Checklist testów

### Auth
- [ ] Login z prawidłowymi credentials
- [ ] Login z błędnymi credentials (401)
- [ ] Logout
- [ ] Sprawdzenie sesji
- [ ] Zmiana hasła
- [ ] Force password change flow

### Tickets (USER)
- [ ] Pobierz własne tickety
- [ ] Utwórz nowy ticket
- [ ] Zobacz szczegóły ticketu
- [ ] Nie może zobaczyć ticketu innego usera (404)
- [ ] Nie może przypisać ticketu (403)

### Tickets (AGENT)
- [ ] Pobierz tickety z przypisanych kategorii
- [ ] Nie widzi ticketów spoza swoich kategorii
- [ ] Przypisz ticket do siebie
- [ ] Zmień status ticketu
- [ ] Nie może zmienić statusu ticketu innego agenta (403)
- [ ] Filtr "assignedToMe"

### Categories
- [ ] Pobierz wszystkie kategorie
- [ ] Pobierz kategorię z podkategoriami
- [ ] Pobierz kategorię bez podkategorii

### Agent Categories
- [ ] Pobierz swoje kategorie (AGENT)
- [ ] USER nie ma dostępu (403)
- [ ] Pobierz agentów w kategorii

### Real-time
- [ ] Nowy ticket pojawia się automatycznie
- [ ] Przypisanie ticketu aktualizuje listę
- [ ] Zmiana statusu aktualizuje listę
- [ ] Wskaźnik "Real-time aktywny" działa

### Security
- [ ] Brak tokenu → 401
- [ ] USER nie ma dostępu do endpointów AGENT → 403
- [ ] RLS ukrywa tickety innych użytkowników
- [ ] Rate limiting na /login (po 5 próbach)

---

## 🐛 Znane problemy i rozwiązania

### Problem: 401 Unauthorized mimo poprawnego logowania
**Rozwiązanie:** Sprawdź czy cookies są włączone w kliencie testowym

### Problem: Real-time nie działa
**Rozwiązanie:** 
1. Sprawdź `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Sprawdź console przeglądarki dla błędów WebSocket
3. Upewnij się że Supabase Realtime jest włączony w projekcie

### Problem: 403 przy przypisywaniu ticketu
**Rozwiązanie:** Sprawdź czy agent ma przypisaną kategorię ticketu w `agent_categories`

---

## 📊 Metryki sukcesu

✅ **Wszystkie endpointy odpowiadają < 500ms**  
✅ **Real-time updates < 1s opóźnienia**  
✅ **RLS policies działają poprawnie**  
✅ **Brak błędów 500 przy normalnym użytkowaniu**  
✅ **Frontend wyświetla dane poprawnie**

---

## 🚀 Co dalej?

Po pomyślnych testach:
1. Deploy na staging (Vercel + Supabase Production)
2. Testy end-to-end (Playwright/Cypress)
3. Load testing (k6 / Artillery)
4. Security audit
5. Production deployment

---

**Ostatnia aktualizacja:** 13 października 2025  
**Autor:** AI Assistant  
**Status:** ✅ Gotowe do użycia

