# Plan refaktoryzacji - Problem z widocznością i akcjami ticketów

**Data utworzenia**: 22 października 2025  
**Priorytet**: Wysoki  
**Status**: Zaplanowane  

---

## 📋 Opis problemu

### Problem 1: Agent nie widzi ticketu przypisanego do siebie poza swoimi kategoriami

**Scenariusz**:
1. Administrator przypisuje ticket do agenta (może być przypisany do osoby, która domyślnie nie ma kategorii lub podkategorii przypisanej do siebie)
2. Administrator widzi informację że przypisana osoba zmieniła się
3. Administrator nadal może zakończyć to zadanie (ticket nie znika z jego listy)
4. Gdy agent loguje się na swoje konto - **nie widzi tego ticketu**

**Przyczyna**: Logika filtrowania ticketów dla roli AGENT może niepoprawnie obsługiwać tickety przypisane do agenta spoza jego kategorii.

**Lokalizacja**: `app/lib/services/tickets/ticket-query-builder.ts` (linie 108-136)

---

### Problem 2: Administrator widzi mylące przyciski akcji

**Scenariusz**:
1. Ticket jest przypisany do agenta
2. Administrator widzi ten ticket na swojej liście
3. Administrator widzi przyciski "Oznacz jako rozwiązane" / "Zamknij" (co jest mylące, bo nie powinien zamykać ticketów innych osób)

**Przyczyna**: Komponent `TicketCard` sprawdza tylko czy ticket ma przypisanie (`ticket.assignedTo`), ale nie sprawdza czy jest przypisany do zalogowanego użytkownika.

**Lokalizacja**: `app/components/tickets/TicketCard.tsx` (linie 120-144)

---

## 🎯 Cele refaktoryzacji

### Cel 1: Poprawna widoczność ticketów dla AGENT
- ✅ Agent widzi wszystkie tickety przypisane do siebie (niezależnie od kategorii)
- ✅ Agent widzi wszystkie nieprzypisane tickety ze swoich kategorii
- ✅ Po przypisaniu ticketu przez administratora, agent od razu go widzi

### Cel 2: Intuicyjne akcje w UI
- ✅ Użytkownik widzi przyciski akcji tylko dla swoich ticketów
- ✅ Administrator nie widzi mylących przycisków dla ticketów innych osób
- ✅ Administrator ma opcję "Przejmij ticket" jeśli chce przejąć ticket przypisany do kogoś innego

### Cel 3: Spójność między listą a szczegółami
- ✅ TicketList i TicketDetailsDialog działają z tą samą logiką
- ✅ Real-time aktualizacje działają poprawnie po transferze

---

## 📐 Architektura zmian

### Warstwy dotknięte zmianami:

```
┌─────────────────────────────────────────┐
│     UI Layer (Components)               │
│  - TicketList, TicketCard               │
│  - TicketDetailsDialog                  │
│  - pages/tickets                        │
└──────────────┬──────────────────────────┘
               │ przekazanie userId
               │
┌──────────────┴──────────────────────────┐
│   Business Logic Layer (Services)       │
│  - TicketQueryBuilder (filtrowanie)     │
│  - TicketQueryService (weryfikacja)     │
└──────────────┬──────────────────────────┘
               │
               │
┌──────────────┴──────────────────────────┐
│     Data Layer (Supabase)               │
│  - tickets table                        │
│  - agent_categories table               │
└─────────────────────────────────────────┘
```

---

## 🔧 Szczegółowe zmiany

### Zmiana 1: Refaktor logiki filtrowania ticketów dla AGENT

**Plik**: `app/lib/services/tickets/ticket-query-builder.ts`

**Aktualna logika (linie 108-136)**:
```typescript
else if (userRole === "AGENT") {
  const agentCategoryIds = await AgentCategoryService.getAgentCategoryIds(userId);
  
  if (agentCategoryIds.length === 0) {
    this.query = this.query.eq("assigned_to_id", userId);
  } else {
    const subcategoryIds = await this.getSubcategoryIds(agentCategoryIds);
    
    // Warunek OR: assigned_to_id = userId OR (assigned_to_id IS NULL AND subcategory_id IN (...))
    this.query = this.query.or(
      `assigned_to_id.eq.${userId},and(assigned_to_id.is.null,subcategory_id.in.(${subcategoryIds.join(",")}))`
    );
  }
}
```

**Problem**: 
- Logika wygląda poprawnie teoretycznie
- Może być problem z:
  - Brakiem odświeżenia po przypisaniu
  - Niepoprawnym warunkiem SQL (sprawdzić logi)
  - Brakiem obsługi ticketów przypisanych do agenta spoza jego kategorii

