/**
 * Stopka dashboardu
 */
export function DashboardFooter() {
  return (
    <footer className="mt-12 pb-8 text-center text-gray-400 text-sm">
      <p>TickFlow MVP v1.0.0 | Built with Next.js 15, TypeScript & Supabase</p>
      <p className="mt-2 text-xs text-gray-500">
        Crafted with ❤️ by{' '}
        <a
          href="https://www.linkedin.com/in/%E2%97%8F-marcin-krzysztoszek-a7851116b/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 font-medium hover:text-blue-300 transition-colors cursor-pointer"
        >
          Marcin Krzysztoszek
        </a>{' '}
        <a
          href="https://github.com/Midnajt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
        >
          AddPattern
        </a>
      </p>
    </footer>
  );
}

