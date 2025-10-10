import { NextRequest } from "next/server";
import { TicketService } from "@/app/lib/services/tickets";
import { withAuth } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from "@/app/lib/utils/api-response";

/**
 * GET /api/tickets/:ticketId
 * Pobiera szczegóły pojedynczego ticketu
 * USER: może zobaczyć tylko swoje tickety
 * AGENT: może zobaczyć tickety z przypisanych kategorii
 */
export const GET = withAuth(
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ ticketId: string }> };
      const { ticketId } = await params;

      const ticket = await TicketService.getTicketById(
        user.id,
        user.role,
        ticketId
      );

      return successResponse(ticket, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          return notFoundResponse("Ticket");
        }

        if (error.message.startsWith("AUTHORIZATION_ERROR")) {
          const message = error.message.split(":")[1] || "Brak uprawnień";
          return forbiddenResponse(message);
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

