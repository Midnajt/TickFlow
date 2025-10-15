## Struktura komponentów i zależności (start: `app/`)

Poniżej znajduje się drzewo katalogów oraz mapa zależności modułów rozpoczynając od `app/`. Notatka testowa: zgodnie z `@test.mdc` dokument wspiera planowanie E2E; nie uruchamiamy testów tutaj.

### Drzewo katalogów (ASCII)

```text
app/
  ai-demo/
    page.tsx
  actions/
    ai/
      complete.ts
  api/
    agent-categories/
      [categoryId]/
        agents/
          route.ts
      me/
        route.ts
    ai/
      complete/
        route.ts
    auth/
      change-password/
        route.ts
      login/
        route.ts
      logout/
        route.ts
      session/
        route.ts
    categories/
      [categoryId]/
        route.ts
      route.ts
    tickets/
      [ticketId]/
        assign/
          route.ts
        status/
          route.ts
        route.ts
      route.ts
  change-password/
    page.tsx
  components/
    AuthLayout.tsx
    ChangePasswordForm.tsx
    DashboardHeader.tsx
    ErrorAlert.tsx
    LoginForm.tsx
    LogoutButton.tsx
    examples/
      AiExampleComponent.tsx
    tickets/
      CreateTicketForm.tsx
      TicketCard.tsx
      TicketDetailsDialog.tsx
      TicketFilters.tsx
      TicketList.tsx
    ui/
      dialog.tsx
  globals.css
  hooks/
    useCategories.ts
    useRealtimeTickets.ts
    useTickets.ts
  layout.tsx
  lib/
    api-client.ts
    database.types.ts
    middleware/
      rate-limiter.ts
    services/
      agent-categories.ts
      auth.ts
      categories.ts
      openrouter/
        errors.ts
        index.ts
        server.ts
      tickets.ts
    supabase-server.ts
    supabase.ts
    utils/
      api-response.ts
      auth.ts
      supabase-auth.ts
    validators/
      ai.ts
      auth.ts
      categories.ts
      tickets.ts
  login/
    page.tsx
  page.tsx
  supabase-test/
  tickets/
    page.tsx
```

### Alias ścieżek

- `tsconfig.json` definiuje alias: `@/* -> ./*`. W kodzie często używany jest prefiks `@/app/...` oraz importy typów z `@/src/types`.

### Mapa zależności (wysokopoziomowa)

- Strony (RSC/klienckie)
  - `app/page.tsx` → `AuthService`, `TicketService`, `DashboardHeader`, `@/src/types`
  - `app/tickets/page.tsx` → `TicketList`, `TicketFilters`, `CreateTicketForm`, `useTickets`, `useRealtimeTickets`, `ticketsApi`, `authApi`, `@/src/types`
  - `app/login/page.tsx` → `AuthLayout`, `LoginForm`
  - `app/change-password/page.tsx` → `AuthLayout`, `ChangePasswordForm`
  - `app/ai-demo/page.tsx` → `AiExampleComponent`
  - `app/layout.tsx` → `Metadata`

- Komponenty
  - `components/DashboardHeader.tsx` → `LogoutButton`, `@/src/types`
  - `components/LogoutButton.tsx` → `next/navigation`
  - `components/LoginForm.tsx` → `react-hook-form`, `zodResolver`, `loginSchema`, `@/src/types`, `ErrorAlert`
  - `components/ChangePasswordForm.tsx` → `react-hook-form`, `zodResolver`, `changePasswordSchema`, `@/src/types`, `ErrorAlert`
  - `components/tickets/CreateTicketForm.tsx` → `useCategories`, `ticketsApi`, `actions/ai/complete.completeAi`, `@/src/types`
  - `components/tickets/TicketList.tsx` → `TicketCard`, `@/src/types`
  - `components/tickets/TicketFilters.tsx` → `@/src/types`
  - `components/tickets/TicketCard.tsx` → `@/src/types`
  - `components/tickets/TicketDetailsDialog.tsx` → `ticketsApi`, `Dialog` (z `components/ui/dialog`), `@/src/types`
  - `components/examples/AiExampleComponent.tsx` → `@/components/ui/button`, `@/components/ui/card`, `actions/ai/complete`

