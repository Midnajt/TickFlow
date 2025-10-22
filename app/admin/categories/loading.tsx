/**
 * Loading state dla strony kategorii w admin panelu
 * Automatycznie używany przez Next.js jako Suspense fallback
 */
export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      {/* Skeleton dla kategorii */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
          {/* Header skeleton */}
          <div className="mb-4">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>

          {/* Subcategories skeleton */}
          <div className="mt-6">
            <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-750 rounded"></div>
              <div className="h-10 bg-gray-750 rounded"></div>
            </div>
          </div>

          {/* Agents skeleton */}
          <div className="mt-6">
            <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-750 rounded w-32"></div>
              <div className="h-6 bg-gray-750 rounded w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

