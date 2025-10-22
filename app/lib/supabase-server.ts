import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { cookies } from 'next/headers'
import type { UserSessionDTO } from '@/src/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Re-export createSupabaseAdmin from supabase-auth.ts
 * This function creates a Supabase client with service role key (bypasses RLS)
 */
export { createSupabaseAdmin } from './utils/supabase-auth'

/**
 * Get server session from cookies (for use in Server Components)
 * @returns User session data with role information
 * @throws Error if not authenticated or token is invalid
 */
export async function getServerSession(): Promise<{ user: UserSessionDTO }> {
  // Import AuthService dynamically to avoid circular dependencies
  const { AuthService } = await import('./services/auth')
  
  // Get token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) {
    throw new Error('AUTHENTICATION_ERROR:Brak autoryzacji - musisz być zalogowany')
  }
  
  try {
    const session = await AuthService.getSession(token)
    return { user: session.user }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('AUTHENTICATION_ERROR')) {
      throw error
    }
    throw new Error('AUTHENTICATION_ERROR:Token jest nieprawidłowy lub wygasł')
  }
}

