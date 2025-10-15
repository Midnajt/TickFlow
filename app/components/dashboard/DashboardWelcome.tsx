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
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Witaj, {user.name}! 👋</h2>
        <p className="text-gray-400">Pomyślnie zalogowałeś się do systemu TickFlow</p>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/tickets"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <TicketIcon className="w-5 h-5" />
          {user.role === 'AGENT' ? 'Zarządzaj zgłoszeniami' : 'Moje zgłoszenia'}
        </a>
        {user.email === 'admin@tickflow.com' && (
          <a
            href="/ai-demo"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <LightBulbIcon className="w-5 h-5" />
            AI Demo
          </a>
        )}
      </div>
    </div>
  );
}

