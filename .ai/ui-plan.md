<conversation_summary>
<decisions>
1. Użycie górnego menu z logo, linkami Dashboard i Nowe zgłoszenie oraz avatara z dropdown Profil/Wyloguj.
2. Formularze logowania i zmiany hasła jako odrębne strony App Router.
3. Jednolity formularz tworzenia ticketa ze wszystkimi polami i przyciskami Powrót i Wyślij.
4. Wyświetlanie szczegółów ticketa w modalnym oknie Dialog Radix.
5. Responsywność desktop-first z collapse sidebar do bottom nav na mobile (ikonki Tickets, Nowe zgłoszenie, Profil).
6. Real-time subskrypcja useRealtimeTickets w hooku i React Context globalnie.
7. Zarządzanie UI stanem list i szczegółów w Server Components, real-time i toggle theme w Client Components opakowanych w Suspense.
8. Dark/light mode za pomocą Tailwind CSS, ThemeProvider ze shadcn/ui, zapis w localStorage.
9. Paginacja offsetowa z Next/Prev.
10. Globalny Error Boundary i obsługa 401/403 z redirectem lub pełnoekranowym error page.
</decisions>
<matched_recommendations>
1. Wykorzystanie komponentów shadcn/ui (NavigationMenu, Dialog, Toast, Skeleton).
2. Prefetch wszystkich kategorii i podkategorii w Server Component.
3. Intercepting routes dla modala szczegółów ticketa.
4. Next.js Middleware do wymuszenia redirectu przy nieautoryzacji i skeleton loading.
5. Użycie revalidateTag('tickets') i caching stale-while-revalidate.
6. Konfiguracja tailwind.config.ts z theme shadcn/ui dla spójności designu.
7. Obsługa ARIA-labels i focus management dzięki Radix.
8. Bottom nav na mobile z ikonami.
</matched_recommendations>
<ui_architecture_planning_summary>
Główne wymagania:
- Górne menu z logo, Dashboard, Nowe zgłoszenie i avatar z dropdown.
- Logowanie oraz zmiana hasła jako oddzielne strony.
- Formularz ticketa zawiera kategorie, podkategorię, tytuł, opis oraz przyciski Powrót i Wyślij.
- Szczegóły ticketa w modalu z focus trap, Esc i kliknięciem poza modal.
- Responsywność: desktop-first sidebar -> bottom nav na mobile.

Kluczowe widoki:
- /login, /change-password
- /tickets (lista)
- /tickets/[id] modal
- /tickets/available i /tickets/assigned dla agentów
- Strony w grupach app/(dashboard)/user i app/(dashboard)/agent

Przepływy:
- Login -> Dashboard (USER lub AGENT) -> Lista ticketów -> Nowe zgłoszenie -> Modal szczegółów.
- Agent może filtrować /tickets/available i przypisywać lub zamykać ticket.

Integracja z API i stan:
- Server Components fetchują wszystkie potrzebne dane (kategorie, tickety) z endpointów.
- useRealtimeTickets hook subskrybuje zmiany przez Supabase Realtime i aktualizuje React Context.
- Akcje tworzenia/przypisania/aktualizacji ticketów wywołują revalidateTag('tickets').

Responsywność i dostępność:
- Tailwind CSS sm, md, lg; shadcn/ui zapewniają ARIA i focus management.
- Bottom nav na mobile, collapse sidebar.
- Skeleton i toasty dla stanów loading i error.

Bezpieczeństwo i autoryzacja:
- Next.js Middleware do ochrony tras i redirectu 401/403.
- Sesja NextAuth v5 w Server Components do warunkowego renderowania przycisków.
- Globalny Error Boundary i error.tsx.

</ui_architecture_planning_summary>
<unresolved_issues>
- Brak – wszystkie kluczowe kwestie zostały wyjaśnione.
</unresolved_issues>
</conversation_summary>
