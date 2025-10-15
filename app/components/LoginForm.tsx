'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/app/lib/validators/auth';
import type { LoginResponseDTO } from '@/src/types';
import { ErrorAlert } from './ErrorAlert';

export function LoginForm() {
  const router = useRouter();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMessages([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setErrorMessages(['Wystąpił błąd podczas przetwarzania odpowiedzi serwera']);
        return;
      }

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
              setErrorMessages([responseData.message || 'Nieprawidłowe dane logowania']);
            }
            break;
          
          case 401:
            // Authentication failed
            setErrorMessages([responseData.message || 'Nieprawidłowy email lub hasło']);
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

      // Success - handle redirect
      const loginResponse = responseData as LoginResponseDTO;
      
      if (loginResponse.user.passwordResetRequired) {
        router.push('/change-password');
      } else {
        router.push('/');
      }
      
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessages(['Wystąpił błąd połączenia. Sprawdź swoje połączenie internetowe.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`appearance-none relative block w-full px-4 py-3 border ${
              errors.email ? 'border-red-500' : 'border-gray-600'
            } placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
              errors.email ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
            } focus:border-transparent transition-all`}
            placeholder="twoj@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Hasło
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`appearance-none relative block w-full px-4 py-3 border ${
              errors.password ? 'border-red-500' : 'border-gray-600'
            } placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
              errors.password ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
            } focus:border-transparent transition-all`}
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <ErrorAlert messages={errorMessages} />

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
            Logowanie...
          </span>
        ) : (
          'Zaloguj się'
        )}
      </button>
    </form>
  );
}

