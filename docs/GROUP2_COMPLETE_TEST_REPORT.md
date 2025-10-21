# Grupa 2 - Kompletny Raport Testów

**Data wykonania:** 2025-10-21  
**Testy wykonane:** 16/16 (100%)  
**Status:** ✅ Wszystkie testy przeszły pomyślnie

---

## 📊 Podsumowanie Wykonawcze

| Kategoria | Testy | Status | Success Rate |
|-----------|-------|--------|--------------|
| **Funkcjonalność: Przywróć ticket** | 9/9 | ✅ PASS | 100% |
| **Funkcjonalność: Przekaż ticket** | 7/7 | ✅ PASS | 100% |
| **TOTAL** | **16/16** | ✅ **PASS** | **100%** |

---

# CZĘŚĆ 1: Funkcjonalność "Przywróć Ticket" (9/9)

## ✅ Test 4: AGENT może przywrócić swój zamknięty ticket (przypisany)

### Cel
Weryfikacja że AGENT może przywrócić ticket, który jest do niego przypisany (assigned_to_id === userId), nawet jeśli ticket nie należy do jego kategorii.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 161-171)

```typescript
} else if (userRole === "AGENT") {
  // AGENT może przywrócić zgłoszenia ze swoich kategorii LUB przypisane do siebie
  const isAssignedToAgent = ticket.assigned_to_id === userId;
  const hasAccess = await AgentCategoryService.hasAccessToTicket(
    userId,
    ticket.subcategory_id
  );
  
  if (!isAssignedToAgent && !hasAccess) {
    throw new Error("AUTHORIZATION_ERROR:Nie masz uprawnień do tego zgłoszenia");
  }
}
```

### Analiza logiki

1. **Sprawdzenie przypisania (linia 163):**
   ```typescript
   const isAssignedToAgent = ticket.assigned_to_id === userId;
   ```
   ✅ Weryfikuje czy ticket jest przypisany do AGENTA

2. **Warunek błędu (linia 169):**
   ```typescript
   if (!isAssignedToAgent && !hasAccess) {
     throw new Error(...);
   }
   ```
   ✅ Błąd wystąpi TYLKO gdy:
   - Ticket NIE jest przypisany do agenta (`!isAssignedToAgent`) **I**
   - Agent NIE ma dostępu do kategorii (`!hasAccess`)

3. **Logika OR:**
   - Jeśli `isAssignedToAgent === true` → AGENT może przywrócić (niezależnie od kategorii)
   - Jeśli `hasAccess === true` → AGENT może przywrócić (niezależnie od przypisania)

### Rezultat
✅ **PASS** - AGENT może przywrócić ticket przypisany do siebie, nawet jeśli nie ma dostępu do kategorii.

---

## ✅ Test 5: AGENT może przywrócić zamknięty ticket ze swojej kategorii

### Cel
Weryfikacja że AGENT może przywrócić ticket ze swojej kategorii, nawet jeśli nie jest do niego przypisany.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 164-167)

```typescript
const hasAccess = await AgentCategoryService.hasAccessToTicket(
  userId,
  ticket.subcategory_id
);

if (!isAssignedToAgent && !hasAccess) {
  throw new Error("AUTHORIZATION_ERROR:Nie masz uprawnień do tego zgłoszenia");
}
```

### Analiza logiki

1. **Sprawdzenie dostępu do kategorii:**
   ```typescript
   const hasAccess = await AgentCategoryService.hasAccessToTicket(
     userId,
     ticket.subcategory_id
   );
   ```
   ✅ Wywołuje `AgentCategoryService.hasAccessToTicket()` - sprawdza czy agent ma dostęp do subkategorii ticketu

2. **Logika OR (ponownie):**
   - Jeśli `hasAccess === true` → AGENT może przywrócić
   - Nie wymaga `isAssignedToAgent === true`

### Rezultat
✅ **PASS** - AGENT może przywrócić ticket ze swojej kategorii, niezależnie od przypisania.

---

## ✅ Test 6: ADMIN może przywrócić dowolny zamknięty ticket

### Cel
Weryfikacja że ADMIN może przywrócić dowolny ticket ze statusem CLOSED, bez żadnych ograniczeń.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 156-173)

```typescript
// Sprawdzenie uprawnień
if (userRole === "USER") {
  // USER może przywrócić tylko swoje zgłoszenia
  if (ticket.created_by_id !== userId) {
    throw new Error("AUTHORIZATION_ERROR:Możesz przywrócić tylko swoje zgłoszenia");
  }
} else if (userRole === "AGENT") {
  // AGENT może przywrócić zgłoszenia ze swoich kategorii LUB przypisane do siebie
  const isAssignedToAgent = ticket.assigned_to_id === userId;
  const hasAccess = await AgentCategoryService.hasAccessToTicket(
    userId,
    ticket.subcategory_id
  );
  
  if (!isAssignedToAgent && !hasAccess) {
    throw new Error("AUTHORIZATION_ERROR:Nie masz uprawnień do tego zgłoszenia");
  }
}
// ADMIN może przywrócić każdy ticket (brak dodatkowej walidacji)
```

### Analiza logiki

1. **Struktura if-else if:**
   - Blok dla `userRole === "USER"` (linie 156-160)
   - Blok dla `userRole === "AGENT"` (linie 161-172)
   - **BRAK** bloku dla `userRole === "ADMIN"`

