import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/app/lib/services/auth";
import { AuditLogService } from "@/app/lib/services/audit-log/audit-log.service";
import { internalErrorResponse } from "@/app/lib/utils/api-response";

/**
 * POST /api/auth/logout
 * Endpoint do wylogowania użytkownika
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session before logging out to log the action
    let userId: string | null = null;
    try {
      const token = request.cookies.get("auth-token")?.value;
      if (token) {
        const session = await AuthService.getSession(token);
        userId = session.user.id;
      }
    } catch (error) {
      // If session is invalid, we still continue with logout
      console.log("Could not get session for audit log:", error);
    }

    // Log logout BEFORE destroying session
    if (userId) {
      await AuditLogService.createLog({
        userId,
        action: "USER_LOGOUT",
        ipAddress: AuditLogService.getClientIp(request),
        userAgent: AuditLogService.getUserAgent(request),
      });
    }

    // Wywołanie serwisu wylogowania
    const logoutResponse = await AuthService.logout();

    // Utworzenie odpowiedzi z nowym standardem { success: true, data: {...} }
    const response = NextResponse.json(
      { success: true, data: logoutResponse },
      { status: 200 }
    );

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

    return internalErrorResponse("Wystąpił błąd podczas wylogowania");
  }
}

