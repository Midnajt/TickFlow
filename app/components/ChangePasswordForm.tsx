'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@/app/lib/validators/auth';
import type { ChangePasswordResponseDTO } from '@/src/types';
import { ErrorAlert } from './ErrorAlert';
import { PasswordInput } from './ui/password-input';
import { LoadingSpinner } from './ui/icons';

interface ChangePasswordFormProps {
  isForced?: boolean;
}

export function ChangePasswordForm({ isForced = false }: ChangePasswordFormProps) {
  const router = useRouter();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setErrorMessages([]);
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const responseData = await response.json();

      // Handle different error status codes
      if (!response.ok) {
        switch (response.status) {
          case 400:
            // Validation errors
            if (responseData.details && Array.isArray(responseData.details)) {
              const validationErrors = responseData.details.map(
                (detail: { message: string }) => detail.message
              );
              setErrorMessages(validationErrors);
            } else {
              setErrorMessages([responseData.message || 'Nieprawidłowe dane']);
            }
            break;
          
          case 401:
            // Authentication failed (wrong current password)
            setErrorMessages([responseData.message || 'Nieprawidłowe aktualne hasło']);
            break;
          
          case 500:
            // Server error
            setErrorMessages(['Wystąpił błąd serwera. Spróbuj ponownie później.']);
            break;
          
          default:
            setErrorMessages([responseData.message || 'Wystąpił nieoczekiwany błąd']);
        }
        return;
      }

      // Success
      const changePasswordResponse = responseData as ChangePasswordResponseDTO;
      setSuccessMessage(changePasswordResponse.message);
      reset();

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Change password error:', err);
      setErrorMessages(['Wystąpił błąd połączenia. Sprawdź swoje połączenie internetowe.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isForced && (
        <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-200 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold">Wymagana zmiana hasła</p>
          <p className="mt-1">
            Ze względów bezpieczeństwa musisz zmienić swoje hasło przed kontynuowaniem.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          label="Aktualne hasło"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />

        <PasswordInput
          label="Nowe hasło"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          helpText="Hasło musi mieć minimum 8 znaków i zawierać: małą literę, wielką literę, cyfrę i znak specjalny (@$!%*?&)"
          {...register('newPassword')}
        />

        <PasswordInput
          label="Potwierdź nowe hasło"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <ErrorAlert messages={errorMessages} />

        {successMessage && (
          <div 
            className="bg-green-900/30 border border-green-800 text-green-200 px-4 py-3 rounded-lg text-sm"
            role="alert"
            aria-live="polite"
          >
            <p className="font-semibold">✓ Sukces!</p>
            <p className="mt-1">{successMessage}</p>
            <p className="mt-1 text-xs">Przekierowanie za chwilę...</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <LoadingSpinner className="-ml-1" />
              Zmieniam hasło...
            </span>
          ) : (
            'Zmień hasło'
          )}
        </button>
      </form>
    </div>
  );
}

