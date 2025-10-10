import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/app/lib/services/auth';

/**
 * Next.js Middleware - Ochrana tras i przekierowania
 * Uruchamia się przed każdym żądaniem do aplikacji
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Pobierz token z cookie
  const token = request.cookies.get('auth-token')?.value;

  // Ścieżki publiczne (dostępne bez logowania)
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Ścieżki wymagające autoryzacji
  const protectedPaths = ['/', '/tickets', '/categories', '/change-password'];
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Jeśli użytkownik jest na ścieżce publicznej i MA token -> redirect do /
  if (isPublicPath && token) {
    try {
      // Weryfikuj token przed przekierowaniem
      await AuthService.getSession(token);
      
      // Token jest ważny, przekieruj do głównej strony
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    } catch (error) {
      // Token nieprawidłowy - usuń cookie i pozwól zostać na stronie logowania
      const response = NextResponse.next();
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // Jeśli użytkownik jest na chronionej ścieżce i NIE MA tokenu -> redirect do /login
  if (isProtectedPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Jeśli użytkownik MA token i jest na chronionej ścieżce -> weryfikuj token
  if (isProtectedPath && token) {
    try {
      const session = await AuthService.getSession(token);
      
      // Sprawdź czy użytkownik musi zmienić hasło
      if (session.user.passwordResetRequired && pathname !== '/change-password') {
        // Przekieruj do zmiany hasła
        const url = request.nextUrl.clone();
        url.pathname = '/change-password';
        return NextResponse.redirect(url);
      }

      // Jeśli użytkownik jest na /change-password ale NIE wymaga zmiany hasła
      if (!session.user.passwordResetRequired && pathname === '/change-password') {
        // Przekieruj do głównej strony
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }

      // Token jest ważny - pozwól na dostęp
      return NextResponse.next();
    } catch (error) {
      // Token nieprawidłowy lub wygasł - usuń cookie i przekieruj do logowania
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // Dla wszystkich innych przypadków - pozwól na dostęp
  return NextResponse.next();
}

/**
 * Konfiguracja middleware - określa które ścieżki mają być przetwarzane
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