**Propozycja poprawki**:
```typescript
else if (userRole === "AGENT") {
  const agentCategoryIds = await AgentCategoryService.getAgentCategoryIds(userId);
  
  if (agentCategoryIds.length === 0) {
    // Agent bez kategorii → tylko tickety przypisane do niego
    this.query = this.query.eq("assigned_to_id", userId);
  } else {
    // Agent z kategoriami → tickety przypisane DO NIEGO + nieprzypisane z jego kategorii
    const { data: subs, error: subsError } = await this.supabase
      .from("subcategories")
      .select("id")
      .in("category_id", agentCategoryIds);
    
    if (subsError || !subs || subs.length === 0) {
      // Fallback: tylko przypisane do agenta
      this.query = this.query.eq("assigned_to_id", userId);
    } else {
      const subcategoryIds: string[] = subs.map((s: any) => s.id);
      
      // KLUCZOWA ZMIANA: agent widzi:
      // 1. Wszystkie tickety przypisane do niego (assigned_to_id = userId)
      // 2. Nieprzypisane tickety z jego kategorii (assigned_to_id IS NULL AND subcategory_id IN (...))
      this.query = this.query.or(
        `assigned_to_id.eq.${userId},and(assigned_to_id.is.null,subcategory_id.in.(${subcategoryIds.join(",")}))`
      );
    }
  }
}
```

**Weryfikacja**: Dodać console.log do sprawdzenia wygenerowanego warunku SQL.

**Priorytet**: ⚠️ **WYSOKI** - To główny bug wpływający na funkcjonalność

---

### Zmiana 2: Dodanie userId do komponentów UI

**Plik**: `app/components/tickets/TicketList.tsx`

**Zmiany w interfejsie**:
```typescript
interface TicketListProps {
  tickets: TicketListItemDTO[];
  isLoading?: boolean;
  userRole: UserRole;
  userId: string; // ← NOWE
  onTicketClick?: (ticketId: string) => void;
  onAssignTicket?: (ticketId: string) => void;
  onUpdateStatus?: (ticketId: string, status: TicketStatus) => void;
}
```

**Zmiany w implementacji**:
```typescript
export function TicketList({
  tickets,
  isLoading,
  userRole,
  userId, // ← NOWE
  onTicketClick,
  onAssignTicket,
  onUpdateStatus,
}: TicketListProps) {
  const isAgent = userRole === 'AGENT' || userRole === 'ADMIN';

  // ... reszta kodu

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          userId={userId} // ← PRZEKAZANIE
          userRole={userRole} // ← PRZEKAZANIE
          onClick={() => onTicketClick?.(ticket.id)}
          onAssign={() => onAssignTicket?.(ticket.id)}
          onStatusChange={(status) => onUpdateStatus?.(ticket.id, status)}
          showActions={isAgent}
        />
      ))}
    </div>
  );
}
```

**Priorytet**: ⚠️ **WYSOKI**

---

### Zmiana 3: Poprawa logiki wyświetlania przycisków w TicketCard

**Plik**: `app/components/tickets/TicketCard.tsx`

**Zmiany w interfejsie**:
```typescript
interface TicketCardProps {
  ticket: TicketListItemDTO;
  userId: string; // ← NOWE
  userRole: UserRole; // ← NOWE
  onClick?: () => void;
  onAssign?: () => void;
  onStatusChange?: (status: TicketStatus) => void;
  showActions?: boolean;
}
```

**Zmiany w logice przycisków** (linie 105-147):
```typescript
export function TicketCard({
  ticket,
  userId,
  userRole,
  onClick,
  onAssign,
  onStatusChange,
  showActions = false,
}: TicketCardProps) {
  const status = statusConfig[ticket.status];
  
  // Sprawdzenie przypisania
  const isAssignedToCurrentUser = ticket.assignedTo?.id === userId;
  const isUnassigned = !ticket.assignedTo;
  const isAdmin = userRole === 'ADMIN';

  // ... reszta renderowania ...

  {/* Actions (tylko dla agentów/adminów) */}
  {showActions && (
    <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
      {/* Przycisk "Przypisz do mnie" - tylko dla nieprzypisanych ticketów */}
      {isUnassigned && ticket.status === 'OPEN' && onAssign && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssign();
          }}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Przypisz do mnie
        </button>
      )}

      {/* Przyciski zmiany statusu - TYLKO dla ticketów przypisanych DO ZALOGOWANEGO UŻYTKOWNIKA */}
      {isAssignedToCurrentUser && onStatusChange && (
        <div className="flex-1 flex gap-2">
          {ticket.status === 'IN_PROGRESS' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange('RESOLVED');
              }}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Oznacz jako rozwiązane
            </button>
          )}
          {ticket.status === 'RESOLVED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange('CLOSED');
              }}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Zamknij
            </button>
          )}
        </div>
      )}

      {/* Przycisk "Przejmij" - TYLKO dla ADMIN gdy ticket jest przypisany do kogoś innego */}
      {isAdmin && !isUnassigned && !isAssignedToCurrentUser && onAssign && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssign();
          }}
          className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Przejmij ticket
        </button>
      )}
    </div>
  )}
}
```

