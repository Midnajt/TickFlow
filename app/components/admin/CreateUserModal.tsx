"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { PasswordInput } from "@/app/components/ui/password-input";
import { createUserSchema } from "@/app/lib/validators/users";
import { adminApi } from "@/app/lib/api-client";
import type { CreateUserCommand, UserRole } from "@/src/types";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: any) => void;
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState<CreateUserCommand>({
    email: "",
    name: "",
    role: "USER" as UserRole,
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Walidacja haseł
    if (formData.password !== confirmPassword) {
      setErrors({ confirmPassword: "Hasła nie są identyczne" });
      return;
    }

    try {
      // Walidacja z Zod
      const validatedData = createUserSchema.parse(formData);
      
      setIsLoading(true);
      const response = await adminApi.createUser(validatedData);
      
      onUserCreated(response.user);
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
        setErrors({ general: error.message || "Błąd podczas tworzenia użytkownika" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: "",
      name: "",
      role: "USER" as UserRole,
      password: "",
    });
    setConfirmPassword("");
    setErrors({});
    onClose();
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["Bardzo słabe", "Słabe", "Średnie", "Dobre", "Bardzo dobre"];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5">
          {errors.general && (
            <div className="text-red-200 text-sm bg-red-900/50 border border-red-700 p-2 rounded">
              {errors.general}
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-300">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
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

          <div>
            <PasswordInput
              id="password"
              label="Hasło *"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
            {formData.password && (
              <div className="mt-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength ? strengthColors[passwordStrength - 1] : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Siła hasła: {strengthLabels[passwordStrength - 1] || "Bardzo słabe"}
                </p>
              </div>
            )}
          </div>

          <div>
            <PasswordInput
              id="confirmPassword"
              label="Potwierdź hasło *"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
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
              type="submit" 
              disabled={isLoading}
              className="!bg-purple-600 hover:!bg-purple-700 text-white border-none"
            >
              {isLoading ? "Tworzenie..." : "Utwórz użytkownika"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
