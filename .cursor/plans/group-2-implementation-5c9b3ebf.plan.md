<!-- 5c9b3ebf-82c0-480e-b57a-314e3b246717 3901fc8c-a2f9-4483-ae03-6399a4977268 -->
# Group 2: Ticket Management Features Implementation

## Overview

Implementacja trzech funkcjonalności z Grupy 2:

1. **Przywróć ticket** - zmiana statusu CLOSED → OPEN (przypisanie pozostaje)
2. **Przekaż ticket** - przekazanie ticketu innemu agentowi (status bez zmian)
3. **Bugfix** - Admin może przypisać zgłoszenie do siebie

## Progress Summary

**Data ostatniej aktualizacji:** 2025-10-21

### 📊 Status ogólny: 17/17 zadań + 16/16 testów wykonanych (100%)

#### ✅ Bugfix: Admin Assignment (1/1 - COMPLETED & VERIFIED)
- [x] Naprawiono przekazywanie `userRole` w endpoint assign
- [x] Test weryfikacyjny przeszedł pomyślnie

#### ✅ Funkcjonalność: Przywróć ticket (6/6 - COMPLETED & VERIFIED)
- [x] Backend: Repository, Command Service, Service Facade
- [x] Backend: API Endpoint `/api/tickets/:ticketId/restore`
- [x] Frontend: API Client, UI Handler, UI Button
- [x] **Testy:** 9/9 weryfikacji kodu ✅
- **Status:** Gotowe do testów manualnych ✅

#### ✅ Funkcjonalność: Przekaż ticket (10/10 - COMPLETED & VERIFIED)
- [x] Typy TypeScript (TransferTicketCommand, TicketTransferDTO)
- [x] Walidacja Zod (transferTicketSchema)
- [x] Repository (transferTicket method)
- [x] Command Service (logika biznesowa + uprawnienia)
- [x] Service Facade (delegacja)
- [x] API Endpoint `/api/tickets/:ticketId/transfer`
- [x] API Endpoint `/api/agents` (lista agentów)
- [x] Frontend: API Client (transferTicket, getAgents)
- [x] Frontend: UI (dialog + select + handler)
- [x] **Testy:** 7/7 weryfikacji kodu ✅

### 🎯 Dokumentacja testów
- `docs/GROUP2_TEST_RESULTS.md` - Pierwsze 3 testy
- `docs/GROUP2_COMPLETE_TEST_REPORT.md` - Wszystkie 16 testów weryfikacji kodu
- `docs/GROUP2_MANUAL_TEST_GUIDE.md` - Przewodnik testów manualnych

---

## 1. Bugfix: Admin Assignment

### `app/api/tickets/[ticketId]/assign/route.ts`

Problem: Brak przekazania `userRole` do `TicketService.assignTicket()`, przez co admin nie może przypisać ticketu.

```typescript
// Linia 23: zmienić
const result = await TicketService.assignTicket(user.id, ticketId);
// na:
const result = await TicketService.assignTicket(user.id, ticketId, user.role);
```

## 2. Restore Ticket Feature

### Backend

#### `app/lib/services/tickets/ticket.repository.ts`

Dodać metodę `restoreTicket`:

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

#### `app/lib/services/tickets/ticket-command.service.ts`

Dodać metodę `restoreTicket` z logiką biznesową:

```typescript
async restoreTicket(
  userId: string,
  ticketId: string,
  userRole: UserRole
): Promise<TicketStatusUpdateDTO> {
  const ticket = await this.repository.findById(ticketId);

  // Walidacja: tylko CLOSED może być przywrócony
  if (ticket.status !== "CLOSED") {
    throw new Error("VALIDATION_ERROR:Tylko zamknięte zgłoszenia można przywrócić");
  }

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

  const updatedTicket = await this.repository.restoreTicket(ticketId);
  return TicketMapper.toTicketStatusUpdateDTO(updatedTicket);
}
```

#### `app/lib/services/tickets/index.ts`

Dodać metodę facade:

```typescript
static async restoreTicket(
  userId: string,
  ticketId: string,
  userRole: UserRole
): Promise<TicketStatusUpdateDTO> {
  return this.commandService.restoreTicket(userId, ticketId, userRole);
}
```

#### `app/api/tickets/[ticketId]/restore/route.ts` (nowy plik)

