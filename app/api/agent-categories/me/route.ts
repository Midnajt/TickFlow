import { NextRequest } from "next/server";
import { AgentCategoryService } from "@/app/lib/services/agent-categories";
import { withRole } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from "@/app/lib/utils/api-response";

/**
 * GET /api/agent-categories/me
 * Pobiera kategorie przypisane do zalogowanego agenta
 * Wymaga roli AGENT
 */
export const GET = withRole(["AGENT"], async (request: NextRequest, user) => {
  try {
    const result = await AgentCategoryService.getAgentCategories(user.id);

    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("NOT_FOUND")) {
        return notFoundResponse("Agent");
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
});

