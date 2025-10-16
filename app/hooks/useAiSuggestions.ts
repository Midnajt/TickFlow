'use client';

import { useState } from 'react';
import { completeAi } from '@/app/actions/ai/complete';
import type { CategoryDTO } from '@/src/types';

export interface AiSuggestion {
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  summary: string;
  suggestedSteps: string[];
  suggestedAgents: Array<{
    name: string;
    email: string;
  }>;
}

/**
 * Custom Hook dla sugestii AI
 * Wydziela logikę AI z komponentu formularza
 */
export function useAiSuggestions(categories: CategoryDTO[]) {
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Pobiera sugestię AI na podstawie opisu
   */
  const getSuggestion = async (description: string): Promise<void> => {
    if (!description || description.length < 20) {
      setError('Opis musi mieć minimum 20 znaków, aby AI mogło go przeanalizować');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const formData = new FormData();
      formData.append('description', description);

      const result = await completeAi(formData);
      
      // Znajdź nazwy kategorii i podkategorii na podstawie ID
      const category = categories.find(c => c.id === result.categoryId);
      const subcategory = category?.subcategories.find(s => s.id === result.subcategoryId);
      
      // Rozszerz wynik o nazwy
      const enrichedResult: AiSuggestion = {
        ...result,
        categoryName: category?.name || result.categoryId,
        subcategoryName: subcategory?.name || result.subcategoryId,
      };
      
      setSuggestion(enrichedResult);
      setIsVisible(true);
    } catch (err) {
      setError(
        err instanceof Error ? `AI: ${err.message}` : 'Nie udało się uzyskać sugestii AI'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Aplikuje sugestię AI do formularza
   */
  const applySuggestion = (
    onApply: (categoryId: string, subcategoryId: string, title: string) => void
  ): void => {
    if (!suggestion) return;

    // Znajdź kategorię po ID lub nazwie
    const category = categories.find(
      (c) =>
        c.id === suggestion.categoryId ||
        c.name.toLowerCase().includes(suggestion.categoryId.toLowerCase())
    );

    if (!category) {
      setError('Nie znaleziono kategorii sugerowanej przez AI');
      return;
    }

    // Znajdź podkategorię
    const subcategory = category.subcategories.find(
      (sc) =>
        sc.id === suggestion.subcategoryId ||
        sc.name.toLowerCase().includes(suggestion.subcategoryId.toLowerCase())
    );

    if (!subcategory) {
      setError('Nie znaleziono podkategorii sugerowanej przez AI');
      return;
    }

    // Wywołaj callback z wybranymi wartościami
    onApply(
      category.id,
      subcategory.id,
      suggestion.summary.substring(0, 200)
    );

    setIsVisible(false);
  };

  /**
   * Ukrywa panel sugestii
   */
  const dismiss = (): void => {
    setIsVisible(false);
  };

  /**
   * Resetuje stan (np. po zmianie opisu)
   */
  const reset = (): void => {
    setIsVisible(false);
    setSuggestion(null);
    setError(null);
  };

  return {
    suggestion,
    isLoading,
    error,
    isVisible,
    getSuggestion,
    applySuggestion,
    dismiss,
    reset,
  };
}