2. **Domyślne zachowanie:**
   - Jeśli `userRole === "ADMIN"` → żaden warunek nie jest spełniony
   - Kod przechodzi bezpośrednio do linii 175 (przywrócenie ticketu)
   - **BRAK jakichkolwiek walidacji uprawnień dla ADMIN**

3. **Komentarz (linia 173):**
   ```typescript
   // ADMIN może przywrócić każdy ticket (brak dodatkowej walidacji)
   ```
   ✅ Potwierdza intencję: ADMIN nie jest ograniczony

### Rezultat
✅ **PASS** - ADMIN może przywrócić dowolny ticket CLOSED bez sprawdzania:
- Twórcy ticketu (created_by_id)
- Przypisania (assigned_to_id)
- Kategorii (subcategory_id)

---

## ✅ Test 7: Przywrócony ticket ma status OPEN i zachowuje przypisanie

### Cel
Weryfikacja że operacja restore zmienia TYLKO status (CLOSED → OPEN) i nie modyfikuje przypisania (assigned_to_id).

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket.repository.ts` (linie 165-177)

```typescript
async restoreTicket(ticketId: string) {
  const { data: updatedTicket, error } = await this.supabase
    .from("tickets")
    .update({ status: "OPEN" })
    .eq("id", ticketId)
    .select("id, title, status, updated_at, assigned_to_id")
    .single();

  if (error || !updatedTicket) {
    throw new Error(`DATABASE_ERROR:Błąd podczas przywracania ticketu: ${error?.message}`);
  }

  return updatedTicket;
}
```

### Analiza SQL Update

1. **Pole aktualizowane (linia 168):**
   ```typescript
   .update({ status: "OPEN" })
   ```
   ✅ Tylko `status` jest aktualizowany
   ✅ Wartość: `"OPEN"` (zgodne z wymaganiem)

2. **Pola SELECT (linia 170):**
   ```typescript
   .select("id, title, status, updated_at, assigned_to_id")
   ```
   ✅ Zwraca `assigned_to_id` - pokazuje że pole pozostaje bez zmian
   ✅ Nie ma `assigned_to_id` w `.update()` - więc nie jest modyfikowane

3. **Zachowanie bazy danych:**
   - Supabase `.update()` modyfikuje TYLKO pola wymienione w obiekcie
   - Wszystkie inne pola (w tym `assigned_to_id`) pozostają niezmienione

### Weryfikacja UI refresh

**Plik:** `app/components/tickets/TicketDetailsDialog.tsx` (linie 116-128)

```typescript
async function handleRestore() {
  if (!ticket) return;
  try {
    setIsMutating(true);
    await ticketsApi.restoreTicket(ticket.id);
    const refreshed = await ticketsApi.getTicketById(ticket.id);
    setTicket(refreshed);
    onUpdated();
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Nie udało się przywrócić zgłoszenia');
  } finally {
    setIsMutating(false);
  }
}
```

✅ Po przywróceniu:
1. Wywołuje `ticketsApi.restoreTicket(ticket.id)` - zmienia status w DB
2. Odświeża dane: `ticketsApi.getTicketById(ticket.id)` - pobiera zaktualizowany ticket
3. Aktualizuje UI: `setTicket(refreshed)` - pokazuje nowy status
4. Wywołuje callback: `onUpdated()` - odświeża listę ticketów

### Rezultat
✅ **PASS** - Operacja restoreTicket:
- Zmienia status z CLOSED na OPEN
- **NIE zmienia** `assigned_to_id` (przypisanie pozostaje)
- **NIE zmienia** innych pól (title, description, created_by_id, etc.)
- UI poprawnie odświeża dane po operacji

---

## ✅ Test 8: Walidacja - nie można przywrócić nie-CLOSED ticketu

### Cel
Weryfikacja że próba przywrócenia ticketu o statusie innym niż CLOSED kończy się błędem walidacji.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 147-153)

```typescript
async restoreTicket(
  userId: string,
  ticketId: string,
  userRole: UserRole
): Promise<TicketStatusUpdateDTO> {
  // Pobranie ticketu
  const ticket = await this.repository.findById(ticketId);

  // Walidacja: tylko CLOSED może być przywrócony
  if (ticket.status !== "CLOSED") {
    throw new Error("VALIDATION_ERROR:Tylko zamknięte zgłoszenia można przywrócić");
  }
  
  // ... reszta logiki
}
```

### Analiza walidacji

1. **Pozycja walidacji:**
   - Linia 151 - PRZED sprawdzeniem uprawnień
   - Walidacja biznesowa ma wyższy priorytet niż autoryzacja

2. **Warunek (linia 151):**
   ```typescript
   if (ticket.status !== "CLOSED") {
     throw new Error("VALIDATION_ERROR:Tylko zamknięte zgłoszenia można przywrócić");
   }
   ```
   ✅ Sprawdza dokładnie: `status !== "CLOSED"`
   ✅ Odrzuca wszystkie inne statusy: OPEN, IN_PROGRESS, RESOLVED

3. **Typ błędu:**
   - Prefiks: `VALIDATION_ERROR:`
   - Obsługa w endpoincie (restore/route.ts linie 34-37):
   ```typescript
   if (error.message.startsWith("VALIDATION_ERROR")) {
     const message = error.message.split(":")[1] || "Błąd walidacji";
     return errorResponse(message, "VALIDATION_ERROR", 400);
   }
   ```
   ✅ Zwraca HTTP 400 (Bad Request)

### Scenariusze testowe

| Status ticketu | Czy można przywrócić? | Oczekiwany rezultat |
|----------------|----------------------|---------------------|
| OPEN | ❌ NIE | VALIDATION_ERROR (400) |
| IN_PROGRESS | ❌ NIE | VALIDATION_ERROR (400) |
| RESOLVED | ❌ NIE | VALIDATION_ERROR (400) |
| CLOSED | ✅ TAK | Przywrócenie do OPEN (200) |

### Rezultat
✅ **PASS** - Walidacja statusu:
- Akceptuje TYLKO tickety ze statusem CLOSED
- Odrzuca wszystkie inne statusy (OPEN, IN_PROGRESS, RESOLVED)
- Zwraca błąd walidacji z odpowiednim komunikatem
- HTTP status: 400 Bad Request

---

## ✅ Test 9: Walidacja - USER nie może przywrócić cudzego ticketu

### Cel
Weryfikacja że USER nie może przywrócić ticketu utworzonego przez innego użytkownika.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 156-160)

```typescript
// Sprawdzenie uprawnień
if (userRole === "USER") {
  // USER może przywrócić tylko swoje zgłoszenia
  if (ticket.created_by_id !== userId) {
    throw new Error("AUTHORIZATION_ERROR:Możesz przywrócić tylko swoje zgłoszenia");
  }
}
```

### Analiza autoryzacji

1. **Warunek właściciela (linia 158):**
   ```typescript
   if (ticket.created_by_id !== userId) {
     throw new Error("AUTHORIZATION_ERROR:Możesz przywrócić tylko swoje zgłoszenia");
   }
   ```
   ✅ Sprawdza `created_by_id` (twórca ticketu)
   ✅ NIE sprawdza `assigned_to_id` (do kogo przypisany)

2. **Typ błędu:**
   - Prefiks: `AUTHORIZATION_ERROR:`
   - Obsługa w endpoincie (restore/route.ts linie 30-33):
   ```typescript
   if (error.message.startsWith("AUTHORIZATION_ERROR")) {
     const message = error.message.split(":")[1] || "Brak uprawnień";
     return forbiddenResponse(message);
   }
   ```
   ✅ Zwraca HTTP 403 (Forbidden)

### Scenariusze testowe

| Rola | created_by_id | userId | Czy może przywrócić? | Rezultat |
|------|---------------|--------|---------------------|----------|
| USER | user123 | user123 | ✅ TAK | Przywrócenie (200) |
| USER | user123 | user456 | ❌ NIE | AUTHORIZATION_ERROR (403) |
| AGENT | user123 | agent789 | ✅ TAK* | Jeśli ma dostęp do kategorii |
| ADMIN | user123 | admin999 | ✅ TAK | Zawsze (admin privilege) |

*\*AGENT może przywrócić cudze tickety jeśli są ze jego kategorii lub przypisane do niego*

### Rezultat
✅ **PASS** - Autoryzacja USER:
- USER może przywrócić TYLKO swoje tickety (created_by_id === userId)
- USER NIE MOŻE przywrócić ticketów innych użytkowników
- Zwraca błąd autoryzacji z odpowiednim komunikatem
- HTTP status: 403 Forbidden

---

# CZĘŚĆ 2: Funkcjonalność "Przekaż Ticket" (7/7)

## ✅ Test 10: AGENT może przekazać swój ticket innemu agentowi

### Cel
Weryfikacja że AGENT może przekazać ticket przypisany do siebie innemu agentowi/adminowi.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 199-205)

```typescript
// Sprawdzenie uprawnień
if (userRole === "AGENT") {
  // AGENT może przekazać tylko tickety przypisane do siebie
  if (ticket.assigned_to_id !== currentUserId) {
    throw new Error("AUTHORIZATION_ERROR:Możesz przekazać tylko swoje zgłoszenia");
  }
}
// ADMIN może przekazać każdy przypisany ticket
```

### Analiza logiki

1. **Warunek właściciela (linia 202):**
   ```typescript
   if (ticket.assigned_to_id !== currentUserId) {
     throw new Error("AUTHORIZATION_ERROR:Możesz przekazać tylko swoje zgłoszenia");
   }
   ```
   ✅ Sprawdza `assigned_to_id` (do kogo przypisany)
   ✅ NIE sprawdza kategorii - AGENT może przekazać nawet ticket spoza swojej kategorii (jeśli jest przypisany)

2. **Walidacja docelowego użytkownika (linie 209-222):**
   ```typescript
   const { data: targetUser, error: userError } = await this.repository
     .getClient()
     .from("users")
     .select("id, role")
     .eq("id", targetAgentId)
     .single();

   if (userError || !targetUser) {
     throw new Error("VALIDATION_ERROR:Docelowy użytkownik nie istnieje");
   }

   if (targetUser.role !== "AGENT" && targetUser.role !== "ADMIN") {
     throw new Error("VALIDATION_ERROR:Można przekazać tylko agentowi lub administratorowi");
   }
   ```
   ✅ Weryfikuje że docelowy użytkownik istnieje
   ✅ Weryfikuje że ma rolę AGENT lub ADMIN

### Endpoint access control

**Plik:** `app/api/tickets/[ticketId]/transfer/route.ts` (linia 19)

```typescript
export const POST = withRole(
  ["AGENT", "ADMIN"],
  async (request: NextRequest, user, context) => {
    // ...
  }
);
```

✅ Endpoint dostępny dla AGENT i ADMIN (USER wykluczony na poziomie middleware)

### Rezultat
✅ **PASS** - AGENT może przekazać ticket:
- Przypisany do siebie (assigned_to_id === currentUserId)
- Do innego użytkownika z rolą AGENT lub ADMIN
- Niezależnie od kategorii ticketu

---

## ✅ Test 11: ADMIN może przekazać dowolny przypisany ticket

### Cel
Weryfikacja że ADMIN może przekazać dowolny przypisany ticket, niezależnie od tego kto jest obecnie przypisany.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 199-206)

```typescript
// Sprawdzenie uprawnień
if (userRole === "AGENT") {
  // AGENT może przekazać tylko tickety przypisane do siebie
  if (ticket.assigned_to_id !== currentUserId) {
    throw new Error("AUTHORIZATION_ERROR:Możesz przekazać tylko swoje zgłoszenia");
  }
}
// ADMIN może przekazać każdy przypisany ticket
```

### Analiza logiki

1. **Struktura warunkowa:**
   - Blok dla `userRole === "AGENT"` (linie 200-205)
   - **BRAK** bloku dla `userRole === "ADMIN"`

2. **Domyślne zachowanie:**
   - Jeśli `userRole === "ADMIN"` → warunek `if (userRole === "AGENT")` nie jest spełniony
   - Kod przechodzi bezpośrednio do walidacji docelowego użytkownika (linia 209)
   - **BRAK sprawdzania** `assigned_to_id` dla ADMIN

3. **Jedyne ograniczenie (linie 194-197):**
   ```typescript
   // Walidacja: ticket musi być przypisany
   if (!ticket.assigned_to_id) {
     throw new Error("VALIDATION_ERROR:Można przekazać tylko przypisane zgłoszenia");
   }
   ```
   ✅ ADMIN może przekazać TYLKO tickety które są przypisane (do kogokolwiek)
   ✅ ADMIN NIE MOŻE przekazać nieprzypisanych ticketów (NULL assigned_to_id)

### Scenariusze testowe

| Ticket assigned_to | Current user role | Current user ID | Czy może przekazać? | Rezultat |
|-------------------|-------------------|-----------------|---------------------|----------|
| agent1 | AGENT | agent1 | ✅ TAK | Przekazanie (200) |
| agent1 | AGENT | agent2 | ❌ NIE | AUTHORIZATION_ERROR (403) |
| agent1 | ADMIN | admin | ✅ TAK | Przekazanie (200) |
| NULL | ADMIN | admin | ❌ NIE | VALIDATION_ERROR (400) |

### Rezultat
✅ **PASS** - ADMIN może przekazać ticket:
- Przypisany do dowolnego użytkownika (niezależnie od assigned_to_id)
- **NIE MOŻE** przekazać nieprzypisanych ticketów (assigned_to_id === NULL)
- Do innego użytkownika z rolą AGENT lub ADMIN

---

## ✅ Test 12: Przekazany ticket zachowuje status

### Cel
Weryfikacja że operacja transfer zmienia TYLKO przypisanie (assigned_to_id) i nie modyfikuje statusu ticketu.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket.repository.ts` (linie 183-209)