**Kluczowe zmiany**:
- ✅ Dodano zmienne `isAssignedToCurrentUser`, `isUnassigned`, `isAdmin`
- ✅ Warunek dla przycisków statusu zmieniony z `ticket.assignedTo` na `isAssignedToCurrentUser`
- ✅ Dodano przycisk "Przejmij ticket" dla administratora

**Priorytet**: ⚠️ **WYSOKI**

---

### Zmiana 4: Poprawa TicketDetailsDialog

**Plik**: `app/components/tickets/TicketDetailsDialog.tsx`

**Zmiany w interfejsie**:
```typescript
interface TicketDetailsDialogProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
  userId: string; // ← NOWE
  onUpdated: () => void;
}
```

**Zmiany w logice**:
```typescript
export function TicketDetailsDialog({
  ticketId,
  open,
  onOpenChange,
  userRole,
  userId, // ← NOWE
  onUpdated,
}: TicketDetailsDialogProps) {
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  // ... reszta state

  const isAgent = userRole === 'AGENT' || userRole === 'ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isAssignedToCurrentUser = ticket?.assignedToId === userId;
  const isUnassigned = !ticket?.assignedToId;

  // ... reszta kodu

  // Renderowanie przycisków akcji
  {/* Przypisz do mnie - tylko dla nieprzypisanych */}
  {isUnassigned && ticket?.status === 'OPEN' && (
    <button onClick={handleAssign}>Przypisz do mnie</button>
  )}

  {/* Zmień status - tylko dla przypisanych do zalogowanego użytkownika */}
  {isAssignedToCurrentUser && (
    <>
      {ticket?.status === 'IN_PROGRESS' && (
        <button onClick={() => handleStatusChange('RESOLVED')}>
          Oznacz jako rozwiązane
        </button>
      )}
      {ticket?.status === 'RESOLVED' && (
        <button onClick={() => handleStatusChange('CLOSED')}>
          Zamknij
        </button>
      )}
      {/* Przekaż - tylko dla ticketów przypisanych do siebie */}
      <button onClick={() => setShowTransferDialog(true)}>
        Przekaż innemu agentowi
      </button>
    </>
  )}

  {/* Przejmij - tylko dla ADMIN gdy ticket jest przypisany do kogoś innego */}
  {isAdmin && !isUnassigned && !isAssignedToCurrentUser && (
    <button onClick={handleAssign}>Przejmij ticket</button>
  )}
}
```

**Priorytet**: ⚠️ **WYSOKI**

---

### Zmiana 5: Aktualizacja strony ticketów

**Plik**: `app/tickets/page.tsx`

**Zmiany**:
```typescript
// Przekazanie userId do TicketList
<TicketList
  tickets={tickets}
  isLoading={isLoading}
  userRole={user.role}
  userId={user.id} // ← NOWE
  onTicketClick={handleTicketClick}
  onAssignTicket={canManageTickets ? handleAssignTicket : undefined}
  onUpdateStatus={canManageTickets ? handleUpdateStatus : undefined}
/>

// Przekazanie userId do TicketDetailsDialog
<TicketDetailsDialog
  ticketId={selectedTicketId}
  open={detailsOpen}
  onOpenChange={setDetailsOpen}
  userRole={user.role}
  userId={user.id} // ← NOWE
  onUpdated={refetch}
/>
```

**Priorytet**: ⚠️ **WYSOKI**

---

### Zmiana 6: Weryfikacja logiki w TicketQueryService

**Plik**: `app/lib/services/tickets/ticket-query.service.ts`

