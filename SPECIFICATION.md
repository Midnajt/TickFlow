# 🎯 TickFlow – Specyfikacja Aplikacji

---

## 📋 Cel Projektu

Aplikacja do tworzenia i zarządzania ticketami wewnątrz firmy, z możliwością skalowania na wiele działów i obsługą różnych ról użytkowników.

---

## 🛠️ Stack Technologiczny

| Warstwa | Technologia |
|---------|-------------|
| **Frontend** | Next.js + TailwindCSS + TypeScript |
| **Backend** | Next.js API routes (lub osobny Node.js backend) |
| **Baza danych** | MongoDB + Mongoose (ORM) |
| **Realtime** | WebSockets (socket.io) |
| **Autoryzacja** | JWT lub NextAuth (z RBAC) |

---

## 👥 Role i Uprawnienia

### 👤 User (Użytkownik)

- ✅ Loguje się przez e-mail + hasło
- ✅ Może stworzyć ticket (po wyborze kategorii i podkategorii)
- ✅ Może przeglądać swoje tickety (w trakcie realizacji i zakończone)
- ✅ Może resetować hasło

---

### 🎧 Agent (Wsparcie)

- ✅ Widzi tickety tylko w przypisanych kategoriach/podkategoriach
- ✅ Może przypisać do siebie ticket (wtedy znika on z listy innych agentów → **real-time update**)
- ✅ Może zmieniać status ticketu (np. „w realizacji", „zakończony")
- ✅ Może dodawać komentarze do ticketów
- 🔼 Ma wszystkie uprawnienia **Usera**

---

### 👔 Manager (Kierownik)

- ✅ Może być przypisany do **wielu kategorii**
- ✅ W ramach przypisanych kategorii może tworzyć **podkategorie**
- ✅ Może przypisywać **agentów do podkategorii**
- ✅ Może tworzyć nowych **Userów** i **Agentów**
  - Login = e-mail
  - Hasło nadawane przez managera
  - Użytkownik może je później zresetować
- 📊 Może przeglądać **statystyki** dla swoich kategorii:
  - Ilu ticketów zrealizował każdy agent
  - Średni czas realizacji ticketów
- 🔼 Ma wszystkie uprawnienia **Agenta**

---

### 👑 Admin (Administrator)

- ⚡ Ma **pełny dostęp** do systemu
- ✅ Może tworzyć **Managerów**
- ✅ Może tworzyć **Kategorie** i przypisywać do nich Managerów
- ✅ Może tworzyć także podkategorie (ale zwykle robi to Manager)
- 📊 Widzi **rozszerzone statystyki**:
  - Statystyki agentów (jak u Managera)
  - Dodatkowo: ilu ticketów napisał każdy użytkownik
- 🔍 Ma dostęp do **logów**:
  - **Audyt operacji użytkowników** (logowanie, reset hasła, IP, stworzenie/przypisanie/zamknięcie ticketu, stworzenie kategorii/podkategorii, tworzenie użytkowników itp.)
  - **Logi systemowe** (błędy aplikacji)

---

## ⚙️ Funkcjonalności Kluczowe

1. 🔐 **Autoryzacja i role** (RBAC)
2. 🎫 **Tworzenie ticketów** z wyborem kategorii i podkategorii
3. 👤 **Panel użytkownika** – lista jego ticketów
4. 🎧 **Panel agenta** – lista ticketów do realizacji w przypisanych podkategoriach
5. 👔 **Panel managera** – zarządzanie podkategoriami, agentami i userami, statystyki
6. 👑 **Panel admina** – zarządzanie kategoriami i managerami, logi systemowe, pełne statystyki
7. ⚡ **Realtime tickets** – aktualizacja listy ticketów w czasie rzeczywistym przez WebSocket
8. 📝 **System logów** – audyt + błędy systemowe
9. 🔑 **Reset hasła** (self-service dla wszystkich użytkowników)

---

## 📂 Hierarchia Kategorii

```
👑 Admin
  └── 📁 Kategorie (np. IT, HR, Finansy)
       └── 👔 Manager (przypisany do kategorii)
            └── 📋 Podkategorie (tylko w przypisanych kategoriach)
```

**Zasady:**
- Admin tworzy **Kategorie** (np. IT, HR, Finansy)
- Manager tworzy **Podkategorie** tylko w przypisanych kategoriach
- Podkategoria zawsze należy do **jednej kategorii**

---

## 📊 Statystyki

### 👔 Manager
- Widzi ile ticketów zrealizował każdy agent w przypisanych kategoriach
- Średni czas realizacji ticketów

### 👑 Admin
- Wszystkie statystyki jak Manager
- **Dodatkowo:** ile ticketów napisał każdy użytkownik

---

## 📝 System Logów

### 🔍 Audyt Działań Użytkowników
- Logowanie
- Reset hasła
- Adres IP
- Stworzenie/przypisanie/zakończenie ticketu
- Utworzenie kategorii/podkategorii
- Stworzenie użytkowników

### ⚠️ Logi Systemowe
- Błędy aplikacji
- Wyjątki
- Problemy wydajnościowe

---
