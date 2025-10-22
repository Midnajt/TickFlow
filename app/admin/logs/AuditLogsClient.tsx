"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { adminApi } from "@/app/lib/api-client";
import type { AuditLogsListDTO, AuditLogDTO, AuditAction, GetAuditLogsParams } from "@/src/types";

interface AuditLogsClientProps {
  initialLogs: AuditLogsListDTO;
}

export function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
  const [logs, setLogs] = useState<AuditLogDTO[]>(initialLogs.logs);
  const [pagination, setPagination] = useState(initialLogs.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filtry
  const [filters, setFilters] = useState<GetAuditLogsParams>({
    userId: undefined,
    action: undefined,
    startDate: undefined,
    endDate: undefined,
    page: 1,
    limit: 50,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async (newFilters: GetAuditLogsParams) => {
    try {
      setIsLoading(true);
      const result = await adminApi.getAuditLogs(newFilters);
      setLogs(result.logs);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof GetAuditLogsParams, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  const handleSearch = () => {
    const newFilters = { ...filters, page: 1 };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: GetAuditLogsParams = {
      page: 1,
      limit: 50,
    };
    setFilters(clearedFilters);
    setSearchTerm("");
    loadLogs(clearedFilters);
  };

  const getActionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case "USER_LOGIN":
        return "bg-green-900 text-green-200";
      case "USER_LOGOUT":
        return "bg-gray-700 text-gray-200";
      case "USER_CREATED":
        return "bg-blue-900 text-blue-200";
      case "USER_UPDATED":
        return "bg-yellow-900 text-yellow-200";
      case "USER_PASSWORD_RESET":
        return "bg-orange-900 text-orange-200";
      case "CATEGORY_UPDATED":
        return "bg-purple-900 text-purple-200";
      case "SUBCATEGORY_UPDATED":
        return "bg-indigo-900 text-indigo-200";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  const getActionLabel = (action: AuditAction) => {
    switch (action) {
      case "USER_LOGIN":
        return "Logowanie";
      case "USER_LOGOUT":
        return "Wylogowanie";
      case "USER_CREATED":
        return "Utworzenie użytkownika";
      case "USER_UPDATED":
        return "Aktualizacja użytkownika";
      case "USER_PASSWORD_RESET":
        return "Reset hasła";
      case "CATEGORY_UPDATED":
        return "Aktualizacja kategorii";
      case "SUBCATEGORY_UPDATED":
        return "Aktualizacja podkategorii";
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Logi aktywności</h2>
        <p className="text-gray-400">Monitoruj aktywność użytkowników w systemie</p>
      </div>

      {/* Filtry */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Użytkownik
            </label>
            <Input
              placeholder="ID użytkownika..."
              value={filters.userId || ""}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Akcja
            </label>
            <select
              value={filters.action || ""}
              onChange={(e) => handleFilterChange("action", e.target.value || undefined)}
              className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Wszystkie akcje</option>
              <option value="USER_LOGIN">Logowanie</option>
              <option value="USER_LOGOUT">Wylogowanie</option>
              <option value="USER_CREATED">Utworzenie użytkownika</option>
              <option value="USER_UPDATED">Aktualizacja użytkownika</option>
              <option value="USER_PASSWORD_RESET">Reset hasła</option>
              <option value="CATEGORY_UPDATED">Aktualizacja kategorii</option>
              <option value="SUBCATEGORY_UPDATED">Aktualizacja podkategorii</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data od
            </label>
            <Input
              type="datetime-local"
              value={filters.startDate ? new Date(filters.startDate).toISOString().slice(0, 16) : ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data do
            </label>
            <Input
              type="datetime-local"
              value={filters.endDate ? new Date(filters.endDate).toISOString().slice(0, 16) : ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Wyszukiwanie..." : "Wyszukaj"}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          </div>
          
          <div className="text-sm text-gray-400">
            Znaleziono {pagination.total} logów
          </div>
        </div>
      </div>

      {/* Tabela logów */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Użytkownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Akcja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Zasób
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Szczegóły
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {log.userName || "System"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {log.resourceType && log.resourceId ? (
                      <span className="text-blue-400">
                        {log.resourceType}: {log.resourceId.slice(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {log.ipAddress || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {log.details && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(log.id)}
                      >
                        {expandedLogId === log.id ? "Ukryj" : "Pokaż"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-400">
            Brak logów spełniających kryteria wyszukiwania
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8 text-gray-400">
            Ładowanie logów...
          </div>
        )}
      </div>

      {/* Szczegóły logu */}
      {expandedLogId && (
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Szczegóły logu</h3>
          {(() => {
            const log = logs.find(l => l.id === expandedLogId);
            if (!log || !log.details) return null;
            
            return (
              <div className="space-y-2 text-gray-300">
                <div>
                  <strong>User Agent:</strong> {log.userAgent || "-"}
                </div>
                <div>
                  <strong>Szczegóły:</strong>
                  <pre className="mt-2 p-3 bg-gray-900 rounded text-sm overflow-auto text-gray-200">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Paginacja */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
          >
            Poprzednia
          </Button>
          
          <span className="text-sm text-gray-300">
            Strona {pagination.page} z {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasMore || isLoading}
          >
            Następna
          </Button>
        </div>
      )}
    </div>
  );
}