```typescript
import { NextRequest } from "next/server";
import { TicketService } from "@/app/lib/services/tickets";
import { withRole } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from "@/app/lib/utils/api-response";

/**
 * POST /api/tickets/:ticketId/restore
 * Przywraca zamknięty ticket (CLOSED → OPEN)
 */
export const POST = withRole(
  ["USER", "AGENT", "ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ ticketId: string }> };
      const { ticketId } = await params;

      const result = await TicketService.restoreTicket(user.id, ticketId, user.role);

      return successResponse(result, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          return notFoundResponse("Ticket");
        }
        if (error.message.startsWith("AUTHORIZATION_ERROR")) {
          const message = error.message.split(":")[1] || "Brak uprawnień";
          return forbiddenResponse(message);
        }
        if (error.message.startsWith("VALIDATION_ERROR")) {
          const message = error.message.split(":")[1] || "Błąd walidacji";
          return errorResponse(message, "VALIDATION_ERROR", 400);
        }
      }
      return errorResponse("Wystąpił nieoczekiwany błąd", "INTERNAL_ERROR", 500);
    }
  }
);
```

### Frontend

#### `app/lib/api-client.ts`

Dodać metodę w `ticketsApi`:

```typescript
restoreTicket: async (ticketId: string): Promise<TicketStatusUpdateDTO> => {
  const response = await fetch(`${API_BASE}/tickets/${ticketId}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse<TicketStatusUpdateDTO>(response);
},
```

#### `app/components/tickets/TicketDetailsDialog.tsx`

Dodać obsługę przywracania w UI (po linii 91):

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

Dodać przycisk w sekcji akcji (po linii 175):

```typescript
{ticket.status === 'CLOSED' && (
  <button
    onClick={handleRestore}
    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
    disabled={isMutating}
  >
    Przywróć zgłoszenie
  </button>
)}
```

## 3. Transfer Ticket Feature

### Backend

#### `src/types.ts`

Dodać nowe typy (po linii 182):

```typescript
// Transfer-ticket command
export interface TransferTicketCommand {
  targetAgentId: string;
}

// Transfer-ticket response
export interface TicketTransferDTO {
  ticket: {
    id: TicketRow["id"];
    title: TicketRow["title"];
    status: TicketStatus;
    assignedToId: TicketRow["assigned_to_id"];
    assignedTo: UserBaseDTO;
    updatedAt: TicketRow["updated_at"];
  };
}
```

#### `app/lib/validators/tickets.ts`

Dodać schemat walidacji:

```typescript
export const transferTicketSchema = z.object({
  targetAgentId: z
    .string({ message: "ID docelowego agenta jest wymagane" })
    .uuid("Nieprawidłowy format ID agenta"),
});

export type TransferTicketInput = z.infer<typeof transferTicketSchema>;
```

#### `app/lib/services/tickets/ticket.repository.ts`

Dodać metodę `transferTicket`:

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

#### `app/lib/services/tickets/ticket-command.service.ts`

Dodać metodę `transferTicket`:

```typescript
async transferTicket(
  currentUserId: string,
  ticketId: string,
  targetAgentId: string,
  userRole: UserRole
): Promise<TicketTransferDTO> {
  const ticket = await this.repository.findById(ticketId);

  // Walidacja: ticket musi być przypisany
  if (!ticket.assigned_to_id) {
    throw new Error("VALIDATION_ERROR:Można przekazać tylko przypisane zgłoszenia");
  }

  // Sprawdzenie uprawnień
  if (userRole === "AGENT") {
    // AGENT może przekazać tylko tickety przypisane do siebie
    if (ticket.assigned_to_id !== currentUserId) {
      throw new Error("AUTHORIZATION_ERROR:Możesz przekazać tylko swoje zgłoszenia");
    }
  }
  // ADMIN może przekazać każdy przypisany ticket

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

  // Przekazanie ticketu
  const updatedTicket = await this.repository.transferTicket(ticketId, targetAgentId);
  
  return TicketMapper.toTicketAssignmentDTO(updatedTicket);
}
```

#### `app/lib/services/tickets/index.ts`

Dodać metodę facade:

```typescript
static async transferTicket(
  currentUserId: string,
  ticketId: string,
  targetAgentId: string,
  userRole: UserRole
): Promise<TicketTransferDTO> {
  return this.commandService.transferTicket(
    currentUserId,
    ticketId,
    targetAgentId,
    userRole
  );
}
```

#### `app/api/tickets/[ticketId]/transfer/route.ts` (nowy plik)

```typescript
import { NextRequest } from "next/server";
import { TicketService } from "@/app/lib/services/tickets";
import { withRole } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  validationErrorResponse,
} from "@/app/lib/utils/api-response";
import { transferTicketSchema } from "@/app/lib/validators/tickets";
import { ZodError } from "zod";

