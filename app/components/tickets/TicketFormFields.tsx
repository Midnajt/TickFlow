'use client';

import type { CategoryDTO } from '@/src/types';

interface TicketFormFieldsProps {
  title: string;
  description: string;
  selectedCategoryId: string;
  subcategoryId: string;
  categories: CategoryDTO[];
  categoriesLoading: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onAiSuggest?: () => void;
  isAiLoading?: boolean;
}

/**
 * Komponent wyświetlający pola formularza ticketu
 * Wydzielony dla lepszej organizacji kodu
 */
export function TicketFormFields({
  title,
  description,
  selectedCategoryId,
  subcategoryId,
  categories,
  categoriesLoading,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onSubcategoryChange,
  onAiSuggest,
  isAiLoading,
}: TicketFormFieldsProps) {
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <>
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
          Tytuł zgłoszenia *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Krótki opis problemu..."
          maxLength={200}
          required
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/200 znaków</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
          Kategoria *
        </label>
        <select
          id="category"
          value={selectedCategoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
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
            value={subcategoryId}
            onChange={(e) => onSubcategoryChange(e.target.value)}
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
          {onAiSuggest && (
            <button
              type="button"
              onClick={onAiSuggest}
              disabled={isAiLoading || !description || description.length < 20}
              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center gap-1"
              title="Uzyskaj sugestie AI na podstawie opisu"
            >
              <span>✨</span>
              {isAiLoading ? 'Analizuję...' : 'Sugestia AI'}
            </button>
          )}
        </div>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Opisz szczegółowo problem..."
          rows={6}
          maxLength={2000}
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          {description.length}/2000 znaków
          {description.length < 20 && description.length > 0 && (
            <span className="text-yellow-500 ml-2">(min. 20 znaków dla sugestii AI)</span>
          )}
        </p>
      </div>
    </>
  );
}

