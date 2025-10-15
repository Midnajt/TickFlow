'use client';

import { useState } from 'react';
import { AuthLayout } from '@/app/components/AuthLayout';
import { LoginForm } from '@/app/components/LoginForm';

interface TestAccount {
  email: string;
  password: string;
  label: string;
  icon: string;
}

const testAccounts: TestAccount[] = [
  { email: 'admin@tickflow.com', password: 'Admin123!@#', label: 'admin@tickflow.com / Admin123!@#', icon: '👨‍💼' },
  { email: 'agent@tickflow.com', password: 'Agent123!@#', label: 'agent@tickflow.com / Agent123!@#', icon: '👨‍💼' },
  { email: 'agent2@tickflow.com', password: 'Agent2123!@#', label: 'agent2@tickflow.com / Agent2123!@#', icon: '👩‍💼' },
  { email: 'user@tickflow.com', password: 'User123!@#', label: 'user@tickflow.com / User123!@#', icon: '👤' },
  { email: 'user2@tickflow.com', password: 'User2123!@#', label: 'user2@tickflow.com / User2123!@#', icon: '👤' },
];

export default function LoginPage() {
  const [fillFormFn, setFillFormFn] = useState<((email: string, password: string) => void) | null>(null);

  const handleAccountClick = (account: TestAccount) => {
    if (fillFormFn) {
      fillFormFn(account.email, account.password);
    }
  };

  return (
    <AuthLayout>
      <LoginForm onFormReady={(fillForm) => setFillFormFn(() => fillForm)} />
      
      <div className="mt-6 border-t border-gray-700 pt-6">
        <div className="text-xs text-gray-400 space-y-2">
          <p className="font-semibold text-gray-300">Testowe konta (kliknij aby wypełnić):</p>
          <div className="space-y-1 font-mono bg-gray-700 p-3 rounded text-[10px]">
            <p className="text-blue-400 font-semibold">AGENCI:</p>
            {testAccounts.slice(0, 3).map((account, index) => (
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
            {testAccounts.slice(3).map((account, index) => (
              <p
                key={index + 3}
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
    </AuthLayout>
  );
}