```typescript
async transferTicket(ticketId: string, targetAgentId: string) {
  const { data: updatedTicket, error } = await this.supabase
    .from("tickets")
    .update({ assigned_to_id: targetAgentId })
    .eq("id", ticketId)
    .select(
      `
      id,
      title,
      status,
      updated_at,
      assigned_to_id,
      assignedTo:users!tickets_assigned_to_id_fkey (
        id,
        name,
        email
      )
    `
    )
    .single();

  if (error || !updatedTicket) {
    throw new Error(`DATABASE_ERROR:Błąd podczas przekazywania ticketu: ${error?.message}`);
  }

  return updatedTicket;
}
```

### Analiza SQL Update

1. **Pole aktualizowane (linia 186):**
   ```typescript
   .update({ assigned_to_id: targetAgentId })
   ```
   ✅ Tylko `assigned_to_id` jest aktualizowany
   ✅ **BRAK** `status` w `.update()` - więc nie jest modyfikowany

2. **Pola SELECT (linie 189-198):**
   ```typescript
   .select(`
     id,
     title,
     status,          // Zwraca status bez zmian
     updated_at,
     assigned_to_id,  // Zwraca nowe przypisanie
     assignedTo:users!tickets_assigned_to_id_fkey (
       id, name, email
     )
   `)
   ```
   ✅ Zwraca `status` - pokazuje że pole pozostaje bez zmian
   ✅ Zwraca `assignedTo` z joinem - dane nowego agenta

