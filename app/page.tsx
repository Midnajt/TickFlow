export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          Witaj w <span className="text-blue-600 dark:text-blue-400">TickFlow</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Twój projekt Next.js z Tailwind CSS jest gotowy!
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Dokumentacja Next.js
          </a>
          <a
            href="https://tailwindcss.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors shadow-lg hover:shadow-xl dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Dokumentacja Tailwind
          </a>
        </div>
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Przykładowe style Tailwind CSS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="font-medium text-blue-900 dark:text-blue-100">Niebieski</p>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="font-medium text-green-900 dark:text-green-100">Zielony</p>
            </div>
            <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <p className="font-medium text-purple-900 dark:text-purple-100">Fioletowy</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

