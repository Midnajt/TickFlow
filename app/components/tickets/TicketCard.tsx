'use client';

import { useMemo } from 'react';
import type { TicketListItemDTO, TicketStatus } from '@/src/types';

interface TicketCardProps {
  ticket: TicketListItemDTO;
  onClick?: () => void;
  onAssign?: () => void;
  onStatusChange?: (status: TicketStatus) => void;
  showActions?: boolean;
  isAgent?: boolean; // true dla AGENT lub ADMIN
}

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  OPEN: { label: 'Otwarte', color: 'text-blue-400', bgColor: 'bg-blue-900/50' },
  IN_PROGRESS: { label: 'W trakcie', color: 'text-yellow-400', bgColor: 'bg-yellow-900/50' },
  RESOLVED: { label: 'Rozwiązane', color: 'text-green-400', bgColor: 'bg-green-900/50' },
  CLOSED: { label: 'Zamknięte', color: 'text-gray-400', bgColor: 'bg-gray-700/50' },
};

export function TicketCard({
  ticket,
  onClick,
  onAssign,
  onStatusChange,
  showActions = false,
  isAgent = false,
}: TicketCardProps) {
  const status = statusConfig[ticket.status];

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('pl-PL', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Europe/Warsaw',
      }),
    []
  );

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors line-clamp-1">
            {ticket.title}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {ticket.subcategory.category.name} → {ticket.subcategory.name}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor} whitespace-nowrap ml-3`}
        >
          {status.label}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>Utworzone przez: {ticket.createdBy.name}</span>
        </div>

        {ticket.assignedTo && (
          <div className="flex items-center text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Przypisane do: {ticket.assignedTo.name}</span>
          </div>
        )}

        <div className="flex items-center text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{dateFmt.format(new Date(ticket.createdAt))}</span>
        </div>
      </div>

      {/* Actions (tylko dla agentów) */}
      {showActions && isAgent && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
          {ticket.status === 'OPEN' && !ticket.assignedTo && onAssign && (
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

          {ticket.assignedTo && onStatusChange && (
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
        </div>
      )}
    </div>
  );
}