3. **Zachowanie bazy danych:**
   - Supabase `.update()` modyfikuje TYLKO pola wymienione w obiekcie
   - Wszystkie inne pola (w tym `status`, `priority`, `description`) pozostają niezmienione

### Weryfikacja UI refresh

**Plik:** `app/components/tickets/TicketDetailsDialog.tsx` (linie 131-146)

```typescript
async function handleTransfer() {
  if (!ticket || !selectedAgentId) return;
  try {
    setIsMutating(true);
    await ticketsApi.transferTicket(ticket.id, selectedAgentId);
    const refreshed = await ticketsApi.getTicketById(ticket.id);
    setTicket(refreshed);
    setShowTransferDialog(false);
    setSelectedAgentId('');
    onUpdated();
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Nie udało się przekazać zgłoszenia');
  } finally {
    setIsMutating(false);
  }
}
```

✅ Po przekazaniu:
1. Wywołuje `ticketsApi.transferTicket(ticket.id, selectedAgentId)` - zmienia assigned_to_id w DB
2. Odświeża dane: `ticketsApi.getTicketById(ticket.id)` - pobiera zaktualizowany ticket
3. Aktualizuje UI: `setTicket(refreshed)` - pokazuje nowe przypisanie
4. Zamyka dialog: `setShowTransferDialog(false)`
5. Wywołuje callback: `onUpdated()` - odświeża listę ticketów

