import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { CategoryAdminService } from "@/app/lib/services/categories/category-admin.service";

export const GET = withRole(["ADMIN"], async (request: NextRequest, user) => {
  try {
    const categories = await CategoryAdminService.getCategoriesWithAgents();

    return successResponse({ categories }, 200);
  } catch (error) {
    console.error("[Admin Categories] Error:", error);

    if (error instanceof Error && error.message.startsWith("DATABASE_ERROR")) {
      return errorResponse(
        "Błąd pobierania kategorii",
        "DATABASE_ERROR",
        500
      );
    }

    return errorResponse(
      "Błąd pobierania kategorii",
      "INTERNAL_ERROR",
      500
    );
  }
});
