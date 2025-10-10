import { NextRequest } from "next/server";
import { CategoryService } from "@/app/lib/services/categories";
import { withAuth } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/app/lib/utils/api-response";
import { getCategoriesQuerySchema } from "@/app/lib/validators/categories";
import { ZodError } from "zod";

/**
 * GET /api/categories/:categoryId
 * Pobiera pojedynczą kategorię po ID
 * Wymaga autentykacji (USER lub AGENT)
 */
export const GET = withAuth(
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ categoryId: string }> };
      const { categoryId } = await params;

      // Parsowanie query params
      const searchParams = request.nextUrl.searchParams;
      const includeSubcategoriesParam = searchParams.get("includeSubcategories") || "true";

      // Walidacja query params
      const validatedParams = getCategoriesQuerySchema.parse({
        includeSubcategories: includeSubcategoriesParam,
      });

      // Pobranie kategorii
      const category = await CategoryService.getCategoryById(
        categoryId,
        validatedParams.includeSubcategories
      );

      return successResponse(category, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          return notFoundResponse("Kategoria");
        }

        if (error.message.startsWith("DATABASE_ERROR")) {
          const message = error.message.split(":")[1] || "Błąd bazy danych";
          return errorResponse(message, "DATABASE_ERROR", 500);
        }
      }

      return errorResponse(
        "Wystąpił nieoczekiwany błąd",
        "INTERNAL_ERROR",
        500
      );
    }
  }
);

