'use client';

import Link from 'next/link';
import DashboardHeader from '@/app/components/DashboardHeader';
import { DashboardInfo } from '@/app/components/dashboard/DashboardInfo';
import { ChangePasswordForm } from '@/app/components/ChangePasswordForm';
import { BackArrowIcon, LockIcon } from '@/app/components/ui/icons';
import type { UserSessionDTO } from '@/src/types';

interface AccountPageClientProps {
  user: UserSessionDTO;
}

export default function AccountPageClient({ user }: AccountPageClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700"
          >
            <BackArrowIcon />
            Powrót do strony głównej
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Moje Konto</h1>
          <p className="text-gray-400">Informacje o Twoim koncie i sesji</p>
        </div>

        <div className="space-y-6">
          <DashboardInfo user={user} />

          <div className="bg-gray-800 rounded-xl shadow-md p-8 border border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <LockIcon />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Zmiana hasła</h3>
                <p className="text-gray-400 mb-6">
                  Ustaw nowe, bezpieczne hasło dla swojego konta
                </p>
                <ChangePasswordForm isForced={false} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

