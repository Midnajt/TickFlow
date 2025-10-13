'use client';

import type { TicketStatus } from '@/src/types';

interface TicketFiltersProps {
  status?: TicketStatus | 'ALL';
  assignedToMe?: boolean;
  onStatusChange: (status: TicketStatus | 'ALL') => void;
  onAssignedToMeChange?: (assignedToMe: boolean) => void;
  showAssignedFilter?: boolean;
}

const statusOptions: Array<{ value: TicketStatus | 'ALL'; label: string; color: string }> = [
  { value: 'ALL', label: 'Wszystkie', color: 'bg-gray-700 text-gray-300' },
  { value: 'OPEN', label: 'Otwarte', color: 'bg-blue-900/50 text-blue-400' },
  { value: 'IN_PROGRESS', label: 'W trakcie', color: 'bg-yellow-900/50 text-yellow-400' },
  { value: 'RESOLVED', label: 'Rozwiązane', color: 'bg-green-900/50 text-green-400' },
  { value: 'CLOSED', label: 'Zamknięte', color: 'bg-gray-700 text-gray-400' },
];

export function TicketFilters({
  status = 'ALL',
  assignedToMe = false,
  onStatusChange,
  onAssignedToMeChange,
  showAssignedFilter = false,
}: TicketFiltersProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onStatusChange(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === option.value
                    ? option.color + ' ring-2 ring-blue-500'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned to Me Filter (tylko dla agentów) */}
        {showAssignedFilter && onAssignedToMeChange && (
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-300 mb-2">Filtruj</label>
            <button
              onClick={() => onAssignedToMeChange(!assignedToMe)}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                assignedToMe
                  ? 'bg-purple-900/50 text-purple-400 ring-2 ring-purple-500'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {assignedToMe ? '✓ Moje zgłoszenia' : 'Wszystkie zgłoszenia'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

