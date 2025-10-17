'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helpText?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helpText, id, className = '', ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const helpTextId = `${inputId}-help`;

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type="password"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helpText ? helpTextId : undefined}
          className={`appearance-none relative block w-full px-4 py-3 border ${
            error ? 'border-red-500' : 'border-gray-600'
          } placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
          } focus:border-transparent transition-all ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpTextId} className="mt-2 text-xs text-gray-400">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