**Sprawdzenie metody `verifyUserAccess` (linie 106-133)**:
```typescript
private async verifyUserAccess(
  userId: string,
  userRole: UserRole,
  ticket: any
): Promise<void> {
  if (userRole === "USER") {
    // USER może zobaczyć tylko swoje tickety
    if (ticket.created_by_id !== userId) {
      throw new Error("AUTHORIZATION_ERROR:Brak uprawnień do tego ticketu");
    }
  } else if (userRole === "ADMIN") {
    // ADMIN ma dostęp do wszystkich ticketów
    // Brak sprawdzenia uprawnień
  } else if (userRole === "AGENT") {
    // AGENT ma dostęp jeśli ticket jest do niego przypisany LUB należy do jego kategorii
    if (ticket.assigned_to_id === userId) {
      return; // ✅ OK - ticket przypisany do agenta
    }
    const { AgentCategoryService } = await import("@/app/lib/services/agent-categories");
    const hasAccess = await AgentCategoryService.hasAccessToCategory(
      userId,
      ticket.subcategories.category_id
    );
    if (!hasAccess) {
      throw new Error("AUTHORIZATION_ERROR:Brak uprawnień do tego ticketu");
    }
  }
}
```

**Weryfikacja**: Ta logika wygląda poprawnie ✅
- Agent może zobaczyć tickety przypisane do siebie (nawet spoza kategorii)
- Agent może zobaczyć tickety ze swoich kategorii

**Priorytet**: 🔍 **ŚREDNI** (weryfikacja)

---

## 📊 Matryca decyzji dla wyświetlania przycisków

| Sytuacja | Rola | Ticket status | Przypisanie | Przyciski do wyświetlenia |
|----------|------|---------------|-------------|---------------------------|
| 1 | USER | dowolny | dowolne | Brak (tylko podgląd) |
| 2 | AGENT | OPEN | nieprzypisany | "Przypisz do mnie" |
| 3 | AGENT | OPEN | do innej osoby | Brak (nie widzi) |
| 4 | AGENT | OPEN | do siebie | "Rozpocznij" (zmiana na IN_PROGRESS) |
| 5 | AGENT | IN_PROGRESS | do siebie | "Oznacz jako rozwiązane" |
| 6 | AGENT | RESOLVED | do siebie | "Zamknij" |
| 7 | AGENT | CLOSED | do siebie | "Przywróć" (opcjonalnie) |
| 8 | ADMIN | OPEN | nieprzypisany | "Przypisz do mnie" |
| 9 | ADMIN | OPEN | do innej osoby | "Przejmij ticket" |
| 10 | ADMIN | IN_PROGRESS | do siebie | "Oznacz jako rozwiązane" |
| 11 | ADMIN | IN_PROGRESS | do innej osoby | "Przejmij ticket" (nie "Zamknij") |
| 12 | ADMIN | RESOLVED | do siebie | "Zamknij" |
| 13 | ADMIN | RESOLVED | do innej osoby | "Przejmij ticket" (nie "Zamknij") |

---

## 🧪 Plan testowania

### Test 1: Agent widzi tickety przypisane do siebie (spoza kategorii)
**Scenariusz**:
1. Zaloguj się jako ADMIN
2. Utwórz ticket w kategorii "Sprzęt"
3. Przypisz ticket do agenta, który NIE MA dostępu do kategorii "Sprzęt"
4. Wyloguj się i zaloguj jako ten agent
5. **Oczekiwany rezultat**: Agent widzi przypisany ticket na swojej liście

**Priorytet**: ⚠️ **KRYTYCZNY**

---

### Test 2: Agent nie widzi ticketów przypisanych do innych (spoza kategorii)
**Scenariusz**:
1. Zaloguj się jako ADMIN
2. Utwórz ticket w kategorii "Sprzęt"
3. Przypisz ticket do agenta A
4. Wyloguj się i zaloguj jako agent B (nie ma dostępu do "Sprzęt")
5. **Oczekiwany rezultat**: Agent B NIE widzi ticketu agenta A

**Priorytet**: ⚠️ **WYSOKI**

---

### Test 3: Admin widzi tylko odpowiednie przyciski
**Scenariusz**:
1. Zaloguj się jako ADMIN
2. Utwórz ticket i przypisz go do agenta
3. Zobacz ticket na liście jako ADMIN
4. **Oczekiwany rezultat**: 
   - Admin NIE widzi przycisków "Oznacz jako rozwiązane" / "Zamknij"
   - Admin widzi przycisk "Przejmij ticket"

**Priorytet**: ⚠️ **WYSOKI**

---

### Test 4: Admin przejmuje ticket i może go zakończyć
**Scenariusz**:
1. Zaloguj się jako ADMIN
2. Zobacz ticket przypisany do agenta
3. Kliknij "Przejmij ticket"
4. **Oczekiwany rezultat**: 
   - Ticket jest teraz przypisany do admina
   - Admin widzi przyciski "Oznacz jako rozwiązane" / "Zamknij"
   - Agent NIE widzi już tego ticketu na swojej liście (bo jest przypisany do admina spoza jego kategorii)

