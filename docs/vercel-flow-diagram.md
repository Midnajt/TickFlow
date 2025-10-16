# 📊 TickFlow - Vercel Deployment Flow Diagram

Wizualna reprezentacja całego procesu deployment'u.

---

## 🎯 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKFLOW DEPLOYMENT                         │
└─────────────────────────────────────────────────────────────────┘

                         LOCAL DEVELOPMENT
                              ↓
                    ┌──────────────────────┐
                    │  1. CODE LOCALLY     │
                    │  2. npm run lint     │
                    │  3. npm run build    │
                    │  4. npm run test     │
                    └──────────────────────┘
                              ↓
                    ┌──────────────────────┐
                    │  COMMIT & PUSH       │
                    │  git push origin main│
                    └──────────────────────┘
                              ↓
                        GITHUB + CI/CD
                              ↓
                    ┌──────────────────────┐
                    │  GitHub Actions      │
                    │  1. Lint code        │
                    │  2. Run tests        │
                    │  3. Build project    │
                    │  4. ✅ Success       │
                    └──────────────────────┘
                              ↓
                    VERCEL BUILDS & DEPLOYS
                              ↓
                    ┌──────────────────────┐
                    │  1. npm install      │
                    │  2. npm run build    │
                    │  3. Create artifacts │
                    │  4. Deploy to edge   │
                    │  5. ✅ LIVE          │
                    └──────────────────────┘
                              ↓
                    https://tickflow.vercel.app ✅
```

---

## 📋 Szczegółowy Workflow - Krok po Kroku

```
START: Chcesz wdrożyć nową wersję
   │
   ├─→ Edytuj kod lokalnie
   │   └─→ npm run dev        (test)
   │   └─→ npm run build      (verify build)
   │   └─→ npm test           (run tests)
   │
   ├─→ Commit zmian
   │   └─→ git add .
   │   └─→ git commit -m "..."
   │
   ├─→ Push na GitHub
   │   └─→ git push origin main
   │
   ├─→ GitHub Actions uruchomia się
   │   ├─→ Lint (npm run lint)
   │   ├─→ Tests (npm run test:coverage)
   │   ├─→ Build (npm run build)
   │   └─→ ✅ All checks pass → GitHub Actions CI/CD
   │
   ├─→ Webhook wywoływany na Vercel
   │   └─→ Vercel odbiera notyficę: "New push on main"
   │
   ├─→ Vercel buduje i deployuje
   │   ├─→ npm install
   │   ├─→ npm run build
   │   ├─→ Linting check (npm run lint)
   │   ├─→ Create deployment artifacts
   │   ├─→ Deploy to CDN/Edge
   │   └─→ ✅ Deployment ready
   │
   └─→ END: Aplikacja live na https://tickflow.vercel.app ✅

Timeline: ~30-60 sekund od push do live
```

---

## 🔄 Deployment z Feature Brancha (Preview)

```
DEVELOP FEATURE
   │
   ├─→ git checkout -b feature/my-feature
   │   └─→ Edit code
   │   └─→ npm run dev
   │
   ├─→ Push na feature branch
   │   └─→ git push origin feature/my-feature
   │
   ├─→ Vercel tworzy PREVIEW
   │   └─→ https://tickflow-feature-my-feature.vercel.app
   │   └─→ Automatycznie, bez Production
   │
   ├─→ Code review (możesz podzielić link)
   │   └─→ Inni mogą testować na Preview
   │
   ├─→ Approve & Merge
   │   └─→ git checkout main
   │   └─→ git merge feature/my-feature
   │   └─→ git push origin main
   │
   └─→ Vercel deployuje na PRODUCTION
       └─→ https://tickflow.vercel.app (automatycznie) ✅
