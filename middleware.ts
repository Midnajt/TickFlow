import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Next.js Middleware - Ochrana tras i przekierowania
 * Uruchamia się przed każdym żądaniem do aplikacji
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Pobierz token z cookie
  const token = request.cookies.get('auth-token')?.value;
  
  // Debug logging for E2E tests
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Middleware Debug]', {
      pathname,
      hasToken: !!token,
      cookies: request.cookies.getAll().map(c => c.name),
    });
  }

  // Ścieżki publiczne (dostępne bez logowania)
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Ścieżki wymagające autoryzacji
  const protectedPaths = ['/', '/tickets', '/categories', '/change-password'];
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Wspólny sekret JWT (dopasowany do AuthService)
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  );

  async function verifyToken(value: string | undefined) {
    if (!value) return false;
    try {
      await jwtVerify(value, JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  }

  // Jeśli użytkownik jest na ścieżce publicznej i MA token -> redirect do /
  if (isPublicPath && token) {
    const isValid = await verifyToken(token);
    if (isValid) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    const response = NextResponse.next();
    response.cookies.delete('auth-token');
    return response;
  }

  // Jeśli użytkownik jest na chronionej ścieżce i NIE MA tokenu -> redirect do /login
  if (isProtectedPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Jeśli użytkownik MA token i jest na chronionej ścieżce -> weryfikuj token
  if (isProtectedPath && token) {
    const isValid = await verifyToken(token);
    if (isValid) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    response.cookies.delete('auth-token');
    return response;
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

