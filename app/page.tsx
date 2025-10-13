import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthService } from '@/app/lib/services/auth';
import { TicketService } from '@/app/lib/services/tickets';
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

  // Stats for dashboard
  const { openCount, resolvedCount } = await TicketService.getTicketStats(
    user.id,
    user.role
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Witaj, {user.name}! 👋
            </h2>
            <p className="text-gray-400">
              Pomyślnie zalogowałeś się do systemu TickFlow
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/tickets"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {user.role === 'AGENT' ? 'Zarządzaj zgłoszeniami' : 'Moje zgłoszenia'}
            </a>
            {user.email === 'admin@tickflow.com' && (
              <a
                href="/ai-demo"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                AI Demo
              </a>
            )}
          </div>
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
              <span className="text-3xl font-bold text-white">{openCount}</span>
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
              <span className="text-3xl font-bold text-white">{resolvedCount}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              Rozwiązane
            </h3>
            <p className="text-xs text-gray-500">Łącznie</p>
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
            <h3 className="text-xl font-bold mb-2">🛠️ Technologie</h3>
            <ul className="space-y-2 text-sm">
              <li>• Next.js 15 (App Router)</li>
              <li>• TypeScript 5 & React 19</li>
              <li>• Tailwind CSS 4</li>
              <li>• Prisma 6 & Supabase</li>
              <li>• NextAuth 5 (JWT + HttpOnly cookies)</li>
              <li>• Zod validation & Rate limiting</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">✨ Funkcjonalności</h3>
            <ul className="space-y-2 text-sm">
              <li>• ✅ Zgłaszanie i śledzenie ticketów</li>
              <li>• ✅ Podział ról (USER/AGENT)</li>
              <li>• ✅ Real-time aktualizacje statusów</li>
              <li>• ✅ Kategorie i podkategorie</li>
              <li>• ✅ Sugestie AI podczas pisania ticketu</li>
              <li>• 🚧 Historia zmian i powiadomienia</li>
            </ul>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mt-8 bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">🧪 Testowe konta (do testowania API)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-blue-400 font-semibold mb-2">AGENCI:</p>
              <div className="space-y-1 font-mono text-xs bg-gray-700 p-3 rounded text-gray-300">
                <p>👨‍💼 admin@tickflow.com / Admin123!@#</p>
                <p>👨‍💼 agent@tickflow.com / Agent123!@#</p>
                <p>👩‍💼 agent2@tickflow.com / Agent2123!@#</p>
              </div>
            </div>
            <div>
              <p className="text-green-400 font-semibold mb-2">UŻYTKOWNICY:</p>
              <div className="space-y-1 font-mono text-xs bg-gray-700 p-3 rounded text-gray-300">
                <p>👤 user@tickflow.com / User123!@#</p>
                <p>👤 user2@tickflow.com / User2123!@#</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center text-gray-400 text-sm">
        <p>TickFlow MVP v1.0.0 | Built with Next.js 15, TypeScript & Supabase</p>
        <p className="mt-2 text-xs text-gray-500">
          Crafted with ❤️ by{' '}
          <a 
            href="https://www.linkedin.com/in/%E2%97%8F-marcin-krzysztoszek-a7851116b/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 font-medium hover:text-blue-300 transition-colors cursor-pointer"
          >
            Marcin Krzysztoszek
          </a>{' '}
          <a 
            href="https://github.com/Midnajt" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
          >
            AddPattern
          </a>
        </p>
      </footer>
    </div>
  );
}
