/**
 * Sekcja z informacjami o technologiach i funkcjonalnościach
 */
export function DashboardFeatures() {
  return (
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
  );
}

