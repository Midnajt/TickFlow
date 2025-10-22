"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Nawigacja admin panelu z active state
 */
export function AdminNavigation() {
  const pathname = usePathname();

  const tabs = [
    { name: "Kategorie", href: "/admin/categories" },
    { name: "Użytkownicy", href: "/admin/users" },
    { name: "Logi Aktywności", href: "/admin/logs" },
  ];

  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8" aria-label="Admin Navigation">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

