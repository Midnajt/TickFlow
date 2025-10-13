# Komponenty Ticketów - TickFlow

## 📦 Komponenty

### TicketCard.tsx
Wyświetla pojedynczy ticket z pełnymi informacjami.

**Props:**
- `ticket: TicketListItemDTO` - Dane ticketu
- `onClick?: () => void` - Handler kliknięcia
- `onAssign?: () => void` - Handler przypisania (AGENT)
- `onStatusChange?: (status: TicketStatus) => void` - Handler zmiany statusu (AGENT)
- `showActions?: boolean` - Czy pokazywać akcje
- `isAgent?: boolean` - Czy użytkownik jest agentem

### TicketList.tsx
Renderuje listę ticketów z loading i empty states.

**Props:**
- `tickets: TicketListItemDTO[]` - Lista ticketów
- `isLoading?: boolean` - Stan ładowania
- `userRole: UserRole` - Rola użytkownika
- `onTicketClick?: (ticketId: string) => void`
- `onAssignTicket?: (ticketId: string) => void`
- `onUpdateStatus?: (ticketId: string, status: TicketStatus) => void`

### CreateTicketForm.tsx
Formularz tworzenia nowego ticketu z walidacją.

**Props:**
- `onSuccess?: () => void` - Callback po utworzeniu
- `onCancel?: () => void` - Callback anulowania

### TicketFilters.tsx
Filtry statusu i assignedToMe dla listy ticketów.

**Props:**
- `status?: TicketStatus | 'ALL'` - Wybrany status
- `assignedToMe?: boolean` - Filtr "moje zgłoszenia"
- `onStatusChange: (status: TicketStatus | 'ALL') => void`
- `onAssignedToMeChange?: (assignedToMe: boolean) => void`
- `showAssignedFilter?: boolean` - Czy pokazywać filtr (tylko AGENT)

## 🎨 Użycie

```tsx
import { TicketList } from '@/app/components/tickets/TicketList';
import { useTickets } from '@/app/hooks/useTickets';

function MyComponent() {
  const { tickets, isLoading } = useTickets();
  
  return (
    <TicketList
      tickets={tickets}
      isLoading={isLoading}
      userRole="USER"
      onTicketClick={(id) => console.log('Clicked:', id)}
    />
  );
}
```

