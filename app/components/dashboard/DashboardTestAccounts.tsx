/**
 * Sekcja z testowymi kontami
 */
export function DashboardTestAccounts() {
  return (
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
  );
}

