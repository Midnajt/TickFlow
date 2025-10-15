'use client';

import type { AiSuggestion } from '@/app/hooks/useAiSuggestions';

interface AiSuggestionPanelProps {
  suggestion: AiSuggestion;
  onApply: () => void;
  onDismiss: () => void;
}

/**
 * Komponent wyświetlający sugestie AI
 * Wydzielony dla lepszej czytelności i możliwości użycia React.memo
 */
export function AiSuggestionPanel({
  suggestion,
  onApply,
  onDismiss,
}: AiSuggestionPanelProps) {
  return (
    <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="font-semibold text-purple-200">Sugestie AI</h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Zamknij sugestie"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Kategoria:</span>
          <span className="ml-2 text-purple-200 font-medium">
            {suggestion.categoryId}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Podkategoria:</span>
          <span className="ml-2 text-purple-200 font-medium">
            {suggestion.subcategoryId}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Podsumowanie:</span>
          <p className="mt-1 text-purple-100">{suggestion.summary}</p>
        </div>
        {suggestion.suggestedSteps.length > 0 && (
          <div>
            <span className="text-gray-400">Sugerowane kroki:</span>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-purple-100">
              {suggestion.suggestedSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onApply}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
      >
        Zastosuj sugestie
      </button>
    </div>
  );
}

