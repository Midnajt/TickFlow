'use client';

import { useState } from 'react';
import { useCategories } from '@/app/hooks/useCategories';
import { ticketsApi } from '@/app/lib/api-client';
import { completeAi } from '@/app/actions/ai/complete';
import type { CreateTicketCommand } from '@/src/types';

interface CreateTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface AiSuggestion {
  categoryId: string;
  subcategoryId: string;
  summary: string;
  suggestedSteps: string[];
}

export function CreateTicketForm({ onSuccess, onCancel }: CreateTicketFormProps) {
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [formData, setFormData] = useState<CreateTicketCommand>({
    title: '',
    description: '',
    subcategoryId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI features
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  /**
   * Funkcja do uzyskania sugestii AI na podstawie opisu problemu
   */
  const handleAiSuggest = async () => {
    if (!formData.description || formData.description.length < 20) {
      setError('Opis musi mieć minimum 20 znaków, aby AI mogło go przeanalizować');
      return;
    }

    setIsAiLoading(true);
    setError(null);
    setAiSuggestion(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('description', formData.description);
      
      const suggestion = await completeAi(formDataObj);
      setAiSuggestion(suggestion);
      setShowAiSuggestion(true);
    } catch (err) {
      setError(
        err instanceof Error 
          ? `AI: ${err.message}` 
          : 'Nie udało się uzyskać sugestii AI'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * Funkcja do zastosowania sugestii AI do formularza
   */
  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;

    // Znajdź kategorię po ID lub nazwie
    const category = categories.find(
      (c) => 
        c.id === aiSuggestion.categoryId || 
        c.name.toLowerCase().includes(aiSuggestion.categoryId.toLowerCase())
    );

    if (category) {
      setSelectedCategoryId(category.id);
      
      // Znajdź podkategorię
      const subcategory = category.subcategories.find(
        (sc) => 
          sc.id === aiSuggestion.subcategoryId ||
          sc.name.toLowerCase().includes(aiSuggestion.subcategoryId.toLowerCase())
      );

      if (subcategory) {
        setFormData({
          ...formData,
          subcategoryId: subcategory.id,
          title: formData.title || aiSuggestion.summary.substring(0, 200),
        });
      }
    }

    setShowAiSuggestion(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.description || !formData.subcategoryId) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    try {
      setIsSubmitting(true);
      await ticketsApi.createTicket(formData);
      
      // Reset form
      setFormData({ title: '', description: '', subcategoryId: '' });
      setSelectedCategoryId('');
      
      // Notify success
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się utworzyć zgłoszenia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
          Tytuł zgłoszenia *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Krótki opis problemu..."
          maxLength={200}
          required
        />
        <p className="text-xs text-gray-400 mt-1">{formData.title.length}/200 znaków</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
          Kategoria *
        </label>
        <select
          id="category"
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            setFormData({ ...formData, subcategoryId: '' }); // Reset subcategory
          }}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={categoriesLoading}
          required
        >
          <option value="">Wybierz kategorię...</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      {selectedCategory && (
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-300 mb-2">
            Podkategoria *
          </label>
          <select
            id="subcategory"
            value={formData.subcategoryId}
            onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Wybierz podkategorię...</option>
            {selectedCategory.subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Description with AI Button */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">
            Opis problemu *
          </label>
          <button
            type="button"
            onClick={handleAiSuggest}
            disabled={isAiLoading || !formData.description || formData.description.length < 20}
            className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center gap-1"
            title="Uzyskaj sugestie AI na podstawie opisu"
          >
            <span>✨</span>
            {isAiLoading ? 'Analizuję...' : 'Sugestia AI'}
          </button>
        </div>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => {
            setFormData({ ...formData, description: e.target.value });
            setShowAiSuggestion(false); // Ukryj sugestię po zmianie opisu
          }}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Opisz szczegółowo problem..."
          rows={6}
          maxLength={2000}
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.description.length}/2000 znaków
          {formData.description.length < 20 && formData.description.length > 0 && (
            <span className="text-yellow-500 ml-2">
              (min. 20 znaków dla sugestii AI)
            </span>
          )}
        </p>
      </div>

      {/* AI Suggestion Box */}
      {showAiSuggestion && aiSuggestion && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h3 className="font-semibold text-purple-200">Sugestie AI</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAiSuggestion(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Zamknij sugestie"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Kategoria:</span>
              <span className="ml-2 text-purple-200 font-medium">
                {aiSuggestion.categoryId}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Podkategoria:</span>
              <span className="ml-2 text-purple-200 font-medium">
                {aiSuggestion.subcategoryId}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Podsumowanie:</span>
              <p className="mt-1 text-purple-100">{aiSuggestion.summary}</p>
            </div>
            {aiSuggestion.suggestedSteps.length > 0 && (
              <div>
                <span className="text-gray-400">Sugerowane kroki:</span>
                <ol className="mt-1 ml-4 list-decimal space-y-1 text-purple-100">
                  {aiSuggestion.suggestedSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleApplyAiSuggestion}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
          >
            Zastosuj sugestie
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.subcategoryId}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isSubmitting ? 'Tworzenie...' : 'Utwórz zgłoszenie'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Anuluj
          </button>
        )}
      </div>
    </form>
  );
}

