# ⚡ TickFlow - Vercel Quick Start Guide

Jeśli już masz konto na Vercel i chcesz szybko wdrożyć aplikację, postępuj zgodnie z tym przewodnikiem.

---

## 🚀 Deploy w 10 minut

### 1️⃣ Przygotowanie (lokalnie)

```bash
# Sprawdź czy wszystko działa
npm run lint
npm run build
npm run start    # Ctrl+C żeby zatrzymać

# Zacommittuj gotowy kod
git add .
git commit -m "deploy: ready for production"
git push origin main
```

### 2️⃣ Zaloguj się do Vercel

Otwórz: `https://vercel.com/dashboard`

Zaloguj się na swoje konto.

### 3️⃣ Utwórz projekt

- Kliknij: `Add New...` → `Project`
- Wybierz: `Import Git Repository`
- Wyszukaj: `tickflow`
- Kliknij: `Import`

### 4️⃣ Ustaw zmienne środowiskowe

Po importzie będziesz na stronie konfiguracji. **Nie klikaj Deploy jeszcze!**

Przejdź do: `Environment Variables`

Dodaj zmienne z Twojego `.env.local`:

```
DATABASE_URL = postgresql://...
NEXTAUTH_URL = https://tickflow.vercel.app
NEXTAUTH_SECRET = (wygeneruj: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
JWT_SECRET = (wygeneruj: openssl rand -base64 32)
NODE_ENV = production
OPENROUTER_API_KEY = sk-or-v1-... (opcjonalnie)
```

**Dla każdej zmiennej:**
- Kliknij: `Add New`
- Name: (nazwa zmiennej)
- Value: (wartość)
- Environments: zaznacz `Production` 
- Save

### 5️⃣ Deploy!

Kliknij: `Deploy`

Czekaj ~30 sekund. Powinieneś zobaczyć ✅ `Deployment ready`.

### 6️⃣ Zastosuj migracje bazy danych

Otwórz: `https://supabase.com/dashboard` → Twój projekt

Przejdź do: `SQL Editor`

Dla każdego pliku w `supabase/migrations/`:
1. Otwórz plik
2. Skopiuj zawartość
3. Wklej w SQL Editor
4. Kliknij: `Run`

### 7️⃣ Testuj!

Otwórz: `https://tickflow.vercel.app`

- [ ] Strona ładuje się
- [ ] Możesz się zalogować
- [ ] Możesz tworzyć ticket
- [ ] Tickety się synchronizują (real-time)

**Gotowe! 🎉**

---

## 📝 Dalsze pushowania zmian

Od teraz wystarczy:

```bash
# Edytuj kod
# ...

# Zacommittuj i push
git add .
git commit -m "feat: my awesome feature"
git push origin main
```

Vercel **automatycznie** wdroży zmiany na produkcji. ✅

---

## ❌ Coś poszło nie tak?

### Build nie powiódł się

1. Otwórz dashboard Vercel
2. Kliknij na deployment
3. Kliknij: `Build Logs`
4. Szukaj błędu
5. Rozwiąż lokalnie
6. `git push origin main` - Vercel automatycznie spróbuje ponownie

### Aplikacja ładuje się ale pokazuje błąd

1. Otwórz przeglądarkę (F12) → `Console`
2. Szukaj błędu
3. Sprawdź czy zmienne środowiskowe są ustawione prawidłowo
4. W Vercel: `Project Settings` → `Environment Variables`

### Real-time nie działa

Sprawdzenie:
1. W Supabase: Projekt → `Project Settings` → `Realtime` → czy jest `Enabled`?
2. Sprawdź czy `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` są prawidłowe
3. Refresh strony (Ctrl+Shift+Del + Refresh)

---

## 🔗 Pełna dokumentacja

Jeśli coś jest niejasne, przeczytaj: `docs/vercel-deployment.md`

---

**Pytania? Sprawdź logi w Vercel dashboard lub przeczytaj pełny przewodnik! 🚀**
