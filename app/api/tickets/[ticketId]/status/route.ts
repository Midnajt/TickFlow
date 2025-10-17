import { NextRequest } from "next/server";
import { TicketService } from "@/app/lib/services/tickets";
import { withRole } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  validationErrorResponse,
} from "@/app/lib/utils/api-response";
import { updateTicketStatusSchema } from "@/app/lib/validators/tickets";
import { ZodError } from "zod";
import type { TicketStatus } from "@/src/types";

/**
 * PATCH /api/tickets/:ticketId/status
 * Aktualizuje status ticketu
 * Wymaga roli AGENT lub ADMIN
 */
export const PATCH = withRole(
  ["AGENT", "ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ ticketId: string }> };
      const { ticketId } = await params;

      // Parsowanie body
      const body = await request.json();

      // Walidacja body
      const validatedData = updateTicketStatusSchema.parse(body);

      // Aktualizacja statusu
      const result = await TicketService.updateTicketStatus(
        user.id,
        ticketId,
        validatedData.status as TicketStatus
      );

      return successResponse(result, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

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

