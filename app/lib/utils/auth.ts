import { NextRequest } from "next/server";
import { AuthService } from "@/app/lib/services/auth";
import type { UserSessionDTO } from "@/src/types";

/**
 * Pobiera token JWT z żądania (cookie lub Authorization header)
 * @param request - Next.js request object
 * @returns Token JWT lub null jeśli nie znaleziono
 */
export function getAuthToken(request: NextRequest): string | null {
  // Priorytet 1: HTTP-only cookie (zalecane)
  const cookieToken = request.cookies.get("auth-token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Priorytet 2: Authorization header (Bearer token)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Weryfikuje autentykację użytkownika i zwraca dane sesji
 * Rzuca błąd jeśli użytkownik nie jest zalogowany lub token jest nieprawidłowy
 * 
 * @param request - Next.js request object
 * @returns Dane sesji użytkownika
 * @throws Error jeśli brak autoryzacji lub token nieprawidłowy
 */
export async function requireAuth(request: NextRequest): Promise<UserSessionDTO> {
  const token = getAuthToken(request);

  if (!token) {
    throw new Error("AUTHENTICATION_ERROR:Brak autoryzacji - musisz być zalogowany");
  }

  try {
    const session = await AuthService.getSession(token);
    return session.user;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AUTHENTICATION_ERROR")) {
      throw error;
    }
    throw new Error("AUTHENTICATION_ERROR:Token jest nieprawidłowy lub wygasł");
  }
}

/**
 * Weryfikuje czy użytkownik ma określoną rolę
 * @param user - Dane sesji użytkownika
 * @param allowedRoles - Dozwolone role
 * @returns true jeśli użytkownik ma odpowiednią rolę
 */
export function hasRole(
  user: UserSessionDTO,
  allowedRoles: UserSessionDTO["role"][]
): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Middleware do weryfikacji roli użytkownika
 * Rzuca błąd jeśli użytkownik nie ma odpowiedniej roli
 * 
 * @param user - Dane sesji użytkownika
 * @param allowedRoles - Dozwolone role
 * @throws Error jeśli użytkownik nie ma odpowiedniej roli
 */
export function requireRole(
  user: UserSessionDTO,
  allowedRoles: UserSessionDTO["role"][]
): void {
  if (!hasRole(user, allowedRoles)) {
    throw new Error(
      `AUTHORIZATION_ERROR:Brak uprawnień. Wymagana rola: ${allowedRoles.join(" lub ")}`
    );
  }
}

/**
 * Wrapper dla route handlerów wymagających autentykacji
 * Automatycznie weryfikuje token i przekazuje dane użytkownika do handlera
 * 
 * @example
 * export const GET = withAuth(async (request, user) => {
 *   return NextResponse.json({ message: `Hello ${user.name}` });
 * });
 */
export function withAuth<T = unknown>(
  handler: (request: NextRequest, user: UserSessionDTO, context?: T) => Promise<Response>
) {
  return async (request: NextRequest, context?: T): Promise<Response> => {
    try {
      const user = await requireAuth(request);
      return await handler(request, user, context);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("AUTHENTICATION_ERROR")) {
          const message = error.message.split(":")[1] || "Błąd uwierzytelniania";
          return new Response(
            JSON.stringify({
              error: "AUTHENTICATION_ERROR",
              message,
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (error.message.startsWith("AUTHORIZATION_ERROR")) {
          const message = error.message.split(":")[1] || "Brak uprawnień";
          return new Response(
            JSON.stringify({
              error: "AUTHORIZATION_ERROR",
              message,
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      return new Response(
        JSON.stringify({
          error: "INTERNAL_ERROR",
          message: "Wystąpił błąd serwera",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

/**
 * Wrapper dla route handlerów wymagających określonej roli
 * 
 * @example
 * export const GET = withRole(['AGENT'], async (request, user) => {
 *   return NextResponse.json({ message: "Only agents can see this" });
 * });
 */
export function withRole<T = unknown>(
  allowedRoles: UserSessionDTO["role"][],
  handler: (request: NextRequest, user: UserSessionDTO, context?: T) => Promise<Response>
) {
  return withAuth<T>(async (request, user, context) => {
    requireRole(user, allowedRoles);
    return await handler(request, user, context);
  });
}

/**
 * Sprawdza czy agent ma dostęp do określonej kategorii
 * Wymaga dostępu do bazy danych - używane w service layer
 * 
 * @param agentId - ID agenta
 * @param categoryId - ID kategorii
 * @returns Promise<boolean> - true jeśli agent ma dostęp
 */
export async function checkAgentCategoryAccess(
  agentId: string,
  categoryId: string
): Promise<boolean> {
  // Import dynamiczny, żeby uniknąć circular dependency
  const { createSupabaseAdmin } = await import("./supabase-auth");
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("agent_categories")
    .select("id")
    .eq("agent_id", agentId)
    .eq("category_id", categoryId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

