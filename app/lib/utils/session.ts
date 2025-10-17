import { cookies } from 'next/headers';
import { AuthService } from '@/app/lib/services/auth';
import type { UserSessionDTO } from '@/src/types';

/**
 * Pobiera dane użytkownika z cookies w Server Components
 * @returns Promise<UserSessionDTO | null> - dane użytkownika lub null jeśli nie zalogowany
 */
export async function getUserFromCookies(): Promise<UserSessionDTO | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await AuthService.getSession(token);
    return session.user;
  } catch {
    return null;
  }
}

