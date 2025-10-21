import { NextRequest } from "next/server";
import { TicketService } from "@/app/lib/services/tickets";
import { withRole } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from "@/app/lib/utils/api-response";

/**
 * POST /api/tickets/:ticketId/restore
 * Przywraca zamknięty ticket (CLOSED → OPEN)
 */
export const POST = withRole(
  ["USER", "AGENT", "ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ ticketId: string }> };
      const { ticketId } = await params;

      const result = await TicketService.restoreTicket(user.id, ticketId, user.role);

      return successResponse(result, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          return notFoundResponse("Ticket");
        }
        if (error.message.startsWith("AUTHORIZATION_ERROR")) {
          const message = error.message.split(":")[1] || "Brak uprawnień";
          return forbiddenResponse(message);
        }
        if (error.message.startsWith("VALIDATION_ERROR")) {
          const message = error.message.split(":")[1] || "Błąd walidacji";
          return errorResponse(message, "VALIDATION_ERROR", 400);
        }
      }
      return errorResponse("Wystąpił nieoczekiwany błąd", "INTERNAL_ERROR", 500);
    }
  }
);