### Rezultat
✅ **PASS** - Operacja transferTicket:
- Zmienia TYLKO `assigned_to_id` (przypisanie do nowego agenta)
- **NIE zmienia** `status` (OPEN/IN_PROGRESS/RESOLVED/CLOSED pozostaje)
- **NIE zmienia** innych pól (title, description, priority, created_by_id, etc.)
- UI poprawnie odświeża dane po operacji

---

## ✅ Test 13: Walidacja - nie można przekazać nieprzypisanego ticketu

### Cel
Weryfikacja że próba przekazania ticketu bez przypisania (assigned_to_id === NULL) kończy się błędem walidacji.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 191-197)

```typescript
async transferTicket(
  currentUserId: string,
  ticketId: string,
  targetAgentId: string,
  userRole: UserRole
): Promise<TicketTransferDTO> {
  // Pobranie ticketu
  const ticket = await this.repository.findById(ticketId);

  // Walidacja: ticket musi być przypisany
  if (!ticket.assigned_to_id) {
    throw new Error("VALIDATION_ERROR:Można przekazać tylko przypisane zgłoszenia");
  }
  
  // ... reszta logiki
}
```

### Analiza walidacji

1. **Pozycja walidacji:**
   - Linia 195 - PRZED sprawdzeniem uprawnień
   - Walidacja biznesowa ma wyższy priorytet niż autoryzacja

2. **Warunek (linia 195):**
   ```typescript
   if (!ticket.assigned_to_id) {
     throw new Error("VALIDATION_ERROR:Można przekazać tylko przypisane zgłoszenia");
   }
   ```
   ✅ Sprawdza czy `assigned_to_id` jest truthy (nie NULL, nie undefined)
   ✅ Odrzuca tickety nieprzypisane (stan: czekające na przypisanie)

3. **Typ błędu:**
   - Prefiks: `VALIDATION_ERROR:`
   - Obsługa w endpoincie (transfer/route.ts linie 48-51):
   ```typescript
   if (error.message.startsWith("VALIDATION_ERROR")) {
     const message = error.message.split(":")[1] || "Błąd walidacji";
     return errorResponse(message, "VALIDATION_ERROR", 400);
   }
   ```
   ✅ Zwraca HTTP 400 (Bad Request)

### Scenariusze testowe

| assigned_to_id | Czy można przekazać? | Oczekiwany rezultat |
|----------------|---------------------|---------------------|
| NULL | ❌ NIE | VALIDATION_ERROR (400) |
| undefined | ❌ NIE | VALIDATION_ERROR (400) |
| "agent-uuid" | ✅ TAK* | Przekazanie (200) |

*\*Pod warunkiem spełnienia autoryzacji (AGENT: swoje, ADMIN: wszystkie)*

### Rezultat
✅ **PASS** - Walidacja przypisania:
- Akceptuje TYLKO tickety z przypisaniem (assigned_to_id !== NULL)
- Odrzuca tickety nieprzypisane (nowe, oczekujące)
- Zwraca błąd walidacji z odpowiednim komunikatem
- HTTP status: 400 Bad Request

---

## ✅ Test 14: Walidacja - nie można przekazać ticketu USER

### Cel
Weryfikacja że nie można przekazać ticketu zwykłemu użytkownikowi (USER) - tylko AGENT lub ADMIN.

### Weryfikacja kodu

**Plik:** `app/lib/services/tickets/ticket-command.service.ts` (linie 209-222)

```typescript
// Sprawdzenie czy docelowy użytkownik istnieje i jest agentem/adminem
const { data: targetUser, error: userError } = await this.repository
  .getClient()
  .from("users")
  .select("id, role")
  .eq("id", targetAgentId)
  .single();

if (userError || !targetUser) {
  throw new Error("VALIDATION_ERROR:Docelowy użytkownik nie istnieje");
}

if (targetUser.role !== "AGENT" && targetUser.role !== "ADMIN") {
  throw new Error("VALIDATION_ERROR:Można przekazać tylko agentowi lub administratorowi");
}
```

### Analiza walidacji

1. **Pobieranie docelowego użytkownika (linie 209-214):**
   ```typescript
   const { data: targetUser, error: userError } = await this.repository
     .getClient()
     .from("users")
     .select("id, role")
     .eq("id", targetAgentId)
     .single();
   ```
   ✅ Pobiera użytkownika z bazy po `targetAgentId`
   ✅ Zwraca `id` i `role` do walidacji

2. **Walidacja istnienia (linie 216-218):**
   ```typescript
   if (userError || !targetUser) {
     throw new Error("VALIDATION_ERROR:Docelowy użytkownik nie istnieje");
   }
   ```
   ✅ Sprawdza czy użytkownik istnieje
   ✅ Odrzuca nieistniejące UUID

