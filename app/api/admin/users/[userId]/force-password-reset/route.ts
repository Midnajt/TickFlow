import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { UserAdminService } from "@/app/lib/services/users/user-admin.service";

/**
 * POST /api/admin/users/:userId/force-password-reset
 * Wymusza reset hasła dla użytkownika
 */
export const POST = withRole(
  ["ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ userId: string }> };
      const { userId } = await params;

      await UserAdminService.forcePasswordReset(userId, user.id);

      return successResponse(
        { message: "Wymuszono reset hasła dla użytkownika" },
        200
      );
    } catch (error) {
      console.error("[Force Password Reset] Error:", error);

      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "NOT_FOUND", 404);
        }

        if (error.message.startsWith("DATABASE_ERROR")) {
          return errorResponse(
            "Błąd wymuszenia resetu hasła",
            "DATABASE_ERROR",
            500
          );
        }
      }

      return errorResponse(
        "Błąd wymuszenia resetu hasła",
        "INTERNAL_ERROR",
        500
      );
    }
  }
);
