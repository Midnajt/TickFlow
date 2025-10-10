import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/utils/auth";

/**
 * GET /api/auth/session
 * Endpoint do pobrania aktualnej sesji użytkownika
 */
export async function GET(request: NextRequest) {
  try {
    // Weryfikacja autentykacji i pobranie danych użytkownika
    const user = await requireAuth(request);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get session error:", error);

    if (error instanceof Error) {
      // Obsługa błędów uwierzytelniania
      if (error.message.startsWith("AUTHENTICATION_ERROR")) {
        const message = error.message.split(":")[1] || "Sesja jest nieprawidłowa lub wygasła";
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
        message: "Wystąpił błąd podczas pobierania sesji",
      },
      { status: 500 }
    );
  }
}

