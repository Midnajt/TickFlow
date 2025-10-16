# 🔐 TickFlow - Konfiguracja zmiennych dla Vercel

Ten dokument wyjaśnia co to są zmienne środowiskowe, skąd je wziąć i jak je dodać do Vercel.

---

## 📋 Lista zmiennych

| Zmienna | Skąd wziąć | Typ | Gdzie w Vercel | 
|---------|-----------|-----|----------------|
| `DATABASE_URL` | Supabase Project Settings | `postgresql://...` | Production + Preview |
| `NEXTAUTH_URL` | Skomponuj sam | `https://tickflow.vercel.app` | Production + Preview |
| `NEXTAUTH_SECRET` | Wygeneruj | Random string | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API Settings | `https://xxx.supabase.co` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API Settings | JWT token | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API Settings | JWT token | Production **ONLY** |
| `JWT_SECRET` | Wygeneruj | Random string | Production + Preview |
| `OPENROUTER_API_KEY` | OpenRouter Dashboard | `sk-or-v1-...` | Production + Preview (opcjonalnie) |
| `NODE_ENV` | Stała wartość | `production` | Production |

---

## 🔍 Instrukcje dla każdej zmiennej

### 1. DATABASE_URL

#### Gdzie znaleźć?

1. Otwórz: `https://supabase.com/dashboard`
2. Otwórz Twój projekt
3. Przejdź do: `Project Settings` (u dołu lewego menu)
4. Kliknij tab: `Database`
5. Szukaj: **Connection string**
6. Wybierz: `URI` (pierwszy tab)
7. Skopiuj cały string (zaczyna się z `postgresql://`)

#### Wygląd:
```
postgresql://postgres.abc123:password@db.abc123.supabase.co:5432/postgres
```

#### Dodanie do Vercel:
- Name: `DATABASE_URL`
- Value: (wklej z Supabase)
- Environments: `Production` ✅ + `Preview` ✅

---

### 2. NEXTAUTH_URL

#### Wartość:
Zależy od domeny Vercel (zwykle domyślna):

```
https://tickflow.vercel.app
```

Jeśli później kupisz domenę (np. `tickflow.firma.pl`), zmień na:
```
https://tickflow.firma.pl
```

#### Dodanie do Vercel:
- Name: `NEXTAUTH_URL`
- Value: `https://tickflow.vercel.app`
- Environments: `Production` ✅ + `Preview` ✅

---

### 3. NEXTAUTH_SECRET

#### Generowanie:

Uruchom w terminalu:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Skopiuj wynik (długi ciąg znaków).

#### Dodanie do Vercel:
- Name: `NEXTAUTH_SECRET`
- Value: (wklejony sekret)
- Environments: `Production` ✅ + `Preview` ✅

---

### 4. NEXT_PUBLIC_SUPABASE_URL

#### Gdzie znaleźć?

1. Otwórz: `https://supabase.com/dashboard`
2. Otwórz Twój projekt
3. Przejdź do: `Project Settings` (u dołu lewego menu)
4. Kliknij tab: `API`
5. Szukaj: **Project URL**
6. Skopiuj (zaczyna się z `https://`)

#### Wygląd:
```
https://xyzabc123def.supabase.co
```

#### Dodanie do Vercel:
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: (wklej z Supabase)
- Environments: `Production` ✅ + `Preview` ✅

---

### 5. NEXT_PUBLIC_SUPABASE_ANON_KEY

#### Gdzie znaleźć?

1. W tym samym miejscu: `Project Settings` → `API`
2. Szukaj: **Project API keys**
3. Znajdź: **anon** (publiczny klucz)
4. Skopiuj (zacznyna się z `eyJ`)

#### Wygląd:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Dodanie do Vercel:
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: (wklej z Supabase)
- Environments: `Production` ✅ + `Preview` ✅

**WAŻNE**: To jest **publiczny** klucz - będzie widoczny w przeglądarce. To jest OK i bezpieczne.

