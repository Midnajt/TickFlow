'use client';

import { TicketCard } from './TicketCard';
import type { TicketListItemDTO, TicketStatus, UserRole } from '@/src/types';

interface TicketListProps {
  tickets: TicketListItemDTO[];
  isLoading?: boolean;
  userRole: UserRole;
  onTicketClick?: (ticketId: string) => void;
  onAssignTicket?: (ticketId: string) => void;
  onUpdateStatus?: (ticketId: string, status: TicketStatus) => void;
}

export function TicketList({
  tickets,
  isLoading,
  userRole,
  onTicketClick,
  onAssignTicket,
  onUpdateStatus,
}: TicketListProps) {
  const isAgent = userRole === 'AGENT' || userRole === 'ADMIN';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Brak zgłoszeń</h3>
        <p className="text-gray-400">
          {isAgent ? 'Nie masz przypisanych zgłoszeń.' : 'Nie masz jeszcze żadnych zgłoszeń.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onClick={() => onTicketClick?.(ticket.id)}
          onAssign={() => onAssignTicket?.(ticket.id)}
          onStatusChange={(status) => onUpdateStatus?.(ticket.id, status)}
          showActions={isAgent}
          isAgent={isAgent}
        />
      ))}
    </div>
  );
}

