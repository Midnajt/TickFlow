'use client';

import Link from 'next/link';
import LogoutButton from './LogoutButton';
import type { UserSessionDTO } from '@/src/types';

interface DashboardHeaderProps {
  user: UserSessionDTO;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Logo i nazwa */}
          <div className="flex items-center justify-between lg:justify-start gap-3 min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">TickFlow</h1>
                <p className="text-xs text-gray-400 hidden sm:block">System Zgłoszeń IT</p>
              </div>
            </div>
            {/* Rola - widoczna na mobile obok logo */}
            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 lg:hidden ${
                user.role === 'AGENT'
                  ? 'bg-purple-900 text-purple-300'
                  : user.role === 'ADMIN'
                  ? 'bg-red-900 text-red-300'
                  : 'bg-blue-900 text-blue-300'
              }`}
            >
              {user.role}
            </div>
          </div>

          {/* Przyciski i info użytkownika */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="text-left sm:text-right hidden md:block">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            {/* Rola - widoczna na desktop */}
            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 hidden lg:block ${
                user.role === 'AGENT'
                  ? 'bg-purple-900 text-purple-300'
                  : user.role === 'ADMIN'
                  ? 'bg-red-900 text-red-300'
                  : 'bg-blue-900 text-blue-300'
              }`}
            >
              {user.role}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="flex-1 sm:flex-none px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
              >
                Moje konto
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

