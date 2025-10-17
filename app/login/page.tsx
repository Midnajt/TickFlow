'use client';

import { useState, useCallback } from 'react';
import { AuthLayout } from '@/app/components/AuthLayout';
import { LoginForm } from '@/app/components/LoginForm';
import { testAccounts, agentAccounts, userAccounts, type TestAccount } from '@/app/lib/testAccounts';

const isDevelopment = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const [fillFormFn, setFillFormFn] = useState<((email: string, password: string) => void) | null>(null);

  const handleAccountClick = (account: TestAccount) => {
    if (fillFormFn) {
      fillFormFn(account.email, account.password);
    }
  };

  const handleFormReady = useCallback((fillForm: (email: string, password: string) => void) => {
    setFillFormFn(() => fillForm);
  }, []);

  return (
    <AuthLayout>
      <LoginForm onFormReady={handleFormReady} />
      
      {isDevelopment && (
        <div className="mt-6 border-t border-gray-700 pt-6">
          <div className="text-xs text-gray-400 space-y-2">
            <p className="font-semibold text-gray-300">Testowe konta (kliknij aby wypełnić):</p>
            <div className="space-y-1 font-mono bg-gray-700 p-3 rounded text-[10px]">
              <p className="text-blue-400 font-semibold">AGENCI:</p>
              {agentAccounts.map((account, index) => (
                <p
                  key={index}
                  onClick={() => handleAccountClick(account)}
                  className="cursor-pointer hover:text-white hover:bg-gray-600 p-1 rounded transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAccountClick(account);
                    }
                  }}
                >
                  {account.icon} {account.label}
                </p>
              ))}
              <p className="text-green-400 font-semibold mt-2">UŻYTKOWNICY:</p>
              {userAccounts.map((account, index) => (
                <p
                  key={index}
                  onClick={() => handleAccountClick(account)}
                  className="cursor-pointer hover:text-white hover:bg-gray-600 p-1 rounded transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAccountClick(account);
                    }
                  }}
                >
                  {account.icon} {account.label}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
