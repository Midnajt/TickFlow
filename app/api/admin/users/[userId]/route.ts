import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse, validationErrorResponse } from "@/app/lib/utils/api-response";
import { UserAdminService } from "@/app/lib/services/users/user-admin.service";
import { updateUserSchema } from "@/app/lib/validators/users";
import { ZodError } from "zod";

/**
 * PATCH /api/admin/users/:userId
 * Aktualizuje użytkownika
 */
export const PATCH = withRole(
  ["ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ userId: string }> };
      const { userId } = await params;

      const body = await request.json();
      const validatedData = updateUserSchema.parse(body);

      await UserAdminService.updateUser(userId, validatedData, user.id);

      return successResponse({ message: "Użytkownik zaktualizowany" }, 200);
    } catch (error) {
      console.error("[Update User] Error:", error);

      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "NOT_FOUND", 404);
        }

        if (error.message.startsWith("FORBIDDEN")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "FORBIDDEN", 403);
        }

        if (error.message.startsWith("VALIDATION_ERROR")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "VALIDATION_ERROR", 400);
        }

        if (error.message.startsWith("DATABASE_ERROR")) {
          return errorResponse(
            "Błąd aktualizacji użytkownika",
            "DATABASE_ERROR",
            500
          );
        }
      }

      return errorResponse(
        "Błąd aktualizacji użytkownika",
        "INTERNAL_ERROR",
        500
      );
    }
  }
);
