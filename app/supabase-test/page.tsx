import Link from 'next/link'
import { supabaseServer } from '@/app/lib/supabase-server'

export default async function SupabaseTestPage() {
  const results = {
    envVars: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
    },
    connection: {
      status: 'unknown',
      message: '',
      data: null as any,
    },
  }

  // Test database connection
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('id, email, role')
      .limit(1)

    if (error) {
      results.connection.status = 'error'
      results.connection.message = error.message
    } else {
      results.connection.status = 'success'
      results.connection.message = 'Successfully connected to database'
      results.connection.data = data
    }
  } catch (err) {
    results.connection.status = 'error'
    results.connection.message = err instanceof Error ? err.message : 'Unknown error'
  }

  const isWorking = 
    results.envVars.url === '✅ Set' &&
    results.envVars.anonKey === '✅ Set' &&
    results.envVars.serviceKey === '✅ Set' &&
    results.connection.status === 'success'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <main className="w-full max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Supabase Connection Test
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Testing database connectivity and configuration
            </p>
          </div>

          {/* Overall Status */}
          <div className={`p-6 rounded-xl mb-6 ${
            isWorking 
              ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500' 
              : 'bg-red-100 dark:bg-red-900 border-2 border-red-500'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl">
                {isWorking ? '✅' : '❌'}
              </span>
              <p className={`text-2xl font-bold ${
                isWorking 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {isWorking 
                  ? 'Everything is working perfectly!' 
                  : 'Connection issues detected'}
              </p>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Environment Variables
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  NEXT_PUBLIC_SUPABASE_URL
                </span>
                <span className="text-lg">{results.envVars.url}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </span>
                <span className="text-lg">{results.envVars.anonKey}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  SUPABASE_SERVICE_ROLE_KEY
                </span>
                <span className="text-lg">{results.envVars.serviceKey}</span>
              </div>
            </div>
          </div>

          {/* Database Connection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Database Connection
            </h2>
            <div className={`p-6 rounded-lg ${
              results.connection.status === 'success'
                ? 'bg-green-50 dark:bg-green-900/30'
                : 'bg-red-50 dark:bg-red-900/30'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">
                  {results.connection.status === 'success' ? '✅' : '❌'}
                </span>
                <div>
                  <p className={`font-semibold text-lg ${
                    results.connection.status === 'success'
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {results.connection.status === 'success' ? 'Connected' : 'Connection Failed'}
                  </p>
                  <p className={`text-sm ${
                    results.connection.status === 'success'
                      ? 'text-green-700 dark:text-green-200'
                      : 'text-red-700 dark:text-red-200'
                  }`}>
                    {results.connection.message}
                  </p>
                </div>
              </div>
              
              {results.connection.data && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sample Query Result:
                  </p>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                    {JSON.stringify(results.connection.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Return Button */}
          <div className="flex justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>←</span>
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

