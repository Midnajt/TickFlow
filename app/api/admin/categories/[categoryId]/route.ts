import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { CategoryAdminService } from "@/app/lib/services/categories/category-admin.service";
import { updateCategorySchema } from "@/app/lib/validators/categories";
import { ZodError } from "zod";

export const PATCH = withRole(
  ["ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ categoryId: string }> };
      const { categoryId } = await params;

      const body = await request.json();
      const validatedData = updateCategorySchema.parse(body);

      await CategoryAdminService.updateCategoryDescription(
        categoryId,
        validatedData,
        user.id
      );

      return successResponse({ message: "Kategoria zaktualizowana" }, 200);
    } catch (error) {
      console.error("[Update Category] Error:", error);

      if (error instanceof ZodError) {
        return errorResponse(
          error.errors[0].message,
          "VALIDATION_ERROR",
          400
        );
      }

      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "NOT_FOUND", 404);
        }

        if (error.message.startsWith("DATABASE_ERROR")) {
          return errorResponse(
            "Błąd aktualizacji kategorii",
            "DATABASE_ERROR",
            500
          );
        }
      }

      return errorResponse(
        "Błąd aktualizacji kategorii",
        "INTERNAL_ERROR",
        500
      );
    }
  }
);