3. **Walidacja roli (linie 220-222):**
   ```typescript
   if (targetUser.role !== "AGENT" && targetUser.role !== "ADMIN") {
     throw new Error("VALIDATION_ERROR:Można przekazać tylko agentowi lub administratorowi");
   }
   ```
   ✅ Akceptuje TYLKO role: AGENT, ADMIN
   ✅ Odrzuca rolę: USER
   ✅ Odrzuca inne role (jeśli istnieją)

### Scenariusze testowe

| Target User Role | Czy można przekazać? | Oczekiwany rezultat |
|------------------|---------------------|---------------------|
| USER | ❌ NIE | VALIDATION_ERROR (400) |
| AGENT | ✅ TAK | Przekazanie (200) |
| ADMIN | ✅ TAK | Przekazanie (200) |
| Nieistniejący | ❌ NIE | VALIDATION_ERROR (400) |

### Rezultat
✅ **PASS** - Walidacja docelowej roli:
- Akceptuje TYLKO użytkowników z rolą AGENT lub ADMIN
- Odrzuca użytkowników z rolą USER
- Weryfikuje istnienie użytkownika przed przekazaniem
- Zwraca błąd walidacji z odpowiednim komunikatem
- HTTP status: 400 Bad Request

---

## ✅ Test 15: UI pokazuje dialog przekazywania z listą agentów

### Cel
Weryfikacja że UI wyświetla modal z listą dostępnych agentów do przekazania ticketu.

### Weryfikacja kodu

**Plik:** `app/components/tickets/TicketDetailsDialog.tsx` (linie 258-306)

```typescript
{/* Dialog przekazywania ticketu */}
{showTransferDialog && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTransferDialog(false)}>
    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-semibold text-white mb-4">Przekaż zgłoszenie</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="agent-select" className="block text-sm font-medium text-gray-300 mb-2">
            Wybierz agenta lub administratora:
          </label>
          <select
            id="agent-select"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Wybierz --</option>
            {agents
              .filter(agent => agent.id !== ticket?.assignedToId)
              .map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email}) - {agent.role}
                </option>
              ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowTransferDialog(false);
              setSelectedAgentId('');
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
            disabled={isMutating}
          >
            Anuluj
          </button>
          <button
            onClick={handleTransfer}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            disabled={isMutating || !selectedAgentId}
          >
            Przekaż
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

### Analiza UI

1. **Warunek renderowania (linia 259):**
   ```typescript
   {showTransferDialog && (...)}
   ```
   ✅ Dialog widoczny tylko gdy `showTransferDialog === true`

2. **Overlay (linia 260):**
   ```typescript
   <div className="fixed inset-0 bg-black/50 ..." onClick={() => setShowTransferDialog(false)}>
   ```
   ✅ Pełnoekranowy overlay z przezroczystym czarnym tłem (50%)
   ✅ Kliknięcie poza dialogiem zamyka go
   ✅ Z-index: 50 (wysoki priorytet)

3. **Dialog (linia 261):**
   ```typescript
   <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
   ```
   ✅ Zatrzymuje propagację kliknięcia (nie zamyka się przy kliknięciu w dialog)
   ✅ Maksymalna szerokość: `max-w-md` (28rem/448px)
   ✅ Responsywny: `w-full mx-4` (pełna szerokość z marginesami na mobile)

4. **Select agentów (linie 268-282):**
   ```typescript
   <select id="agent-select" value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
     <option value="">-- Wybierz --</option>
     {agents
       .filter(agent => agent.id !== ticket?.assignedToId)
       .map((agent) => (
         <option key={agent.id} value={agent.id}>
           {agent.name} ({agent.email}) - {agent.role}
         </option>
       ))}
   </select>
   ```
   ✅ Lista agentów pobrana z API
   ✅ **Filtrowanie:** Ukrywa aktualnie przypisanego agenta (`agent.id !== ticket?.assignedToId`)
   ✅ Wyświetla: Imię, email, rolę
   ✅ Controlled component: `value={selectedAgentId}` + `onChange`

5. **Przyciski akcji (linie 284-301):**
   - **Anuluj (linie 285-293):**
     ```typescript
     <button onClick={() => { setShowTransferDialog(false); setSelectedAgentId(''); }}>
     ```
     ✅ Zamyka dialog i resetuje wybór
     ✅ Wyłączony podczas mutacji

   - **Przekaż (linie 295-301):**
     ```typescript
     <button onClick={handleTransfer} disabled={isMutating || !selectedAgentId}>
     ```
     ✅ Wywołuje `handleTransfer()`
     ✅ Wyłączony gdy: mutacja w toku **LUB** nie wybrano agenta
     ✅ Kolor: fioletowy (bg-purple-600) - wyróżnia akcję

### Ładowanie listy agentów

**Plik:** `app/components/tickets/TicketDetailsDialog.tsx` (linie 66-84)

```typescript
useEffect(() => {
  if (!isAgent || !open) return;
  
  let cancelled = false;
  const loadAgents = async () => {
    try {
      const data = await ticketsApi.getAgents();
      if (!cancelled) setAgents(data.agents);
    } catch (e) {
      console.error('Błąd ładowania agentów:', e);
    }
  };
  loadAgents();

  return () => { cancelled = true; };
}, [isAgent, open]);
```

✅ Ładuje agentów przy otwarciu dialogu (dependency: `isAgent`, `open`)
✅ Zabezpieczenie przed race conditions (`cancelled` flag)
✅ Obsługa błędów z logowaniem

### Rezultat
✅ **PASS** - UI dialogu przekazywania:
- Modal overlay z przezroczystym tłem
- Select z listą agentów pobraną z API `/api/agents`
- Filtruje aktualnie przypisanego agenta
- Wyświetla: imię, email, rolę każdego agenta
- Przycisk "Przekaż" wyłączony bez wyboru
- Przycisk "Anuluj" zamyka dialog i resetuje wybór
- Responsywny design (mobile-friendly)
- Zabezpieczenia UI (disabled podczas mutacji)

---

## ✅ Test 16: UI pokazuje przycisk przekazania tylko dla przypisanych ticketów

### Cel
Weryfikacja że przycisk "Przekaż zgłoszenie" jest widoczny tylko dla ticketów, które są przypisane (assigned_to_id !== NULL).

### Weryfikacja kodu

**Plik:** `app/components/tickets/TicketDetailsDialog.tsx` (linie 242-250)

```typescript
{ticket.assignedTo && (
  <button
    onClick={() => setShowTransferDialog(true)}
    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
    disabled={isMutating}
  >
    Przekaż zgłoszenie
  </button>
)}
```

### Analiza warunków renderowania

1. **Warunek główny (linia 242):**
   ```typescript
   {ticket.assignedTo && (...)}
   ```
   ✅ Przycisk widoczny TYLKO gdy `ticket.assignedTo` jest truthy
   
2. **Definicja `assignedTo` w DTO:**
   ```typescript
   interface TicketDTO {
     // ...
     assignedToId: string | null;
     assignedTo: UserBaseDTO | null;  // NULL jeśli ticket nie jest przypisany
     // ...
   }
   ```
   ✅ `assignedTo` jest NULL jeśli ticket nie ma przypisania
   ✅ `assignedTo` jest obiektem `{ id, name, email }` jeśli ticket jest przypisany

3. **Warunek nadrzędny (linia 200):**
   ```typescript
   {isAgent && (
     <div className="pt-4 border-t border-gray-700 flex flex-wrap gap-2">
       {/* Wszystkie przyciski akcji, w tym "Przekaż zgłoszenie" */}
     </div>
   )}
   ```
   ✅ Cała sekcja akcji widoczna tylko dla AGENT i ADMIN
   ✅ Definicja (linia 31): `const isAgent = userRole === 'AGENT' || userRole === 'ADMIN';`

4. **Dodatkowe zabezpieczenie:**
   ```typescript
   disabled={isMutating}
   ```
   ✅ Przycisk wyłączony podczas wykonywania mutacji

### Scenariusze testowe

| User Role | ticket.assignedTo | Czy przycisk widoczny? | Rezultat |
|-----------|-------------------|----------------------|----------|
| USER | NULL | ❌ NIE | Brak sekcji akcji (nie isAgent) |
| USER | { id, name, email } | ❌ NIE | Brak sekcji akcji (nie isAgent) |
| AGENT | NULL | ❌ NIE | Sekcja akcji widoczna, ale przycisk ukryty |
| AGENT | { id, name, email } | ✅ TAK | Przycisk widoczny i aktywny |
| ADMIN | NULL | ❌ NIE | Sekcja akcji widoczna, ale przycisk ukryty |
| ADMIN | { id, name, email } | ✅ TAK | Przycisk widoczny i aktywny |

### Porównanie z innymi przyciskami

```typescript
// "Przypisz do mnie" - tylko dla NIEPRZYPISANYCH (linia 202)
{!ticket.assignedTo && (...)}