---

### 6. SUPABASE_SERVICE_ROLE_KEY

#### Gdzie znaleźć?

1. W tym samym miejscu: `Project Settings` → `API`
2. Szukaj: **Project API keys**
3. Znajdź: **service_role** (prywatny klucz)
4. Kliknij: `Reveal`
5. Skopiuj (zaznyna się z `eyJ`)

#### Wygląd:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Dodanie do Vercel:
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (wklej z Supabase)
- Environments: **TYLKO** `Production` ✅ (bez Preview!)

**WAŻNE**: To jest **prywatny** klucz! 🔒 Nigdy nie wklejaj do Preview lub publicznych miejsc!

---

### 7. JWT_SECRET

#### Generowanie:

Uruchom w terminalu:

```bash
openssl rand -base64 32
```

Lub na Windows:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Skopiuj wynik.

#### Dodanie do Vercel:
- Name: `JWT_SECRET`
- Value: (wklejony sekret)
- Environments: `Production` ✅ + `Preview` ✅

---

### 8. OPENROUTER_API_KEY (opcjonalnie)

Tylko jeśli chcesz AI suggestions w tworzeniu ticketów.

#### Gdzie znaleźć?

1. Otwórz: `https://openrouter.ai/keys`
2. Skopiuj klucz (zaczyna się z `sk-or-v1-`)

#### Dodanie do Vercel:
- Name: `OPENROUTER_API_KEY`
- Value: (wklej klucz)
- Environments: `Production` ✅ + `Preview` ✅ (opcjonalnie)

---

### 9. NODE_ENV

#### Wartość:
```
production
```

#### Dodanie do Vercel:
- Name: `NODE_ENV`
- Value: `production`
- Environments: `Production` ✅ (Preview może być, ale nie musi)

---

## ✅ Checklist - Czy wszystko prawidłowo?

Po dodaniu wszystkich zmiennych sprawdź:

- [ ] W Vercel widać wszystkie 9 zmiennych
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ma zaznaczone **TYLKO** `Production`
- [ ] Pozostałe zmienne mają zaznaczone `Production` + co najmniej `Preview`
- [ ] Żadna wartość się nie powtarza w Vercel
- [ ] Nie ma pustych pól `Value`

---

## 🔄 Aktualizacja zmiennych (później)

Jeśli trzeba zmienić zmienną:

1. W Vercel: `Project Settings` → `Environment Variables`
2. Znajdź zmienną
3. Kliknij: `...` → `Edit`
4. Zmień wartość
5. Kliknij: `Save`
6. Nowy deployment się automatycznie wyzwoli

---

## 🚨 Jeśli zapomnisz zmienną

Aplikacja się zaburzy. Symptomy:

```
❌ Build fails: "process.env.DATABASE_URL is undefined"
❌ Strona ładuje się ale błędy w konsoli
❌ Real-time nie działa
```

Rozwiązanie:
1. Sprawdź Environment Variables w Vercel
2. Dodaj brakującą zmienną
3. Kliknij `Redeploy` w Deployments
4. Czekaj na deployment

---

## 📝 Kopia do wklejenia

Jeśli chcesz mieć listę do odznaczania:

```
[ ] DATABASE_URL - postgresql://...
[ ] NEXTAUTH_URL - https://tickflow.vercel.app
[ ] NEXTAUTH_SECRET - (random)
[ ] NEXT_PUBLIC_SUPABASE_URL - https://xxx.supabase.co
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY - eyJ...
[ ] SUPABASE_SERVICE_ROLE_KEY - eyJ... (Production ONLY!)
[ ] JWT_SECRET - (random)
[ ] OPENROUTER_API_KEY - sk-or-v1-... (optional)
[ ] NODE_ENV - production
```

---

**Gotowe! Wszystkie zmienne są skonfigurowane i aplikacja powinna działać. 🚀**
