import { Metadata } from "next";
import Link from "next/link";
import { AiExampleComponent } from "@/app/components/examples/AiExampleComponent";

export const metadata: Metadata = {
  title: "OpenRouter AI Demo | TickFlow",
  description: "Demonstracja możliwości integracji AI w systemie TickFlow",
};

export default function AiDemoPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            OpenRouter AI Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Eksperymentuj z możliwościami AI w systemie TickFlow
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎯</span>
              <h3 className="font-semibold">Klasyfikacja</h3>
            </div>
            <p className="text-sm text-gray-400">
              Automatyczna klasyfikacja ticketów do właściwych kategorii i podkategorii
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💬</span>
              <h3 className="font-semibold">Asystent Q&A</h3>
            </div>
            <p className="text-sm text-gray-400">
              Zadawaj pytania i otrzymuj pomocne odpowiedzi od AI
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="font-semibold">Real-time Streaming</h3>
            </div>
            <p className="text-sm text-gray-400">
              Odpowiedzi generowane na żywo z wykorzystaniem SSE
            </p>
          </div>
        </div>

        {/* Main Demo Component */}
        <AiExampleComponent />

        {/* Documentation Links */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📚 Dokumentacja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-purple-300">Dla deweloperów</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>
                  → <code className="text-purple-300">app/lib/services/openrouter/README.md</code> - API Reference
                </li>
                <li>
                  → <code className="text-purple-300">app/lib/services/openrouter/QUICKSTART.md</code> - Szybki start
                </li>
                <li>
                  → <code className="text-purple-300">app/actions/ai/complete.ts</code> - Server Actions
                </li>
                <li>
                  → <code className="text-purple-300">app/api/ai/complete/route.ts</code> - API Endpoint
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-blue-300">Integracja</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>
                  ✅ <strong>Formularz ticketów</strong> - AI już zintegrowane w CreateTicketForm
                </li>
                <li>
                  ✅ <strong>Rate limiting</strong> - 5 żądań/minutę na IP
                </li>
                <li>
                  ✅ <strong>Model</strong> - openai/gpt-4o-mini (szybki i tani)
                </li>
                <li>
                  ✅ <strong>Bezpieczeństwo</strong> - Server-side only, Zod validation
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <span>⚙️</span>
            Informacje techniczne
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2 text-purple-300">Konfiguracja</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• <strong>Model:</strong> openai/gpt-4o-mini</li>
                <li>• <strong>Temperature:</strong> 0.1-0.3 (deterministyczna)</li>
                <li>• <strong>Max tokens:</strong> 300-600</li>
                <li>• <strong>Timeout:</strong> 30 sekund</li>
                <li>• <strong>Retry:</strong> 2 próby z exponential backoff</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-blue-300">Obsługiwane formaty</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• <strong>Structured:</strong> JSON Schema z walidacją</li>
                <li>• <strong>Text:</strong> Prosta odpowiedź tekstowa</li>
                <li>• <strong>Stream:</strong> SSE (Server-Sent Events)</li>
                <li>• <strong>Walidacja:</strong> Zod na wejściu i wyjściu</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to App */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <span>←</span>
            Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}