**Priorytet**: ⚠️ **WYSOKI**

---

### Test 5: Real-time aktualizacja po transferze
**Scenariusz**:
1. Agent A ma przypisany ticket
2. Admin loguje się i przejmuje ticket
3. **Oczekiwany rezultat**: 
   - Agent A widzi natychmiastowe zniknięcie ticketu ze swojej listy (real-time)
   - Admin widzi natychmiastowe pojawienie się ticketu na swojej liście

**Priorytet**: 🔍 **ŚREDNI**

---

## 📈 Kolejność implementacji

1. ✅ **Krok 1**: Dodać userId do props komponentów UI (bezpieczna zmiana)
   - TicketCard
   - TicketList
   - TicketDetailsDialog
   - page.tsx

2. ⚠️ **Krok 2**: Poprawić logikę przycisków w TicketCard (główna zmiana UX)
   - Dodać warunki isAssignedToCurrentUser
   - Dodać przycisk "Przejmij ticket" dla ADMIN

3. ⚠️ **Krok 3**: Poprawić logikę przycisków w TicketDetailsDialog
   - Analogiczne zmiany jak w TicketCard

4. 🔍 **Krok 4**: Weryfikacja logiki filtrowania w TicketQueryBuilder
   - Dodać logi/debugging
   - Sprawdzić wygenerowane zapytania SQL
   - Poprawić jeśli potrzeba

5. 🧪 **Krok 5**: Testy manualne
   - Przeprowadzić wszystkie scenariusze testowe

6. 📝 **Krok 6**: Dokumentacja
   - Zaktualizować README z nowymi funkcjonalnościami
   - Dodać komentarze w kodzie

---

## 🚨 Potencjalne ryzyka

### Ryzyko 1: Breaking changes w API
**Opis**: Dodanie nowego prop `userId` może złamać istniejące komponenty  
**Mitygacja**: TypeScript wyłapie brakujące propsy, pełne pokrycie zmian

### Ryzyko 2: Real-time może nie działać od razu
**Opis**: Po transferze ticketu real-time może nie odświeżyć list agentów  
**Mitygacja**: Sprawdzić hook `useRealtimeTickets` i dodać force refresh po akcjach

### Ryzyko 3: Logika SQL może być niepoprawna
**Opis**: Warunek OR w TicketQueryBuilder może nie zwracać oczekiwanych wyników  
**Mitygacja**: Dodać logi SQL, testować ręcznie zapytania w Supabase SQL Editor

---

## ✅ Kryteria akceptacji

### Musi działać:
- ✅ Agent widzi wszystkie tickety przypisane do siebie (niezależnie od kategorii)
- ✅ Agent widzi nieprzypisane tickety ze swoich kategorii
- ✅ Admin nie widzi mylących przycisków dla ticketów innych osób
- ✅ Admin może przejąć ticket innej osoby
- ✅ Po przejęciu ticketu, poprzedni właściciel przestaje go widzieć (jeśli spoza jego kategorii)

### Powinno działać:
- ✅ Real-time aktualizacje działają natychmiast
- ✅ UI jest spójne między listą a dialogiem szczegółów
- ✅ Wszystkie role (USER, AGENT, ADMIN) działają poprawnie

### Nice to have:
- ✅ Animacje przejść przy zmianie statusu
- ✅ Powiadomienia toast po akcjach
- ✅ Historia zmian właściciela ticketu (audit log)

---

## 📚 Referencje

### Pliki do przejrzenia:
- `app/lib/services/tickets/ticket-query-builder.ts` (logika filtrowania)
- `app/lib/services/tickets/ticket-query.service.ts` (weryfikacja dostępu)
- `app/components/tickets/TicketCard.tsx` (UI przycisków)
- `app/components/tickets/TicketDetailsDialog.tsx` (UI szczegółów)
- `app/lib/services/agent-categories.ts` (logika kategorii agenta)

### Powiązane dokumenty:
- `.ai/prd.md` (Product Requirements Document)
- `.ai/tech-stack.md` (Stack technologiczny)
- `app/lib/database.types.ts` (Typy bazy danych)
- `src/types.ts` (Typy TypeScript)

---

## 📞 Kontakt

**Autor planu**: AI Assistant  
**Data**: 22 października 2025  
**Wersja**: 1.0  

W razie pytań lub wątpliwości - rozpocznij implementację od kroków o najwyższym priorytecie (⚠️ WYSOKI).

