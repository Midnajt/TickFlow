# ❓ TickFlow Vercel - FAQ & Scenariusze

Odpowiedzi na najczęstsze pytania i rzeczywiste scenariusze wdrażania.

---

## ❓ FAQ

### P: Czy mogę deployować z innej gałęzi niż `main`?

**O:** Tak! Vercel wspiera:
- **`main`** → Production (https://tickflow.vercel.app)
- **Inne gałęzie** → Preview (https://tickflow-my-feature.vercel.app)
- **Pull Requesty** → Automatyczne preview + komentarz w PR

Konfiguracja jest domyślna. Nic nie musisz robić.

```bash
# Feature development
git checkout -b feature/new-dashboard
# ... edytuj kod ...
git push origin feature/new-dashboard

# Vercel automatycznie tworzy preview na: https://tickflow-feature-new-dashboard.vercel.app
# Link pojawi się w GitHub (lub w dashboardzie Vercel)
```

---

### P: Jaka jest maksymalna wielkość aplikacji, którą mogę wdrożyć?

**O:** 
- **Darmowy tier**: Limit 100 deploymentów na miesiąc
- **Rozmiar pliku**: Praktycznie brak limitu (zwykle <500 MB)
- **Build time**: 12 godzin/miesiąc dla ciągłych buildów

Dla MVP - żaden z tych limitów Cię nie dotknie.

---

### P: Czy można wdrożyć do niestandardowej domeny?

**O:** Tak! Kroki:

1. W Vercel: `Project Settings` → `Domains`
2. Kliknij: `Add`
3. Wpisz: `tickflow.twojafirma.pl`
4. Vercel pokaże instrukcje DNS
5. Zmień DNS w dostawcy domeny
6. Czekaj ~24h na propagację

Certyfikat SSL będzie wygenerowany automatycznie (Let's Encrypt).

---

### P: Jaki jest czas deploymentu?

**O:** Średnio:
- **Build**: 10-30 sekund
- **Deploy**: 5-10 sekund
- **Razem**: 15-40 sekund

Zależy od rozmiaru projektu i liczby zależności.

---

### P: Czy Real-time (Supabase) działa na Vercel?

**O:** **TAK!** Supabase WebSocket jest niezależny od hostingu. Działa z:
- Vercel ✅
- Any server ✅
- Localhost ✅

Sprawdzenie:
1. W Supabase: Project → `Realtime` → czy jest `Enabled`?
2. Sprawdź zmienne: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. RLS policies muszą być skonfigurowane (są w migracji)

---

### P: Czy CI/CD (GitHub Actions) działa automatycznie?

**O:** **TAK!** Masz już skonfigurowany CI/CD:

```
.github/workflows/
├── github-actions.yml  → Push na main
└── pull-request.yml    → Pull Request
```

Przy każdym push:
1. Linting ✅
2. Testy ✅
3. Build ✅
4. Deploy na Vercel ✅

Nic nie musisz robić - wszystko jest automatyczne.

---

### P: Czy mogę zobaczyć logi produkcyjne?

**O:** Tak! Kilka opcji:

**Logi deploymentu:**
1. Vercel Dashboard → `Deployments`
2. Kliknij deployment
3. `Build Logs` lub `Runtime Logs`

**Logi funkcji (Edge Functions):**
1. `Project Settings` → `Function Logs`

**Błędy aplikacji:**
1. Browser Console (F12)
2. Network Tab (aby sprawdzić API calls)

**Supabase Logs:**
1. Supabase Dashboard → `Logs`
2. Zapytania SQL, błędy RLS, realtime connections

---

### P: Czy mogę cofnąć deployment?

**O:** Tak! 2 sposoby:

**Metoda 1: Redeploy poprzedniej wersji (szybko)**
1. Vercel Dashboard → `Deployments`
2. Znajdź poprzedni, działający deployment
3. Kliknij `...` → `Redeploy`
4. Aplikacja wróci do starej wersji w ~10 sekund

**Metoda 2: Git revert (bardziej profesjonalnie)**
```bash
# Cofnij ostatni commit
git revert HEAD
git push origin main

# Vercel automatycznie wdroży starą wersję
```

---

### P: Ile kosztuje wdrożenie na Vercel?

**O:** 
- **Darmowy tier**: ✅ Wystarczający dla MVP
  - Unlimited deployments
  - Up to 100 Serverless Function Invocations
  - Automatic scaling
  
- **Pro tier**: $20/miesiąc (nie potrzebujesz na MVP)

Baza danych (Supabase) to osobny koszt i jest darmowa do 500 MB na free tier.

---

### P: Co się stanie jeśli repository będzie prywatny?

**O:** Nic! Vercel wspiera prywatne repozytoria. Musisz tylko:
1. Zalogować się na Vercel z kontem GitHub
2. Dać dostęp do repozytoriów
3. Wybrać prywatne `tickflow`

---

### P: Czy mogę mieć staging environment?

**O:** Tak! Możesz mieć oddzielny Vercel project dla staging:

1. Utwórz gałąź: `git checkout -b staging`
2. Utwórz nowy projekt Vercel z tego repo (ale inną gałęzią)
3. Skonfiguruj oddzielne zmienne środowiskowe (np. staging Supabase)
4. Konfiguracja:
   - Production gałąź: `main`
   - Staging gałąź: `staging`

Wówczas:
- Push na `main` → Production
- Push na `staging` → Staging

---

### P: Czy mogę mieć webhooks?

**O:** Tak! Vercel wspiera webhooks dla:
- Deployment started
- Deployment ready
- Deployment error

Konfiguracja: `Project Settings` → `Integrations`

Możesz wysyłać notyfikacje do Slack, Discord itp.

---

## 📊 Scenariusze rzeczywistych deploymentów

### Scenariusz 1: Pierwszy deployment (Production)

```bash
# 1. Przygotowanie
npm run lint
npm run build
npm test

# 2. Commit i push
git add .
git commit -m "feat: initial production deployment"
git push origin main

# 3. Weryfikacja w Vercel
# → Dashboard → Deployments → Czekaj ~30 sekund
# → ✅ Deployment ready

# 4. Testowanie
# → Otwórz https://tickflow.vercel.app
# → Zaloguj się
# → Stwórz ticket
# → Sprawdź real-time

# 5. Success! 🎉
```

---

### Scenariusz 2: Dodanie nowej funkcji (z Preview)

```bash
# 1. Utwórz feature branch
git checkout -b feature/dark-mode

# 2. Edytuj kod
# ... editing ...

# 3. Test lokalnie
npm run dev
# → Testuj na http://localhost:3000

# 4. Commit i push
git add .
git commit -m "feat: add dark mode"
git push origin feature/dark-mode

# 5. Vercel tworzy preview
# → Dashboard → Deployments → https://tickflow-feature-dark-mode.vercel.app
# → Podziel się linkiem do code review

# 6. Po zatwierdzeniu merge do main
git checkout main
git pull origin main
git merge feature/dark-mode
git push origin main

# 7. Vercel deployuje na production
# → https://tickflow.vercel.app zaktualizuje się automatycznie
```

---

### Scenariusz 3: Bug fix na produkcji

```bash
# 1. Problem na produkcji
# → Real-time nie działa

# 2. Debugowanie lokalnie
npm run dev
# → Sprawdzamy real-time

# 3. Znaleźliśmy bug w supabase.ts
# → Naprawiamy

# 4. Test localnie
npm run dev
# → Testujemy fix

# 5. Deploy
git add app/lib/supabase.ts
git commit -m "fix: real-time connection issue"
git push origin main

# 6. Vercel wdroży w ~30 sekund
# → Production zaktualizowana

# 7. Weryfikacja
# → Otwórzhttps://tickflow.vercel.app
# → Sprawdzić czy real-time działa
```

---

### Scenariusz 4: Aktualizacja zmiennych środowiskowych

```bash
# Scenariusz: Potrzebujemy nowy OPENROUTER_API_KEY

# 1. W Vercel:
# → Project Settings → Environment Variables
# → Add New → OPENROUTER_API_KEY → https://openrouter.ai/keys
# → Wklej klucz
# → Save

# 2. Vercel automatycznie restartuje aplikację
# → Deployment nie potrzebny!
# → Ale możesz kliknąć Redeploy jeśli chcesz

# 3. Veryfikacja
# → AI suggestions powinny działać
```

---

### Scenariusz 5: Zdetekciane błędy w buildzie

```bash
# 1. Pushujesz kod
git push origin main

# 2. Vercel próbuje buildować
# → Błąd: "error: Could not find module X"

# 3. Co robić?
# → GitHub Actions też pokazuje błąd
# → Przejdź do repo → Actions → ostatni workflow
# → Sprawdź szczegóły

# 4. Napraw localnie
npm install X  # Zainstaluj brakujący moduł
npm run build  # Sprawdzić czy buduje się
npm test       # Sprawdzić testy

# 5. Commit i push
git add package.json package-lock.json
git commit -m "fix: add missing dependency"
git push origin main

# 6. Vercel spróbuje ponownie
# → Powinno się powiźć

# Tip: Zawsze testuj Build lokalnie: npm run build
```

---

### Scenariusz 6: Performance issue na produkcji

```bash
# 1. Użytkownicy narzekają na wolną stronę

# 2. Sprawdzenie w Vercel Analytics
# → Project → Analytics
# → Sprawdzić response time, Core Web Vitals

# 3. Identyfikacja problemu
# → Okazało się, że Image jest zbyt duży

# 4. Napraw w kodzie
# → Użyj next/image component zamiast <img>
# → Czy może dodaj optimization?

# 5. Deploy
git push origin main

# 6. Monitor po deploymencie
# → Analytics powinny się poprawić w ciągu kilku minut
```

---

### Scenariusz 7: Migracja do nowej domeny

```bash
# 1. Masz nową domenę: tickflow.firma.pl

# 2. W Vercel:
# → Project Settings → Domains
# → Add: tickflow.firma.pl
# → Vercel pokaże rekordy DNS

# 3. W dostawcy domeny:
# → Zmień DNS rekordy
# → Czekaj ~24h na propagację

# 4. Zmień zmienną:
# → Project Settings → Environment Variables
# → Edit: NEXTAUTH_URL
# → New value: https://tickflow.firma.pl
# → Save

# 5. Vercel automatycznie redepoyje
# → Aplikacja będzie dostępna na nowej domenie

# Tip: Zwykle trwa 1-24h zanim nowa domena będzie działać
```

---

## 🔍 Debugging checklist

Jeśli coś nie działa, przejdź po kolei:

- [ ] **Kod lokalnie**
  ```bash
  npm run lint    # czy linting przechodzi?
  npm run build   # czy builds się?
  npm run start   # czy działa produkcyjnie?
  ```

- [ ] **GitHub**
  ```
  → Push na main
  → Actions → Sprawdź workflow
  → Czy testy przeszły?
  ```

- [ ] **Vercel Dashboard**
  ```
  → Deployments → Ostatni deployment
  → Build Logs → czy są błędy?
  → Runtime Logs → czy aplikacja uruchamia się?
  ```

- [ ] **Browser**
  ```
  F12 → Console → czy są błędy JS?
  Network Tab → czy API calls działają?
  ```

- [ ] **Zmienne środowiskowe**
  ```
  Project Settings → Environment Variables
  Czy wszystkie zmienne są ustawione?
  Czy nie brakuje żadnej?
  ```

- [ ] **Supabase**
  ```
  Dashboard → Logs
  Czy database connection działa?
  Czy realtime jest enabled?
  ```

---

## 📞 Gdzie szukać pomocy

| Problem | Gdzie szukać |
|---------|-------------|
| Build fails | Vercel → `Build Logs` lub GitHub Actions |
| Aplikacja ładuje się ale błędy | Browser Console (F12) |
| Real-time nie działa | Supabase → `Logs` i `Realtime settings` |
| Database connection error | Supabase → `Database Logs` |
| Zmienne środowiskowe | Vercel → `Project Settings` → `Environment Variables` |
| Performance | Vercel → `Analytics` |
| Custom domain nie działa | Poczekaj 24h, sprawdź DNS propagation |

---

**Masz pytanie, którego nie ma tutaj? Przeczytaj pełną dokumentację: `docs/vercel-deployment.md`**

🚀 **Happy deploying!**
