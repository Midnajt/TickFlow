import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthService } from '@/app/lib/services/auth';
import DashboardHeader from '@/app/components/DashboardHeader';
import type { UserSessionDTO } from '@/src/types';

async function getUser(): Promise<UserSessionDTO | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await AuthService.getSession(token);
    return session.user;
  } catch {
    return null;
  }
}

export default async function Home() {
  const user = await getUser();

  // Przekierowanie do logowania jeśli nie zalogowany
  if (!user) {
    redirect('/login');
  }

  // Przekierowanie do zmiany hasła jeśli wymagane
  if (user.passwordResetRequired) {
    redirect('/change-password');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Witaj, {user.name}! 👋
          </h2>
          <p className="text-gray-400">
            Pomyślnie zalogowałeś się do systemu TickFlow
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-3xl font-bold text-white">0</span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              Otwarte zgłoszenia
            </h3>
            <p className="text-xs text-gray-500">Czekające na rozwiązanie</p>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-3xl font-bold text-white">0</span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              Rozwiązane
            </h3>
            <p className="text-xs text-gray-500">W tym miesiącu</p>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-3xl font-bold text-white">
                {user.role === 'AGENT' ? 'Agent' : 'User'}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              Twoja rola
            </h3>
            <p className="text-xs text-gray-500">
              {user.role === 'AGENT'
                ? 'Możesz zarządzać zgłoszeniami'
                : 'Możesz tworzyć zgłoszenia'}
            </p>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gray-800 rounded-xl shadow-md p-8 border border-gray-700">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Uwierzytelnianie działa! 🎉
              </h3>
              <p className="text-gray-400 mb-4">
                Pomyślnie zaimplementowano system uwierzytelniania TickFlow.
                Poniżej znajdziesz szczegóły Twojej sesji:
              </p>
              <div className="bg-gray-700 rounded-lg p-4 space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-white font-medium">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium">
                    {user.email}
                  </span>
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
                      user.passwordResetRequired
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {user.passwordResetRequired ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">✅ Zaimplementowane</h3>
            <ul className="space-y-2 text-sm">
              <li>• System logowania (JWT + HttpOnly cookies)</li>
              <li>• Zarządzanie sesjami</li>
              <li>• Zmiana hasła</li>
              <li>• Rate limiting</li>
              <li>• Walidacja Zod</li>
              <li>• Auth utilities & wrappers</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">🚧 Planowane</h3>
            <ul className="space-y-2 text-sm">
              <li>• Zarządzanie zgłoszeniami</li>
              <li>• Dashboard agenta</li>
              <li>• Real-time updates</li>
              <li>• Kategorie i podkategorie</li>
              <li>• Historia zmian</li>
              <li>• Powiadomienia</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center text-gray-400 text-sm">
        <p>TickFlow MVP v1.0.0 | Built with Next.js 15, TypeScript & Supabase</p>
      </footer>
    </div>
  );
}
