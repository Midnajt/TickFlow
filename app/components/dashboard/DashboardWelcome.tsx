import type { UserSessionDTO } from '@/src/types';
import { TicketIcon, LightBulbIcon } from './icons';

interface DashboardWelcomeProps {
  user: UserSessionDTO;
}

/**
 * Sekcja powitalna na dashboardzie
 */
export function DashboardWelcome({ user }: DashboardWelcomeProps) {
  return (
    <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">Witaj, {user.name}! 👋</h2>
        <p className="text-sm sm:text-base text-gray-400">Pomyślnie zalogowałeś się do systemu TickFlow</p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <a
          href="/tickets"
          className="px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <TicketIcon className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{user.role === 'AGENT' || user.role === 'ADMIN' ? 'Zarządzaj zgłoszeniami' : 'Moje zgłoszenia'}</span>
        </a>
        {user.email === 'admin@tickflow.com' && (
          <a
            href="/ai-demo"
            className="px-4 sm:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <LightBulbIcon className="w-5 h-5 flex-shrink-0" />
            AI Demo
          </a>
        )}
      </div>
    </div>
  );
}

