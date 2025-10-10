import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/app/lib/validators/auth";
import { AuthService } from "@/app/lib/services/auth";
import { requireAuth } from "@/app/lib/utils/auth";
import type { ChangePasswordCommand } from "@/src/types";

/**
 * POST /api/auth/change-password
 * Endpoint do zmiany hasła użytkownika
 */
export async function POST(request: NextRequest) {
  try {
    // Weryfikacja autentykacji i pobranie danych użytkownika
    const user = await requireAuth(request);
    const userId = user.id;

    // Parsowanie body żądania
    const body = await request.json();

    // Walidacja danych wejściowych za pomocą Zod
    const validationResult = changePasswordSchema.safeParse(body);
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

    const command: ChangePasswordCommand = validationResult.data;

    // Wywołanie serwisu zmiany hasła
    const changePasswordResponse = await AuthService.changePassword(
      userId,
      command
    );

    return NextResponse.json(changePasswordResponse, { status: 200 });
  } catch (error) {
    console.error("Change password error:", error);

    if (error instanceof Error) {
      // Obsługa błędów uwierzytelniania
      if (error.message.startsWith("AUTHENTICATION_ERROR")) {
        const message = error.message.split(":")[1] || "Błąd uwierzytelniania";
        return NextResponse.json(
          {
            error: "AUTHENTICATION_ERROR",
            message,
          },
          { status: 401 }
        );
      }

      // Obsługa błędów wewnętrznych
      if (error.message.startsWith("INTERNAL_ERROR")) {
        const message = error.message.split(":")[1] || "Błąd serwera";
        return NextResponse.json(
          {
            error: "INTERNAL_ERROR",
            message,
          },
          { status: 500 }
        );
      }
    }

    // Ogólny błąd serwera
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Wystąpił błąd podczas zmiany hasła",
      },
      { status: 500 }
    );
  }
}

