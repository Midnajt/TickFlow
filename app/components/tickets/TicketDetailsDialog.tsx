'use client';

import { useEffect, useMemo, useState } from 'react';
import { ticketsApi } from '@/app/lib/api-client';
import type { TicketDTO, TicketStatus, UserRole } from '@/src/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface TicketDetailsDialogProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
  onUpdated: () => void;
}

export function TicketDetailsDialog({
  ticketId,
  open,
  onOpenChange,
  userRole,
  onUpdated,
}: TicketDetailsDialogProps) {
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agents, setAgents] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);

  const isAgent = userRole === 'AGENT' || userRole === 'ADMIN';

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('pl-PL', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Europe/Warsaw',
      }),
    []
  );

  useEffect(() => {
    if (!open || !ticketId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await ticketsApi.getTicketById(ticketId);
        if (!cancelled) setTicket(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Nie udało się pobrać zgłoszenia');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [open, ticketId]);

  // Ładowanie listy agentów dla funkcjonalności przekazywania
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

    return () => {
      cancelled = true;
    };
  }, [isAgent, open]);

  async function handleAssign() {
    if (!ticket) return;
    try {
      setIsMutating(true);
      await ticketsApi.assignTicket(ticket.id);
      const refreshed = await ticketsApi.getTicketById(ticket.id);
      setTicket(refreshed);
      onUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Nie udało się przypisać zgłoszenia');
    } finally {
      setIsMutating(false);
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!ticket) return;
    try {
      setIsMutating(true);
      await ticketsApi.updateTicketStatus(ticket.id, status);
      const refreshed = await ticketsApi.getTicketById(ticket.id);
      setTicket(refreshed);
      onUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Nie udało się zaktualizować statusu');
    } finally {
      setIsMutating(false);
    }
  }

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

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isMutating && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLoading ? 'Wczytywanie…' : ticket?.title || 'Szczegóły zgłoszenia'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-5 pt-0">
          {error && (
            <div className="mb-4 bg-red-900/40 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isLoading && !ticket && (
            <div className="text-gray-300">Ładowanie danych zgłoszenia…</div>
          )}

          {ticket && (
            <div className="space-y-5">
              <div className="text-sm text-gray-400 flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <span className="text-gray-500">Status: </span>
                  <span className="text-white">{ticket.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Utworzone: </span>
                  <span className="text-white">{dateFmt.format(new Date(ticket.createdAt))}</span>
                </div>
                <div>
                  <span className="text-gray-500">Autor: </span>
                  <span className="text-white">{ticket.createdBy.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Przypisane do: </span>
                  <span className="text-white">{ticket.assignedTo ? ticket.assignedTo.name : '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Kategoria: </span>
                  <span className="text-white">{ticket.subcategory.category.name} → {ticket.subcategory.name}</span>
                </div>
              </div>

              <div className="text-gray-200 whitespace-pre-wrap">
                {ticket.description}
              </div>

              {/* Akcje dla AGENT/ADMIN */}
              {isAgent && (
                <div className="pt-4 border-t border-gray-700 flex flex-wrap gap-2">
                  {!ticket.assignedTo && (
                    <button
                      onClick={handleAssign}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                      disabled={isMutating}
                    >
                      Przypisz do mnie
                    </button>
                  )}

                  {ticket.assignedTo && ticket.status === 'OPEN' && (
                    <button
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                      disabled={isMutating}
                    >
                      Rozpocznij pracę
                    </button>
                  )}

                  {ticket.assignedTo && ticket.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusChange('RESOLVED')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                      disabled={isMutating}
                    >
                      Oznacz jako rozwiązane
                    </button>
                  )}

                  {ticket.assignedTo && ticket.status === 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusChange('CLOSED')}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                      disabled={isMutating}
                    >
                      Zamknij
                    </button>
                  )}

                  {ticket.status === 'CLOSED' && (
                    <button
                      onClick={handleRestore}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                      disabled={isMutating}
                    >
                      Przywróć zgłoszenie
                    </button>
                  )}

                  {ticket.assignedTo && (
                    <button
                      onClick={() => setShowTransferDialog((v) => !v)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                      disabled={isMutating}
                    >
                      Przekaż zgłoszenie
                    </button>
                  )}

                  {/* Inline panel z listą agentów wyświetlany pod przyciskiem */}
                  {ticket.assignedTo && showTransferDialog && (
                    <div className="w-full mt-3 p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
                      <div>
                        <label htmlFor="agent-select-inline" className="block text-sm font-medium text-gray-300 mb-2">
                          Wybierz agenta lub administratora:
                        </label>
                        <select
                          id="agent-select-inline"
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
                      <div className="flex gap-2 justify-end mt-3">
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
                  )}
                </div>
              )}

              {/* Akcje dla USER - tylko przywracanie swoich ticketów */}
              {!isAgent && ticket.status === 'CLOSED' && (
                <div className="pt-4 border-t border-gray-700 flex flex-wrap gap-2">
                  <button
                    onClick={handleRestore}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                    disabled={isMutating}
                  >
                    Przywróć zgłoszenie
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Usunięto modal – panel inline renderowany nad DialogContent */}
    </Dialog>
  );
}


