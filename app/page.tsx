import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthService } from '@/app/lib/services/auth';
import { TicketService } from '@/app/lib/services/tickets';
import DashboardHeader from '@/app/components/DashboardHeader';
import { DashboardWelcome } from '@/app/components/dashboard/DashboardWelcome';
import { DashboardStats } from '@/app/components/dashboard/DashboardStats';
import { DashboardInfo } from '@/app/components/dashboard/DashboardInfo';
import { DashboardFeatures } from '@/app/components/dashboard/DashboardFeatures';
import { DashboardTestAccounts } from '@/app/components/dashboard/DashboardTestAccounts';
import { DashboardFooter } from '@/app/components/dashboard/DashboardFooter';
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

/**
 * Refaktoryzowany Dashboard
 * - Zmniejszony z 316 linii do ~60 linii
 * - Komponenty wydzielone do osobnych plików
 * - Ikony w reusable components
 */
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
  const { openCount, resolvedCount } = await TicketService.getTicketStats(user.id, user.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <DashboardWelcome user={user} />

        {/* Stats Cards */}
        <DashboardStats openCount={openCount} resolvedCount={resolvedCount} userRole={user.role} />

        {/* Info Panel */}
        <DashboardInfo user={user} />

        {/* Features Grid */}
        <DashboardFeatures />

        {/* Test Credentials */}
        <DashboardTestAccounts />
      </main>

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}
