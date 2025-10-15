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
    <div className="bg-gray-800 rounded-xl shadow-md p-8 border border-gray-700">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <InfoIcon className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Uwierzytelnianie działa! 🎉</h3>
          <p className="text-gray-400 mb-4">
            Pomyślnie zaimplementowano system uwierzytelniania TickFlow. Poniżej znajdziesz szczegóły
            Twojej sesji:
          </p>
          <div className="bg-gray-700 rounded-lg p-4 space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">User ID:</span>
              <span className="text-white font-medium">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role:</span>
              <span className="text-white font-medium">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Password Reset Required:</span>
              <span
                className={`font-medium ${
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