```

---

## 🏗️ Architektura - Gdzie Co Żyje

```
┌────────────────────────────────────────────────────────────────┐
│                       PRODUCTION STACK                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐         ┌──────────────┐                │
│  │  Your Computer  │         │   GitHub     │                │
│  │  (Development)  │------→  │  Repository  │                │
│  │                 │         │              │                │
│  │  • npm run dev  │         │  main branch │                │
│  │  • npm run lint │         │              │                │
│  │  • npm run test │         └──────────────┘                │
│  └─────────────────┘                │                        │
│                                     ↓                         │
│                        ┌────────────────────┐                │
│                        │  GitHub Actions    │                │
│                        │  (CI/CD Pipeline)  │                │
│                        │                    │                │
│                        │  1. Lint           │                │
│                        │  2. Test           │                │
│                        │  3. Build          │                │
│                        │  4. ✅ Pass        │                │
│                        └────────────────────┘                │
│                                  │                            │
│                                  ↓                            │
│                  ┌───────────────────────────┐               │
│                  │  Vercel (Hosting + Build) │               │
│                  │                           │               │
│                  │  • npm install            │               │
│                  │  • npm run build          │               │
│                  │  • Create artifacts       │               │
│                  │  • Deploy to Edge Network │               │
│                  └───────────────────────────┘               │
│                            │                                  │
│        ┌───────────────────┼───────────────────┐             │
│        ↓                   ↓                   ↓              │
│  ┌──────────┐        ┌──────────┐       ┌──────────┐         │
│  │ Frontend │        │ API Edge │       │ Database │         │
│  │  (HTML/  │        │ Functions│       │ Queries  │         │
│  │  CSS/JS) │        │          │       │  (SQL)   │         │
│  └──────────┘        └──────────┘       └──────────┘         │
│        │                   │                   │              │
│        │                   │                   ↓              │
│        │                   │          ┌──────────────────┐   │
│        │                   └─────────→│  Supabase        │   │
│        │                              │  • PostgreSQL    │   │
│        └─────────────────────────────→│  • Real-time     │   │
│                                       │  • Auth          │   │
│                                       └──────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ https://tickflow.vercel.app  🌍                      │   │
│  │ Users can access the application here               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## 📌 Gdzie co znaleźć w dokumentacji

```
Chcesz wiedzieć...              → Przeczytaj dokument
─────────────────────────────────────────────────────────
Jak szybko wdrożyć?             → vercel-quick-start.md
Wszystko szczegółowo            → vercel-deployment.md
Jak znaleźć zmienne?            → vercel-env-setup.md
Praktyczne scenariusze          → vercel-faq-scenarios.md
Co się dzieje w każdym kroku?   → Ten dokument (tutaj!)
Mam problem                     → vercel-faq-scenarios.md
Deployment się nie udał         → vercel-deployment.md (sekcja 8)
Jak aktualizować zmienne?       → vercel-env-setup.md (sekcja 4)
Custom domena                   → vercel-deployment.md (sekcja 9)
```

---

## 🔄 Cykl życia Deployment'u

```
Timeline: Od push do live

TIME    LOCATION           ACTION
────────────────────────────────────────────────────────────

00:00s  Twój komputer      → git push origin main
00:05s  GitHub             → Webhook wysłany do Vercel
00:10s  GitHub Actions     → Workflow uruchomiony
10:00s  GitHub Actions     → Lint ✅, Test ✅, Build ✅
10:05s  GitHub Actions     → Success! Webhook do Vercel
10:10s  Vercel             → Build job started
10:15s  Vercel             → npm install (10-15s)
20:30s  Vercel             → npm run build (10-20s)
25:45s  Vercel             → Artifacts created
28:00s  Vercel             → Deploy to Edge
30:00s  Vercel Dashboard   → ✅ Deployment ready
30:10s  https://tickflow.  → Aplikacja LIVE
        vercel.app

Total: ~30 sekund od push do live na produkcji
```

---

## 🎨 Git Branch Strategy

```
MAIN BRANCH                    FEATURE BRANCHES
(Production)                   (Development)

main ─────────────────────────────→ Production
  │                              (https://tickflow.vercel.app)
  │
  ├─ ✅ Every push deploys
  ├─ ✅ GitHub Actions runs
  └─ ✅ Vercel automatic

Feature/Preview Branches:

feature/dark-mode ───→ Preview URL
feature/ai-improve ──→ Preview URL  (tylko na feature branch)
bugfix/realtime ─────→ Preview URL

Po merge do main → Automatycznie na Production ✅
```

---

## 🔐 Zmienne Środowiskowe - Flow

