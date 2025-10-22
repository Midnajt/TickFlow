"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { CreateUserModal } from "@/app/components/admin/CreateUserModal";
import { EditUserModal } from "@/app/components/admin/EditUserModal";
import type { UserDetailDTO, UserRole } from "@/src/types";

interface UsersAdminClientProps {
  initialUsers: UserDetailDTO[];
}

export function UsersAdminClient({ initialUsers }: UsersAdminClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

  const handleUserCreated = (newUser: UserDetailDTO) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const handleUserUpdated = (updatedUser: UserDetailDTO) => {
    setUsers(prev => 
      prev.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
  };

  const handleEditUser = (user: UserDetailDTO) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedUser(null);
    setIsEditModalOpen(false);
  };

  // Filtrowanie użytkowników
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-900 text-red-200";
      case "AGENT":
        return "bg-blue-900 text-blue-200";
      case "USER":
        return "bg-green-900 text-green-200";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "AGENT":
        return "Agent";
      case "USER":
        return "Użytkownik";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header z przyciskiem dodawania */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Zarządzanie użytkownikami</h2>
          <p className="text-gray-400">Dodawaj, edytuj i zarządzaj użytkownikami systemu</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Dodaj użytkownika
        </Button>
      </div>

      {/* Filtry */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Szukaj użytkowników
            </label>
            <Input
              placeholder="Szukaj po nazwie lub emailu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filtruj po roli
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
              className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ALL">Wszystkie role</option>
              <option value="USER">Użytkownik</option>
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela użytkowników */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Użytkownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rola
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Statystyki
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data utworzenia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <div className="space-y-1">
                      <div>Utworzone: {user.ticketsCreatedCount}</div>
                      <div>Przypisane: {user.ticketsAssignedCount}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.forcePasswordChange && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-900 text-orange-200">
                        Wymuś zmianę hasła
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Edytuj
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {searchTerm || roleFilter !== "ALL" 
              ? "Nie znaleziono użytkowników spełniających kryteria wyszukiwania"
              : "Brak użytkowników w systemie"
            }
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
    </div>
  );
}
