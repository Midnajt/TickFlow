import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse, validationErrorResponse } from "@/app/lib/utils/api-response";
import { CategoryAdminService } from "@/app/lib/services/categories/category-admin.service";
import { updateSubcategorySchema } from "@/app/lib/validators/categories";
import { ZodError } from "zod";

export const PATCH = withRole(
  ["ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ subcategoryId: string }> };
      const { subcategoryId } = await params;

      const body = await request.json();
      
      // Sprawdź, czy są jakieś dane
      if (!body || Object.keys(body).length === 0) {
        return errorResponse(
          "Brak danych do aktualizacji",
          "VALIDATION_ERROR",
          400
        );
      }
      
      const validatedData = updateSubcategorySchema.parse(body);
      
      // Sprawdź ponownie po walidacji (opcjonalne pola mogą być undefined)
      if (!validatedData.name && !validatedData.description) {
        return errorResponse(
          "Musisz podać przynajmniej jedno pole do aktualizacji",
          "VALIDATION_ERROR",
          400
        );
      }

      await CategoryAdminService.updateSubcategory(
        subcategoryId,
        validatedData,
        user.id
      );

      return successResponse({ message: "Podkategoria zaktualizowana" }, 200);
    } catch (error) {
      console.error("[Update Subcategory] Error:", error);

      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "NOT_FOUND", 404);
        }

        if (error.message.startsWith("DATABASE_ERROR")) {
          return errorResponse(
            "Błąd aktualizacji podkategorii",
            "DATABASE_ERROR",
            500
          );
        }
      }

      return errorResponse(
        "Błąd aktualizacji podkategorii",
        "INTERNAL_ERROR",
        500
      );
    }
  }
);
