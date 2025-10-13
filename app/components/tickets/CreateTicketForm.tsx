'use client';

import { useState } from 'react';
import { useCategories } from '@/app/hooks/useCategories';
import { ticketsApi } from '@/app/lib/api-client';
import type { CreateTicketCommand } from '@/src/types';

interface CreateTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
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

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

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

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Opis problemu *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Opisz szczegółowo problem..."
          rows={6}
          maxLength={2000}
          required
        />
        <p className="text-xs text-gray-400 mt-1">{formData.description.length}/2000 znaków</p>
      </div>

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

