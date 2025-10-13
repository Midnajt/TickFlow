'use client';

import { useState, useEffect } from 'react';
import { categoriesApi } from '@/app/lib/api-client';
import type { CategoryDTO } from '@/src/types';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await categoriesApi.getCategories(true);
        setCategories(result.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
  };
}

