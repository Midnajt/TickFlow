'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TicketList } from '@/app/components/tickets/TicketList';
import { TicketFilters } from '@/app/components/tickets/TicketFilters';
import { CreateTicketForm } from '@/app/components/tickets/CreateTicketForm';
import { useTickets } from '@/app/hooks/useTickets';
import { useRealtimeTickets } from '@/app/hooks/useRealtimeTickets';
import { ticketsApi } from '@/app/lib/api-client';
import type { TicketStatus, UserSessionDTO } from '@/src/types';
import { authApi } from '@/app/lib/api-client';
import { useEffect } from 'react';
import { TicketDetailsDialog } from '@/app/components/tickets/TicketDetailsDialog';

export default function TicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSessionDTO | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await authApi.getSession();
        setUser(session.user);
      } catch {
        router.push('/login');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  // Fetch tickets with filters
  const {
    tickets,
    pagination,
    isLoading,
    error,
    refetch,
  } = useTickets({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    assignedToMe: assignedToMeFilter,
    autoRefresh: false, // Używamy Realtime zamiast polling
  });

  // Real-time updates
  const { isConnected: realtimeConnected } = useRealtimeTickets(refetch);

  const isAgent = user?.role === 'AGENT';
  const isAdmin = user?.role === 'ADMIN';
  const canManageTickets = isAgent || isAdmin;

  const handleAssignTicket = async (ticketId: string) => {
    try {
      await ticketsApi.assignTicket(ticketId);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Nie udało się przypisać zgłoszenia');
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      await ticketsApi.updateTicketStatus(ticketId, status);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Nie udało się zaktualizować statusu');
    }
  };

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDetailsOpen(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refetch();
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {isAgent ? 'Zarządzanie zgłoszeniami' : 'Moje zgłoszenia'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-400">
                    {user.name} ({user.role})
                  </p>
                  {realtimeConnected && (
                    <span className="flex items-center text-xs text-green-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                      Real-time aktywny
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isAgent && !showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nowe zgłoszenie
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Ticket Form Modal */}
        {showCreateForm && (
          <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Utwórz nowe zgłoszenie</h2>
            <CreateTicketForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Stats */}
        {!showCreateForm && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Wszystkie</p>
                  <p className="text-2xl font-bold text-white">{pagination?.total || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Otwarte</p>
                  <p className="text-2xl font-bold text-white">
                    {tickets.filter((t) => t.status === 'OPEN').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-900/50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rozwiązane</p>
                  <p className="text-2xl font-bold text-white">
                    {tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!showCreateForm && (
          <div className="mb-6">
            <TicketFilters
              status={statusFilter}
              assignedToMe={assignedToMeFilter}
              onStatusChange={setStatusFilter}
              onAssignedToMeChange={isAgent ? setAssignedToMeFilter : undefined}
              showAssignedFilter={isAgent}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Ticket List */}
        {!showCreateForm && (
          <TicketList
            tickets={tickets}
            isLoading={isLoading}
            userRole={user.role}
            onTicketClick={handleTicketClick}
            onAssignTicket={isAgent ? handleAssignTicket : undefined}
            onUpdateStatus={isAgent ? handleUpdateStatus : undefined}
          />
        )}

        {/* Ticket Details Dialog */}
        <TicketDetailsDialog
          ticketId={selectedTicketId}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          userRole={user.role}
          onUpdated={refetch}
        />
      </main>
    </div>
  );
}

