import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/app/lib/validators/auth";
import { AuthService } from "@/app/lib/services/auth";
import { checkRateLimit, addRateLimitHeaders } from "@/app/lib/middleware/rate-limiter";
import type { LoginCommand } from "@/src/types";

/**
 * POST /api/auth/login
 * Endpoint do logowania użytkownika
 */
export async function POST(request: NextRequest) {
  try {
    // Sprawdzenie rate limit
    const rateLimitResponse = checkRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parsowanie body żądania
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    // Walidacja danych wejściowych za pomocą Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Nieprawidłowe dane wejściowe",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const command: LoginCommand = validationResult.data;

    // Wywołanie serwisu logowania
    const loginResponse = await AuthService.login(command);

    // Utworzenie odpowiedzi z ciasteczkiem JWT
    const response = NextResponse.json(loginResponse, { status: 200 });

    // Ustawienie HttpOnly cookie z tokenem JWT
    response.cookies.set({
      name: "auth-token",
      value: loginResponse.session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Allow cookie in test environment
      maxAge: 60 * 60 * 24 * 7, // 7 dni w sekundach
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined, // Explicit domain for tests
    });

    // Dodanie nagłówków rate limit
    addRateLimitHeaders(response, request);

    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error) {
      // Obsługa błędów uwierzytelniania
      if (error.message.startsWith("AUTHENTICATION_ERROR")) {
        const message = error.message.split(":")[1] || "Nieprawidłowe dane uwierzytelniające";
        return NextResponse.json(
          {
            error: "AUTHENTICATION_ERROR",
            message,
          },
          { status: 401 }
        );
      }
    }

    // Ogólny błąd serwera
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Wystąpił błąd podczas logowania",
      },
      { status: 500 }
    );
  }
}

