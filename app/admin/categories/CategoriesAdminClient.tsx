"use client";

import { useState } from "react";
import type { CategoryWithAgentsDTO } from "@/src/types";
import { adminApi } from "@/app/lib/api-client";

interface Props {
  initialCategories: CategoryWithAgentsDTO[];
}

export function CategoriesAdminClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Temporary state for editing
  const [tempCategoryDescription, setTempCategoryDescription] = useState<string>("");
  const [tempSubcategoryName, setTempSubcategoryName] = useState<string>("");
  const [tempSubcategoryDescription, setTempSubcategoryDescription] = useState<string>("");

  const handleUpdateCategoryDescription = async (categoryId: string) => {
    if (!tempCategoryDescription.trim()) {
      setError("Opis nie może być pusty");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApi.updateCategory(categoryId, tempCategoryDescription);
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, description: tempCategoryDescription }
          : cat
      ));
      
      setEditingCategoryId(null);
      setTempCategoryDescription("");
      setSuccess("Opis kategorii został zaktualizowany");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd aktualizacji opisu kategorii");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSubcategory = async (subcategoryId: string) => {
    if (!tempSubcategoryName.trim()) {
      setError("Nazwa podkategorii nie może być pusta");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApi.updateSubcategory(subcategoryId, {
        name: tempSubcategoryName,
        description: tempSubcategoryDescription || null
      });
      
      // Update local state
      setCategories(prev => prev.map(cat => ({
        ...cat,
        subcategories: cat.subcategories.map(sub => 
          sub.id === subcategoryId 
            ? { 
                ...sub, 
                name: tempSubcategoryName, 
                description: tempSubcategoryDescription || null 
              }
            : sub
        )
      })));
      
      setEditingSubcategoryId(null);
      setTempSubcategoryName("");
      setTempSubcategoryDescription("");
      setSuccess("Podkategoria została zaktualizowana");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd aktualizacji podkategorii");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingCategory = (category: CategoryWithAgentsDTO) => {
    setEditingCategoryId(category.id);
    setTempCategoryDescription(category.description || "");
  };

  const startEditingSubcategory = (subcategory: any) => {
    setEditingSubcategoryId(subcategory.id);
    setTempSubcategoryName(subcategory.name);
    setTempSubcategoryDescription(subcategory.description || "");
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditingSubcategoryId(null);
    setTempCategoryDescription("");
    setTempSubcategoryName("");
    setTempSubcategoryDescription("");
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Brak kategorii do wyświetlenia</p>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category.id} className="bg-white shadow rounded-lg p-6">
            {/* Category Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
              
              {/* Editable description */}
              <div className="mt-2">
                {editingCategoryId === category.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={tempCategoryDescription}
                      onChange={(e) => setTempCategoryDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Opis kategorii..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateCategoryDescription(category.id)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSaving ? "Zapisywanie..." : "Zapisz"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-gray-600 flex-1">
                      {category.description || "Brak opisu"}
                    </p>
                    <button
                      onClick={() => startEditingCategory(category)}
                      className="ml-4 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                    >
                      Edytuj opis
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Subcategories Table */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Podkategorie</h3>
              {category.subcategories.length === 0 ? (
                <p className="text-gray-500 text-sm">Brak podkategorii</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nazwa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Opis
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.subcategories.map((subcategory) => (
                        <tr key={subcategory.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingSubcategoryId === subcategory.id ? (
                              <input
                                type="text"
                                value={tempSubcategoryName}
                                onChange={(e) => setTempSubcategoryName(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                {subcategory.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingSubcategoryId === subcategory.id ? (
                              <textarea
                                value={tempSubcategoryDescription}
                                onChange={(e) => setTempSubcategoryDescription(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={2}
                                placeholder="Opis podkategorii..."
                              />
                            ) : (
                              <div className="text-sm text-gray-600">
                                {subcategory.description || "Brak opisu"}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {editingSubcategoryId === subcategory.id ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleUpdateSubcategory(subcategory.id)}
                                  disabled={isSaving}
                                  className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                                >
                                  {isSaving ? "Zapisywanie..." : "Zapisz"}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  disabled={isSaving}
                                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                >
                                  Anuluj
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditingSubcategory(subcategory)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edytuj
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Assigned Agents */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Przypisani agenci</h3>
              {category.agents.length === 0 ? (
                <p className="text-gray-500 text-sm">Brak przypisanych agentów</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {category.agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {agent.name} ({agent.email})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
