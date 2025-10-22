import { redirect } from "next/navigation";
import { getServerSession } from "@/app/lib/supabase-server";
import { AdminNavigation } from "@/app/components/admin/AdminNavigation";
import { AdminErrorBoundary } from "@/app/components/admin/AdminErrorBoundary";
import DashboardHeader from "@/app/components/DashboardHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/tickets");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Wspólny górny pasek - kliknięcie w logo TickFlow wróci do strony głównej */}
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Panel Administratora</h1>
          <p className="mt-2 text-sm text-gray-400">
            Zarządzaj użytkownikami, kategoriami i monitoruj aktywność systemu
          </p>
        </div>

        {/* Navigation with active state */}
        <AdminNavigation />

        {/* Error Boundary catches errors in child components */}
        <AdminErrorBoundary>{children}</AdminErrorBoundary>
      </div>
    </div>
  );
}
