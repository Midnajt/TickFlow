"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { updateUserSchema } from "@/app/lib/validators/users";
import { adminApi } from "@/app/lib/api-client";
import type { UserDetailDTO, UpdateUserCommand, UserRole } from "@/src/types";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: UserDetailDTO) => void;
  user: UserDetailDTO | null;
}

export function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserCommand>({
    name: "",
    role: "USER" as UserRole,
    forcePasswordChange: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      });
    }
    setErrors({});
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrors({});

    try {
      // Walidacja z Zod
      const validatedData = updateUserSchema.parse(formData);
      
      setIsLoading(true);
      await adminApi.updateUser(user.id, validatedData);
      
      // Aktualizuj lokalny stan użytkownika
      const updatedUser: UserDetailDTO = {
        ...user,
        ...validatedData,
      };
      
      onUserUpdated(updatedUser);
      handleClose();
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message || "Błąd podczas aktualizacji użytkownika" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      role: "USER" as UserRole,
      forcePasswordChange: false,
    });
    setErrors({});
    onClose();
  };

  const handleForcePasswordReset = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      await adminApi.forcePasswordReset(user.id);
      
      // Aktualizuj lokalny stan użytkownika
      const updatedUser: UserDetailDTO = {
        ...user,
        forcePasswordChange: true,
      };
      
      onUserUpdated(updatedUser);
      handleClose();
    } catch (error: any) {
      setErrors({ general: error.message || "Błąd podczas wymuszenia resetu hasła" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj użytkownika</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5">
          {errors.general && (
            <div className="text-red-200 text-sm bg-red-900/50 border border-red-700 p-2 rounded">
              {errors.general}
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email nie może być zmieniony</p>
          </div>

          <div>
            <Label htmlFor="name" className="text-gray-300">Imię i nazwisko *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="role" className="text-gray-300">Rola *</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className={`flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${errors.role ? "border-red-500" : ""}`}
            >
              <option value="USER">Użytkownik</option>
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Administrator</option>
            </select>
            {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="forcePasswordChange"
              checked={formData.forcePasswordChange}
              onChange={(e) => setFormData({ ...formData, forcePasswordChange: e.target.checked })}
              className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="forcePasswordChange" className="text-sm text-gray-300">
              Wymuś zmianę hasła przy następnym logowaniu
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              onClick={handleClose} 
              disabled={isLoading}
              className="!bg-purple-600 hover:!bg-purple-700 text-white border-none"
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={handleForcePasswordReset}
              disabled={isLoading}
              className="!bg-red-600 hover:!bg-red-700 text-white border-none"
            >
              {isLoading ? "Resetowanie..." : "Wymuś reset hasła"}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="!bg-purple-600 hover:!bg-purple-700 text-white border-none"
            >
              {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
