import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { UserAdminService } from "@/app/lib/services/users/user-admin.service";
import { createUserSchema } from "@/app/lib/validators/users";
import { ZodError } from "zod";

/**
 * GET /api/admin/users
 * Pobiera listę wszystkich użytkowników ze statystykami
 */
export const GET = withRole(["ADMIN"], async (request: NextRequest, user) => {
  try {
    const users = await UserAdminService.getAllUsers();

    return successResponse({ users }, 200);
  } catch (error) {
    console.error("[Admin Users] Error:", error);

    if (error instanceof Error && error.message.startsWith("DATABASE_ERROR")) {
      return errorResponse(
        "Błąd pobierania użytkowników",
        "DATABASE_ERROR",
        500
      );
    }

    return errorResponse(
      "Błąd pobierania użytkowników",
      "INTERNAL_ERROR",
      500
    );
  }
});

/**
 * POST /api/admin/users
 * Tworzy nowego użytkownika
 */
export const POST = withRole(["ADMIN"], async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const newUser = await UserAdminService.createUser(validatedData, user.id);

    return successResponse({ user: newUser }, 201);
  } catch (error) {
    console.error("[Create User] Error:", error);

    if (error instanceof ZodError) {
      return errorResponse(
        error.errors[0].message,
        "VALIDATION_ERROR",
        400
      );
    }

    if (error instanceof Error) {
      if (error.message.startsWith("VALIDATION_ERROR")) {
        const message = error.message.split(":")[1];
        return errorResponse(message, "VALIDATION_ERROR", 400);
      }

      if (error.message.startsWith("DATABASE_ERROR")) {
        return errorResponse(
          "Błąd tworzenia użytkownika",
          "DATABASE_ERROR",
          500
        );
      }
    }

    return errorResponse(
      "Błąd tworzenia użytkownika",
      "INTERNAL_ERROR",
      500
    );
  }
});
