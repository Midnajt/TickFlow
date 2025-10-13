import { NextRequest } from "next/server";
import { TicketService } from "@/app/lib/services/tickets";
import { withAuth } from "@/app/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/app/lib/utils/api-response";
import {
  createTicketSchema,
  getTicketsQuerySchema,
} from "@/app/lib/validators/tickets";
import { ZodError } from "zod";
import type { CreateTicketCommand, GetTicketsParams } from "@/src/types";

/**
 * GET /api/tickets
 * Pobiera listę ticketów z filtrowaniem i paginacją
 * USER: widzi tylko swoje tickety
 * AGENT: widzi tickety z przypisanych kategorii
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Parsowanie query params
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const assignedToMeParam = searchParams.get("assignedToMe") || "false";
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "20";
    const sortByParam = searchParams.get("sortBy") || "created_at";
    const sortOrderParam = searchParams.get("sortOrder") || "desc";

    // Walidacja query params
    const validatedParams = getTicketsQuerySchema.parse({
      status: statusParam ?? undefined,
      assignedToMe: assignedToMeParam,
      page: pageParam,
      limit: limitParam,
      sortBy: sortByParam,
      sortOrder: sortOrderParam,
    });

    // Przygotowanie parametrów zapytania
    const params: GetTicketsParams = {
      status: validatedParams.status,
      assignedToMe: validatedParams.assignedToMe,
      page: validatedParams.page,
      limit: validatedParams.limit,
      sortBy: validatedParams.sortBy,
      sortOrder: validatedParams.sortOrder,
    };

    // Pobranie ticketów
    const result = await TicketService.getTickets(user.id, user.role, params);

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

/**
 * POST /api/tickets
 * Tworzy nowy ticket
 * Wymaga autentykacji (USER lub AGENT)
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Parsowanie body
    const body = await request.json();

    // Walidacja body
    const validatedData = createTicketSchema.parse(body);

    // Utworzenie ticketu
    const command: CreateTicketCommand = {
      title: validatedData.title,
      description: validatedData.description,
      subcategoryId: validatedData.subcategoryId,
    };

    const ticket = await TicketService.createTicket(user.id, user.role, command);

    return successResponse(ticket, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    if (error instanceof Error) {
      if (error.message.startsWith("VALIDATION_ERROR")) {
        const message = error.message.split(":")[1] || "Błąd walidacji";
        return errorResponse(message, "VALIDATION_ERROR", 400);
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