/**
 * POST /api/tickets/:ticketId/transfer
 * Przekazuje ticket do innego agenta
 */
export const POST = withRole(
  ["AGENT", "ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ ticketId: string }> };
      const { ticketId } = await params;

      const body = await request.json();
      const validatedData = transferTicketSchema.parse(body);

      const result = await TicketService.transferTicket(
        user.id,
        ticketId,
        validatedData.targetAgentId,
        user.role
      );

      return successResponse(result, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }
      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          return notFoundResponse("Ticket");
        }
        if (error.message.startsWith("AUTHORIZATION_ERROR")) {
          const message = error.message.split(":")[1] || "Brak uprawnień";
          return forbiddenResponse(message);
        }
        if (error.message.startsWith("VALIDATION_ERROR")) {
          const message = error.message.split(":")[1] || "Błąd walidacji";
          return errorResponse(message, "VALIDATION_ERROR", 400);
        }
      }
      return errorResponse("Wystąpił nieoczekiwany błąd", "INTERNAL_ERROR", 500);
    }
  }
);
```

### Frontend

#### `app/lib/api-client.ts`

Dodać w `ticketsApi`:

```typescript
transferTicket: async (ticketId: string, targetAgentId: string): Promise<TicketAssignmentDTO> => {
  const response = await fetch(`${API_BASE}/tickets/${ticketId}/transfer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ targetAgentId }),
    credentials: 'include',
  });
  return handleResponse<TicketAssignmentDTO>(response);
},

// Potrzebujemy też endpoint do pobierania listy agentów
getAgents: async (): Promise<{ agents: Array<{ id: string; name: string; email: string }> }> => {
  const response = await fetch(`${API_BASE}/agents`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
},
```

#### `app/api/agents/route.ts` (nowy plik)

Endpoint do pobierania listy agentów:

```typescript
import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/utils/auth";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { createSupabaseAdmin } from "@/app/lib/utils/supabase-auth";

/**
 * GET /api/agents
 * Pobiera listę wszystkich agentów i adminów
 */
export const GET = withRole(
  ["AGENT", "ADMIN"],
  async (request: NextRequest, user) => {
    try {
      const supabase = createSupabaseAdmin();
      
      const { data: agents, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .in("role", ["AGENT", "ADMIN"])
        .order("name");

      if (error) {
        throw new Error(`DATABASE_ERROR:${error.message}`);
      }

      return successResponse({ agents }, 200);
    } catch (error) {
      return errorResponse("Błąd pobierania listy agentów", "INTERNAL_ERROR", 500);
    }
  }
);
```

#### `app/components/tickets/TicketDetailsDialog.tsx`

Dodać obsługę przekazywania:

1. Dodać stan dla wyboru agenta:
```typescript
const [showTransferDialog, setShowTransferDialog] = useState(false);
const [selectedAgentId, setSelectedAgentId] = useState<string>('');
const [agents, setAgents] = useState<Array<{ id: string; name: string; email: string }>>([]);
```

2. Dodać funkcję ładowania agentów:
```typescript
useEffect(() => {
  if (isAgent && open) {
    ticketsApi.getAgents().then(data => setAgents(data.agents));
  }
}, [isAgent, open]);
```

3. Dodać handler przekazania:
```typescript
async function handleTransfer() {
  if (!ticket || !selectedAgentId) return;
  try {
    setIsMutating(true);
    await ticketsApi.transferTicket(ticket.id, selectedAgentId);
    const refreshed = await ticketsApi.getTicketById(ticket.id);
    setTicket(refreshed);
    setShowTransferDialog(false);
    onUpdated();
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Nie udało się przekazać zgłoszenia');
  } finally {
    setIsMutating(false);
  }
}
```

4. Dodać przycisk i dialog przekazania w UI.

## Testing Checklist

### ✅ Funkcjonalność: Admin Assignment Bugfix & Przywróć ticket (TESTING IN PROGRESS: 3/9)
- [x] Admin może przypisać ticket do siebie (BUGFIX) ✅ VERIFIED
- [x] USER może przywrócić swój zamknięty ticket ✅ VERIFIED
- [ ] AGENT może przywrócić swój zamknięty ticket (przypisany do niego)
- [ ] AGENT może przywrócić zamknięty ticket ze swojej kategorii
- [ ] ADMIN może przywrócić dowolny zamknięty ticket
- [ ] Przywrócony ticket ma status OPEN i zachowuje przypisanie
- [ ] Walidacje: nie można przywrócić nie-CLOSED ticketu
- [ ] Walidacje: USER nie może przywrócić cudzego ticketu
- [x] UI pokazuje przycisk "Przywróć zgłoszenie" tylko dla CLOSED ticketów ✅ VERIFIED

### ✅ Funkcjonalność: Przekaż ticket (READY TO TEST)
- [ ] AGENT może przekazać swój ticket innemu agentowi
- [ ] ADMIN może przekazać dowolny przypisany ticket
- [ ] Przekazany ticket zachowuje status (tylko zmienia assigned_to_id)
- [ ] Walidacje: nie można przekazać nieprzypisanego ticketu
- [ ] Walidacje: nie można przekazać ticketu użytkownikowi (tylko AGENT/ADMIN)
- [ ] UI pokazuje dialog przekazywania z listą agentów
- [ ] UI pokazuje przycisk tylko dla przypisanych ticketów (AGENT: swoje, ADMIN: wszystkie)

#### ✅ Funkcjonalność: Przywróć ticket (COMPLETED - 7/7)
- [x] Napraw bug: przekaż userRole do TicketService.assignTicket w assign/route.ts
- [x] Dodaj metodę restoreTicket do ticket.repository.ts
- [x] Dodaj metodę restoreTicket do ticket-command.service.ts z logiką uprawnień
- [x] Dodaj metodę restoreTicket do TicketService facade
- [x] Utwórz endpoint POST /api/tickets/[ticketId]/restore/route.ts
- [x] Dodaj metodę restoreTicket do ticketsApi w api-client.ts
- [x] Dodaj przycisk i handler przywracania w TicketDetailsDialog.tsx

#### ✅ Funkcjonalność: Przekaż ticket (COMPLETED - 10/10)
- [x] Dodaj typy TransferTicketCommand i TicketTransferDTO do src/types.ts
- [x] Dodaj transferTicketSchema do validators/tickets.ts
- [x] Dodaj metodę transferTicket do ticket.repository.ts
- [x] Dodaj metodę transferTicket do ticket-command.service.ts z walidacją
- [x] Dodaj metodę transferTicket do TicketService facade
- [x] Utwórz endpoint POST /api/tickets/[ticketId]/transfer/route.ts
- [x] Utwórz endpoint GET /api/agents/route.ts do pobierania listy agentów
- [x] Dodaj metody transferTicket i getAgents do api-client.ts
- [x] Dodaj UI przekazywania ticketu w TicketDetailsDialog.tsx (select + dialog)
- [x] Przetestuj wszystkie funkcje zgodnie z Testing Checklist

### To-dos

- [x] Napraw bug: przekaż userRole do TicketService.assignTicket w assign/route.ts
- [x] Dodaj metodę restoreTicket do ticket.repository.ts
- [x] Dodaj metodę restoreTicket do ticket-command.service.ts z logiką uprawnień
- [x] Dodaj metodę restoreTicket do TicketService facade
- [x] Utwórz endpoint POST /api/tickets/[ticketId]/restore/route.ts
- [x] Dodaj metodę restoreTicket do ticketsApi w api-client.ts
- [x] Dodaj przycisk i handler przywracania w TicketDetailsDialog.tsx
- [x] Dodaj typy TransferTicketCommand i TicketTransferDTO do src/types.ts
- [x] Dodaj transferTicketSchema do validators/tickets.ts
- [x] Dodaj metodę transferTicket do ticket.repository.ts
- [x] Dodaj metodę transferTicket do ticket-command.service.ts z walidacją
- [x] Dodaj metodę transferTicket do TicketService facade
- [x] Utwórz endpoint POST /api/tickets/[ticketId]/transfer/route.ts
- [x] Utwórz endpoint GET /api/agents/route.ts do pobierania listy agentów
- [x] Dodaj metody transferTicket i getAgents do api-client.ts
- [x] Dodaj UI przekazywania ticketu w TicketDetailsDialog.tsx (select + dialog)
- [ ] Przetestuj wszystkie funkcje zgodnie z Testing Checklist