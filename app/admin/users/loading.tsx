/**
 * Loading state dla strony użytkowników w admin panelu
 * Automatycznie używany przez Next.js jako Suspense fallback
 */
export default function UsersLoading() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <div className="h-6 bg-gray-700 rounded w-40 animate-pulse"></div>
        <div className="h-10 bg-gray-700 rounded w-40 animate-pulse"></div>
      </div>

      {/* Filters skeleton */}
      <div className="px-6 py-4 border-b border-gray-700 flex gap-4">
        <div className="h-10 bg-gray-750 rounded flex-1 animate-pulse"></div>
        <div className="h-10 bg-gray-750 rounded w-40 animate-pulse"></div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-750 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

