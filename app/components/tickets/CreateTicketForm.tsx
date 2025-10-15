'use client';

import { useState } from 'react';
import { useCategories } from '@/app/hooks/useCategories';
import { useAiSuggestions } from '@/app/hooks/useAiSuggestions';
import { ticketsApi } from '@/app/lib/api-client';
import { TicketFormFields } from './TicketFormFields';
import { AiSuggestionPanel } from './AiSuggestionPanel';
import { FormActions } from './FormActions';
import type { CreateTicketCommand } from '@/src/types';

interface CreateTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Refaktoryzowany formularz tworzenia ticketu
 * - Używa custom hooks dla AI
 * - Wydzielone komponenty dla lepszej organizacji
 * - Zmniejszony z 326 do ~100 linii
 */
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

  // AI Suggestions Hook
  const ai = useAiSuggestions(categories);

  /**
   * Handler dla sugestii AI
   */
  const handleAiSuggest = async () => {
    await ai.getSuggestion(formData.description);
  };

  /**
   * Handler dla zastosowania sugestii AI
   */
  const handleApplyAiSuggestion = () => {
    ai.applySuggestion((categoryId, subcategoryId, title) => {
      setSelectedCategoryId(categoryId);
      setFormData({
        ...formData,
        subcategoryId,
        title: formData.title || title,
      });
    });
  };

  /**
   * Handler zmiany opisu (resetuje AI suggestions)
   */
  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value });
    ai.reset();
  };

  /**
   * Handler zmiany kategorii (resetuje podkategorię)
   */
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setFormData({ ...formData, subcategoryId: '' });
  };

  /**
   * Submit formularza
   */
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
      {(error || ai.error) && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error || ai.error}
        </div>
      )}

      {/* Form Fields */}
      <TicketFormFields
        title={formData.title}
        description={formData.description}
        selectedCategoryId={selectedCategoryId}
        subcategoryId={formData.subcategoryId}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onTitleChange={(value) => setFormData({ ...formData, title: value })}
        onDescriptionChange={handleDescriptionChange}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={(value) => setFormData({ ...formData, subcategoryId: value })}
        onAiSuggest={handleAiSuggest}
        isAiLoading={ai.isLoading}
      />

      {/* AI Suggestion Panel */}
      {ai.isVisible && ai.suggestion && (
        <AiSuggestionPanel
          suggestion={ai.suggestion}
          onApply={handleApplyAiSuggestion}
          onDismiss={ai.dismiss}
        />
      )}

      {/* Form Actions */}
      <FormActions
        isSubmitting={isSubmitting}
        isDisabled={!formData.subcategoryId}
        onCancel={onCancel}
      />
    </form>
  );
}
