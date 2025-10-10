import { NextRequest, NextResponse } from "next/server";

/**
 * Prosta implementacja rate limitera w pamięci
 * W produkcji należy użyć Redis lub podobnego rozwiązania
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Mapa przechowująca informacje o próbach logowania per IP
const rateLimitMap = new Map<string, RateLimitEntry>();

// Konfiguracja rate limitera
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuta w milisekundach
const MAX_REQUESTS = 5; // Maksymalnie 5 prób na minutę

/**
 * Czyszczenie wygasłych wpisów co 5 minut
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Pobiera IP klienta z żądania
 */
function getClientIP(request: NextRequest): string {
  // Sprawdzenie nagłówków proxy (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const real = request.headers.get("x-real-ip");
  if (real) {
    return real;
  }

  // Fallback do localhost (development)
  return "127.0.0.1";
}

/**
 * Rate limiter dla endpointu logowania
 * @returns null jeśli request może być przetworzony, NextResponse z błędem jeśli limit przekroczony
 */
export function checkRateLimit(request: NextRequest): NextResponse | null {
  const clientIP = getClientIP(request);
  const now = Date.now();

  // Pobranie lub utworzenie wpisu dla IP
  let entry = rateLimitMap.get(clientIP);

  if (!entry || now > entry.resetTime) {
    // Nowy wpis lub wygasły - reset countera
    entry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitMap.set(clientIP, entry);
    return null; // Request dozwolony
  }

  // Zwiększenie licznika
  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    // Limit przekroczony
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // w sekundach

    return NextResponse.json(
      {
        error: "RATE_LIMIT_EXCEEDED",
        message: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
        },
      }
    );
  }

  // Request dozwolony, ale aktualizujemy counter
  return null;
}

/**
 * Pomocnicza funkcja do dodawania nagłówków rate limit do odpowiedzi
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const clientIP = getClientIP(request);
  const entry = rateLimitMap.get(clientIP);

  if (entry) {
    const remaining = Math.max(0, MAX_REQUESTS - entry.count);
    response.headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(entry.resetTime).toISOString()
    );
  }

  return response;
}

