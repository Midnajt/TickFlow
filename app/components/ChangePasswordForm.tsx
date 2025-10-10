'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@/app/lib/validators/auth';
import type { ChangePasswordResponseDTO } from '@/src/types';
import { ErrorAlert } from './ErrorAlert';

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
    mode: 'onBlur',
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
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Aktualne hasło
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword ? 'true' : 'false'}
            aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
            className={`appearance-none relative block w-full px-4 py-3 border ${
              errors.currentPassword ? 'border-red-500' : 'border-gray-600'
            } placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
              errors.currentPassword ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
            } focus:border-transparent transition-all`}
            placeholder="••••••••"
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p id="current-password-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Nowe hasło
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.newPassword ? 'true' : 'false'}
            aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
            className={`appearance-none relative block w-full px-4 py-3 border ${
              errors.newPassword ? 'border-red-500' : 'border-gray-600'
            } placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
              errors.newPassword ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
            } focus:border-transparent transition-all`}
            placeholder="••••••••"
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p id="new-password-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.newPassword.message}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Hasło musi mieć minimum 8 znaków i zawierać: małą literę, wielką literę, cyfrę i znak specjalny (@$!%*?&)
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Potwierdź nowe hasło
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            className={`appearance-none relative block w-full px-4 py-3 border ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
            } placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
              errors.confirmPassword ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
            } focus:border-transparent transition-all`}
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

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
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
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

