# TickFlow - Stack Technologiczny

**Projekt:** TickFlow - System zgłaszania ticketów IT  
**Wersja:** MVP 1.0  
**Data aktualizacji:** 6 października 2025

---

## 🛠️ Stack technologiczny

### Frontend & Backend

```yaml
Framework:       Next.js 14+ (App Router)
Language:        TypeScript
Styling:         Tailwind CSS
UI Components:   shadcn/ui
Form Handling:   React Hook Form + Zod validation
State:           React Server Components + Server Actions
```

### Database & Real-time

```yaml
Database:        PostgreSQL (Supabase)
ORM:             Prisma
Real-time:       Supabase Realtime (WebSocket)
Hosting DB:      Supabase Cloud (darmowy tier: 500MB)
```

### Autentykacja

```yaml
Auth Library:    NextAuth.js v5 (Auth.js)
Strategy:        Credentials (email + password)
Session:         JWT
Password:        bcrypt hashing
```

### Deployment

```yaml
Development/Staging:  Vercel (darmowy)
Production (docelowo): Node.js server (własna domena)
Database (zawsze):     Supabase Cloud
Real-time (zawsze):    Supabase WebSocket (działa niezależnie od hostingu)
```

### Dlaczego Supabase Real-time?

✅ Działa niezależnie od lokalizacji aplikacji Next.js  
✅ Darmowy tier wystarczający na projekt  
✅ Łatwa integracja (PostgreSQL Replication)  
✅ Automatic reconnection  
✅ Nie wymaga custom WebSocket servera  

---

## 📦 Dependencies

### Kluczowe zależności

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "next-auth": "^5.0.0-beta",
    "@prisma/client": "^5.18.0",
    "@supabase/supabase-js": "^2.45.0",
    "bcrypt": "^5.1.1",
    "zod": "^3.23.0",
    "react-hook-form": "^7.52.0"
  },
  "devDependencies": {
    "prisma": "^5.18.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "@types/bcrypt": "^5.0.2"
  }
}
```

---

## 🌍 Environment Variables

### Development (.env.local)

```bash
# Database
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-here"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."
SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."
```

### Production (Vercel)

```bash
# Database
DATABASE_URL="postgresql://..." # to samo Supabase

# NextAuth
NEXTAUTH_URL="https://tickflow.vercel.app"
NEXTAUTH_SECRET="different-secret-for-prod"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co" # to samo
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..." # to samo
SUPABASE_SERVICE_ROLE_KEY="eyJxxx..." # to samo
```

---

## 📁 Folder Structure

```
tickflow/
├── .ai/
│   ├── prd.md
│   └── tech-stack.md (ten dokument)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── user/
│   │   │   │   ├── tickets/
│   │   │   │   └── new-ticket/
│   │   │   └── agent/
│   │   │       ├── tickets/
│   │   │       └── my-tickets/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── tickets/
│   │   └── auth/
│   ├── lib/
│   │   ├── auth.ts (NextAuth config)
│   │   ├── db.ts (Prisma client)
│   │   ├── supabase.ts (Supabase client)
│   │   └── validators/ (Zod schemas)
│   └── hooks/
│       └── useRealtimeTickets.ts
├── public/
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 📚 Dokumentacja

### Bookmark'uj te linki:

- **Next.js:** https://nextjs.org/docs
- **NextAuth.js v5:** https://authjs.dev
- **Prisma:** https://www.prisma.io/docs
- **Supabase Realtime:** https://supabase.com/docs/guides/realtime
- **shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React Hook Form:** https://react-hook-form.com
- **Zod:** https://zod.dev

---

## 🎯 Decyzje architektoniczne

### Dlaczego Next.js App Router a nie Pages Router?

- App Router to przyszłość Next.js
- Server Components = lepsze performance
- Server Actions = prostsze mutacje (bez API routes)

### Dlaczego Prisma a nie Drizzle?

- Prostsza nauka dla pierwszego projektu Next.js
- Lepsza dokumentacja
- Migrations out-of-the-box

### Dlaczego Supabase a nie własny WebSocket?

- Darmowy tier wystarczający
- Działa niezależnie od hostingu Next.js
- Gotowe rozwiązanie = mniej kodu do maintenance

### Dlaczego NextAuth.js v5 a nie Clerk/Auth0?

- Darmowy (Clerk/Auth0 = paid na więcej userów)
- Pełna kontrola nad database schema
- Integracja z Prisma

---

## ✅ Setup Checklist

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

*Dokument aktualizowany w trakcie projektu.*

