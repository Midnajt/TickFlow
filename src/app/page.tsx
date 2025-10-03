'use client';

import Image from "next/image";
import { useEffect, useState } from "react";

interface DBStatus {
  status: 'checking' | 'success' | 'error';
  message: string;
  timestamp?: string;
}

export default function Home() {
  const [dbStatus, setDbStatus] = useState<DBStatus>({
    status: 'checking',
    message: 'Sprawdzanie połączenia z bazą danych...'
  });

  useEffect(() => {
    const checkDBConnection = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (response.ok) {
          setDbStatus({
            status: 'success',
            message: data.message,
            timestamp: data.timestamp
          });
        } else {
          setDbStatus({
            status: 'error',
            message: data.message,
            timestamp: data.timestamp
          });
        }
      } catch {
        setDbStatus({
          status: 'error',
          message: 'Nie można nawiązać połączenia z serwerem'
        });
      }
    };

    checkDBConnection();
  }, []);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        {/* Status połączenia z bazą danych */}
        <div className={`w-full p-4 rounded-lg border-2 ${
          dbStatus.status === 'checking' 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
            : dbStatus.status === 'success'
            ? 'border-green-500 bg-green-50 dark:bg-green-950'
            : 'border-red-500 bg-red-50 dark:bg-red-950'
        }`}>
          <div className="flex items-center gap-3">
            {dbStatus.status === 'checking' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
            {dbStatus.status === 'success' && (
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {dbStatus.status === 'error' && (
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            <div>
              <p className={`font-semibold ${
                dbStatus.status === 'checking'
                  ? 'text-blue-800 dark:text-blue-200'
                  : dbStatus.status === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {dbStatus.status === 'checking' && 'Sprawdzanie...'}
                {dbStatus.status === 'success' && '✓ Połączono z bazą danych'}
                {dbStatus.status === 'error' && '✗ Błąd połączenia'}
              </p>
              <p className={`text-sm ${
                dbStatus.status === 'checking'
                  ? 'text-blue-700 dark:text-blue-300'
                  : dbStatus.status === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {dbStatus.message}
              </p>
              {dbStatus.timestamp && (
                <p className="text-xs mt-1 opacity-70">
                  {new Date(dbStatus.timestamp).toLocaleString('pl-PL')}
                </p>
              )}
            </div>
          </div>
        </div>

        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
