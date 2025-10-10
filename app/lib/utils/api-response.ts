import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardowa odpowiedź sukcesu API
 */
export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Standardowa odpowiedź błędu API
 */
export function errorResponse(
  message: string,
  code: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: code,
      message,
    },
    { status }
  );
}

/**
 * Odpowiedź błędu walidacji (Zod)
 */
export function validationErrorResponse(error: ZodError): NextResponse {
  const formattedErrors = error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return NextResponse.json(
    {
      error: "VALIDATION_ERROR",
      message: "Błąd walidacji danych",
      errors: formattedErrors,
    },
    { status: 400 }
  );
}

/**
 * Odpowiedź dla błędu "nie znaleziono"
 */
export function notFoundResponse(resource: string): NextResponse {
  return errorResponse(
    `${resource} nie został znaleziony`,
    "NOT_FOUND",
    404
  );
}

/**
 * Odpowiedź dla błędu "brak autoryzacji"
 */
export function unauthorizedResponse(message = "Brak autoryzacji"): NextResponse {
  return errorResponse(message, "UNAUTHORIZED", 401);
}

/**
 * Odpowiedź dla błędu "brak uprawnień"
 */
export function forbiddenResponse(message = "Brak uprawnień"): NextResponse {
  return errorResponse(message, "FORBIDDEN", 403);
}

/**
 * Odpowiedź dla błędu serwera
 */
export function internalErrorResponse(message = "Wystąpił błąd serwera"): NextResponse {
  return errorResponse(message, "INTERNAL_ERROR", 500);
}

