import { NextRequest } from "next/server";
import { CategoryService } from "@/app/lib/services/categories";
import { withAuth } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/app/lib/utils/api-response";
import { getCategoriesQuerySchema } from "@/app/lib/validators/categories";
import { ZodError } from "zod";

/**
 * GET /api/categories
 * Pobiera wszystkie kategorie z opcjonalnymi podkategoriami
 * Wymaga autentykacji (USER lub AGENT)
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Parsowanie query params
    const searchParams = request.nextUrl.searchParams;
    const includeSubcategoriesParam = searchParams.get("includeSubcategories") || "true";

    // Walidacja query params
    const validatedParams = getCategoriesQuerySchema.parse({
      includeSubcategories: includeSubcategoriesParam,
    });

    // Pobranie kategorii
    const result = await CategoryService.getCategories(
      validatedParams.includeSubcategories
    );

    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    if (error instanceof Error) {
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
});

