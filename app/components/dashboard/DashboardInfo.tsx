import type { UserSessionDTO } from '@/src/types';
import { InfoIcon } from './icons';

interface DashboardInfoProps {
  user: UserSessionDTO;
}

/**
 * Panel informacyjny z danymi sesji
 */
export function DashboardInfo({ user }: DashboardInfoProps) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-md p-4 sm:p-8 border border-gray-700">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <InfoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Uwierzytelnianie działa! 🎉</h3>
          <p className="text-sm sm:text-base text-gray-400 mb-4">
            Pomyślnie zaimplementowano system uwierzytelniania TickFlow. Poniżej znajdziesz szczegóły
            Twojej sesji:
          </p>
          <div className="bg-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 font-mono text-xs sm:text-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-400 flex-shrink-0">User ID:</span>
              <span className="text-white font-medium break-all sm:text-right">{user.id}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-400 flex-shrink-0">Email:</span>
              <span className="text-white font-medium break-all sm:text-right">{user.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-400 flex-shrink-0">Name:</span>
              <span className="text-white font-medium break-words sm:text-right">{user.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-400 flex-shrink-0">Role:</span>
              <span className="text-white font-medium sm:text-right">{user.role}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-400 flex-shrink-0">Password Reset Required:</span>
              <span
                className={`font-medium sm:text-right ${
                  user.passwordResetRequired ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {user.passwordResetRequired ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