- Hooki
  - `hooks/useCategories.ts` → `categoriesApi`, `@/src/types`
  - `hooks/useTickets.ts` → `ticketsApi`, `@/src/types`
  - `hooks/useRealtimeTickets.ts` → `@supabase/supabase-js`, `@/app/lib/database.types`

- Akcje/serwisy OpenRouter (AI)
  - `actions/ai/complete.ts` → `openrouter` (z `lib/services/openrouter/server`), `zod`
  - `api/ai/complete/route.ts` → `openrouter` (server), `rate-limiter`
  - `lib/services/openrouter/*` → implementacja klienta, błędy i serwerowa instancja

- API Routes (route handlers)
  - `api/auth/login` → `loginSchema`, `AuthService`, `rate-limiter`
  - `api/auth/logout` → `AuthService`
  - `api/auth/session` → `requireAuth`
  - `api/auth/change-password` → `changePasswordSchema`, `AuthService`, `requireAuth`, `@/src/types`
  - `api/categories` (+ `[categoryId]`) → `CategoryService`, `withAuth`, `getCategoriesQuerySchema`
  - `api/agent-categories/me` → `AgentCategoryService`, `withRole`
  - `api/agent-categories/[categoryId]/agents` → `AgentCategoryService`, `withRole`
  - `api/tickets` → `TicketService`, `withAuth`, `@/src/types`
  - `api/tickets/[ticketId]/(assign|status)` → `TicketService`, `withRole`, `updateTicketStatusSchema`, `@/src/types`

- Warstwa serwisów i utils
  - `lib/services/auth.ts` → `bcryptjs`, `jose`, `supabaseServer`
  - `lib/services/tickets.ts` → `createSupabaseAdmin`, `CategoryService`, `AgentCategoryService`
  - `lib/services/categories.ts` → `createSupabaseAdmin`
  - `lib/services/agent-categories.ts` → `createSupabaseAdmin`
  - `lib/utils/auth.ts` → `AuthService` (+ `withAuth`, `withRole`, `requireAuth` używane w route handlers)
  - `lib/utils/supabase-auth.ts` → `@supabase/supabase-js`, typy `Database`
  - `lib/utils/api-response.ts` → `NextResponse`, `ZodError`
  - `lib/middleware/rate-limiter.ts` → `NextRequest`, `NextResponse`
  - `lib/api-client.ts` → Klient HTTP do `ticketsApi`, `categoriesApi`, `authApi` (używany w komponentach i hookach)
  - `lib/validators/*.ts` → Schematy Zod: `auth`, `categories`, `tickets`, `ai`

### Przepływy kluczowe (skrót)

- Autoryzacja i sesja
  - Forms (`LoginForm`, `ChangePasswordForm`) → Schematy Zod → API `/api/auth/*` → `AuthService` → Supabase/JWT
  - `withAuth/withRole/requireAuth` osłaniają route handlers.

- Tickety
  - UI (`tickets/page.tsx`) → Hooki (`useTickets`, `useRealtimeTickets`) + REST (`ticketsApi`) → API `/api/tickets*` → `TicketService` → Supabase

- AI
  - UI (`CreateTicketForm`, `AiExampleComponent`) → `actions/ai/complete` lub `/api/ai/complete` → `openrouter` (+ rate limit)

### Uwaga dot. testów (wg `@test.mdc`)

- Ten dokument ma wspierać utrzymanie E2E (Playwright) i integracji; nie uruchamiaj tu testów.
- Do kontekstu testów korzystaj z plików testowych i ewentualnych notatek (`tests/README.md`, `tests/e2e/*`).