```
1. DEVELOPMENT (Lokalnie)
   .env.local (plik lokalny)
   └─→ npm run dev
       └─→ Aplikacja czyta zmienne

2. PRODUCTION (Vercel)
   
   ┌─────────────────────────────────────────┐
   │ Vercel Project Settings                 │
   │ → Environment Variables                 │
   │ → Add New                               │
   │ → Name: DATABASE_URL                    │
   │ → Value: postgresql://...               │
   │ → Select: Production                    │
   │ → Save                                  │
   └─────────────────────────────────────────┘
        │
        ├─ Wercel zapisuje sekretnie
        │
        ├─ Przy deploy: Vercel wstrzykuje zmienne
        │
        └─ Aplikacja na produkcji czyta zmienne
           └─ process.env.DATABASE_URL dostępne

⚠️  WAŻNE:
   - .env.local NIGDY nie commituj do Git
   - Zmienne na Vercel są enkryptowane
   - SUPABASE_SERVICE_ROLE_KEY tylko Production!
```

---

## 📈 Monitoring After Deploy

```
Po wdrożeniu (continuous):

┌──────────────────────────────────────┐
│ Vercel Dashboard                     │
│ → Deployments                        │
│   └─ Sprawdzaj Build Logs            │
│ → Analytics                          │
│   └─ Monitor Performance             │
│ → Function Logs                      │
│   └─ Sprawdzaj Errors                │
└──────────────────────────────────────┘
           │
           ├─ Response time OK?
           ├─ Errors?
           └─ Performance good?

┌──────────────────────────────────────┐
│ Supabase Dashboard                   │
│ → Logs                               │
│   └─ SQL queries OK?                 │
│ → Realtime                           │
│   └─ Connections active?             │
│ → Database                           │
│   └─ Storage OK?                     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Browser (Production)                 │
│ F12 → Console                        │
│ → JavaScript errors?                 │
│ → Network Tab                        │
│ → API calls working?                 │
└──────────────────────────────────────┘
```

---

## ⚠️ Co Może Pójść Nie Tak

```
PROBLEM                  SYMPTOM              SOLUTION
─────────────────────────────────────────────────────────────

Build fails              Vercel dashboard     → Read Build Logs
                         shows ❌              → Fix locally
                                             → Push again

Database               Error on page          → Check DATABASE_URL
connection error       Białe strony          → Verify in Vercel
                                             → Redeploy

Variables              Build or             → Project Settings
missing                runtime error        → Add missing variables
                                             → Redeploy

Real-time             Data not              → Verify Supabase
not working          synchronizing          → Enable Realtime
                                             → Check RLS policies

Custom domain          Domain not            → Wait 24h for DNS
not working           available             → Verify DNS records
```

---

## 🚀 Quick Reference Card

Wydrukuj to 📄 i miej na biurku:

```
╔════════════════════════════════════╗
║  TICKFLOW DEPLOYMENT QUICK REF     ║
╠════════════════════════════════════╣
║                                    ║
║ DEPLOY:                            ║
║  $ git push origin main            ║
║  (Vercel deployuje automatycznie)  ║
║                                    ║
║ CHECK STATUS:                      ║
║  vercel.com/dashboard              ║
║  → Deployments                     ║
║                                    ║
║ VIEW LOGS:                         ║
║  Dashboard → Deployment → Logs     ║
║                                    ║
║ ROLLBACK:                          ║
║  Dashboard → Deployments           ║
║  → Find working version → Redeploy ║
║                                    ║
║ LIVE:                              ║
║  https://tickflow.vercel.app       ║
║                                    ║
║ TIME TO LIVE: ~30 segundos         ║
║                                    ║
╚════════════════════════════════════╝
```

---

## 📞 Emergency Checklist

Coś powiało? Przejdź po kolei:

```
[ ] 1. Sprawdzić Vercel dashboard → Build Logs
[ ] 2. Sprawdzić lokalnie:
      npm run lint
      npm run build
      npm run start
[ ] 3. Sprawdzić Environment Variables w Vercel
[ ] 4. Sprawdzić GitHub Actions workflow
[ ] 5. Sprawdzić Browser Console (F12)
[ ] 6. Sprawdzić Supabase status
[ ] 7. Kliknąć Redeploy w Vercel
[ ] 8. Przeczytać FAQ sekcję w dokumentacji
[ ] 9. Jeśli nic nie pomagahttp: git revert HEAD + push
```

---

**Potrzebujesz więcej szczegółów? Przeczytaj pełną dokumentację w `docs/vercel-deployment.md` 📖**

**Pytania? Sprawdź FAQ w `docs/vercel-faq-scenarios.md` ❓**

🚀 **Happy Deploying!**