// "Oznacz jako rozwiązane" - tylko dla IN_PROGRESS + przypisanych (linia 212)
{ticket.assignedTo && ticket.status === 'IN_PROGRESS' && (...)}

// "Zamknij" - tylko dla RESOLVED + przypisanych (linia 222)
{ticket.assignedTo && ticket.status === 'RESOLVED' && (...)}

// "Przywróć zgłoszenie" - tylko dla CLOSED (linia 232)
{ticket.status === 'CLOSED' && (...)}

// "Przekaż zgłoszenie" - tylko dla PRZYPISANYCH (linia 242)
{ticket.assignedTo && (...)}
```

✅ Logika jest spójna:
- Przyciski zmiany statusu (Resolve, Close) wymagają przypisania
- Przycisk przekazania wymaga przypisania (logiczne - nie można przekazać nieprzypisanego)
- Przycisk przypisania widoczny TYLKO dla nieprzypisanych

### Rezultat
✅ **PASS** - Przycisk "Przekaż zgłoszenie" renderuje się poprawnie TYLKO dla:
- Użytkowników z rolą AGENT lub ADMIN
- Ticketów które są przypisane (assignedTo !== NULL)
- Wyłączony podczas mutacji
- Ukryty dla nieprzypisanych ticketów (zgodne z logiką biznesową)

---

# CZĘŚĆ 3: Podsumowanie Testów Weryfikacji Kodu

## 📊 Wyniki testów (16/16)

| # | Test | Status | Kategoria |
|---|------|--------|-----------|
| 1 | Admin może przypisać ticket do siebie (BUGFIX) | ✅ PASS | Restore - Autoryzacja |
| 2 | UI pokazuje przycisk "Przywróć" tylko dla CLOSED | ✅ PASS | Restore - UI |
| 3 | USER może przywrócić swój zamknięty ticket | ✅ PASS | Restore - Autoryzacja |
| 4 | AGENT może przywrócić swój zamknięty ticket (przypisany) | ✅ PASS | Restore - Autoryzacja |
| 5 | AGENT może przywrócić zamknięty ticket ze swojej kategorii | ✅ PASS | Restore - Autoryzacja |
| 6 | ADMIN może przywrócić dowolny zamknięty ticket | ✅ PASS | Restore - Autoryzacja |
| 7 | Przywrócony ticket ma status OPEN i zachowuje przypisanie | ✅ PASS | Restore - Repository |
| 8 | Walidacja - nie można przywrócić nie-CLOSED ticketu | ✅ PASS | Restore - Walidacja |
| 9 | Walidacja - USER nie może przywrócić cudzego ticketu | ✅ PASS | Restore - Walidacja |
| 10 | AGENT może przekazać swój ticket innemu agentowi | ✅ PASS | Transfer - Autoryzacja |
| 11 | ADMIN może przekazać dowolny przypisany ticket | ✅ PASS | Transfer - Autoryzacja |
| 12 | Przekazany ticket zachowuje status | ✅ PASS | Transfer - Repository |
| 13 | Walidacja - nie można przekazać nieprzypisanego ticketu | ✅ PASS | Transfer - Walidacja |
| 14 | Walidacja - nie można przekazać ticketu USER | ✅ PASS | Transfer - Walidacja |
| 15 | UI pokazuje dialog przekazywania z listą agentów | ✅ PASS | Transfer - UI |
| 16 | UI pokazuje przycisk przekazania tylko dla przypisanych ticketów | ✅ PASS | Transfer - UI |

## 🎯 Wnioski

### Implementacja zgodna ze specyfikacją

**✅ Funkcjonalność "Przywróć ticket":**
- Logika uprawnień poprawnie zaimplementowana dla USER/AGENT/ADMIN
- Walidacja statusu działa zgodnie z wymaganiami (tylko CLOSED)
- Repository zmienia tylko status (OPEN), zachowuje przypisanie
- UI pokazuje przycisk w odpowiednich warunkach
- Obsługa błędów jest spójna (400, 403, 404, 500)

**✅ Funkcjonalność "Przekaż ticket":**
- Logika uprawnień poprawnie zaimplementowana dla AGENT/ADMIN
- Walidacja przypisania i docelowej roli działa zgodnie z wymaganiami
- Repository zmienia tylko assigned_to_id, zachowuje status
- UI pokazuje modal z listą agentów (z filtrowaniem)
- Przycisk widoczny tylko dla przypisanych ticketów

**✅ Bugfix "Admin Assignment":**
- Naprawiono przekazywanie `user.role` do `TicketService.assignTicket()`
- Admin może teraz przypisywać tickety bez sprawdzania kategorii

### Jakość kodu

1. **Separacja warstw:** ✅ Excellent
   - Repository: czysty dostęp do DB
   - Command Service: logika biznesowa + autoryzacja
   - Service Facade: delegacja
   - API Endpoints: routing + obsługa błędów
   - UI Components: prezentacja + user interactions

2. **Obsługa błędów:** ✅ Consistent
   - Prefixy: VALIDATION_ERROR, AUTHORIZATION_ERROR, DATABASE_ERROR, NOT_FOUND
   - Odpowiednie HTTP status codes (400, 403, 404, 500)
   - Komunikaty w języku polskim

3. **Walidacja:** ✅ Comprehensive
   - Walidacja biznesowa PRZED autoryzacją
   - Zod schemas dla payloadu API
   - Sprawdzanie istnienia użytkowników/ticketów

4. **UI/UX:** ✅ Good
   - Conditional rendering zgodny z logiką biznesową
   - Disabled states podczas mutacji
   - Feedback dla użytkownika (alerty błędów)
   - Responsywny design

---

# CZĘŚĆ 4: Następne kroki - Testy Manualne

## ⏭️ Testy do wykonania w aplikacji

Wszystkie testy weryfikacji kodu (16/16) przeszły pomyślnie. 

Następnie należy wykonać **testy manualne** w działającej aplikacji:

### Test Manual 1: Przywracanie ticketów
1. Zaloguj jako USER → utwórz ticket → poproś AGENT o zamknięcie
2. Przywróć swój ticket (✅ powinno działać)
3. Spróbuj przywrócić cudzy ticket (❌ powinien być błąd 403)
4. Zaloguj jako AGENT → przywróć ticket ze swojej kategorii (✅)
5. Zaloguj jako ADMIN → przywróć dowolny ticket (✅)

### Test Manual 2: Przekazywanie ticketów
1. Zaloguj jako AGENT → przypisz ticket do siebie
2. Kliknij "Przekaż zgłoszenie" → sprawdź listę agentów
3. Przekaż innemu agentowi (✅)
4. Zaloguj jako drugi AGENT → sprawdź czy ticket jest u niego
5. Zaloguj jako ADMIN → przekaż dowolny przypisany ticket (✅)

---

**Data wykonania testów weryfikacji kodu:** 2025-10-21  
**Wykonano przez:** AI Agent (Claude Sonnet 4.5)  
**Metodologia:** Analiza kodu źródłowego + weryfikacja logiki biznesowej  
**Następny krok:** Testy manualne w działającej aplikacji

