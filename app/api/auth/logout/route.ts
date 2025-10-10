import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/app/lib/services/auth";

/**
 * POST /api/auth/logout
 * Endpoint do wylogowania użytkownika
 */
export async function POST(request: NextRequest) {
  try {
    // Wywołanie serwisu wylogowania
    const logoutResponse = await AuthService.logout();

    // Utworzenie odpowiedzi i usunięcie ciasteczka
    const response = NextResponse.json(logoutResponse, { status: 200 });

    // Usunięcie auth-token cookie
    response.cookies.set({
      name: "auth-token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Natychmiastowe wygaśnięcie
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Wystąpił błąd podczas wylogowania",
      },
      { status: 500 }
    );
  }
}

