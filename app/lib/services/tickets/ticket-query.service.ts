import { TicketRepository } from "./ticket.repository";
import { TicketQueryBuilder } from "./ticket-query-builder";
import { TicketMapper } from "./ticket-mapper";
import type {
  TicketDTO,
  TicketsListDTO,
  GetTicketsParams,
  UserRole,
} from "@/src/types";

/**
 * Query Service - obsługuje operacje odczytu ticketów
 * Implementuje CQRS pattern (Query)
 */
export class TicketQueryService {
  private repository: TicketRepository;

  constructor() {
    this.repository = new TicketRepository();
  }

  /**
   * Pobiera listę ticketów z filtrowaniem i paginacją
   */
  async getTickets(
    userId: string,
    userRole: UserRole,
    params: GetTicketsParams
  ): Promise<TicketsListDTO> {
    const {
      status,
      assignedToMe,
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
    } = params;

    // Użyj Query Builder do zbudowania zapytania
    const builder = new TicketQueryBuilder(this.repository.getClient());

    // Włącz count dla paginacji
    builder.withCount();

    // Filtruj po użytkowniku/roli
    await builder.forUser(userId, userRole);

    // Opcjonalne filtry
    if (status) {
      builder.withStatus(status);
    }

    if (assignedToMe && userRole === "AGENT") {
      builder.assignedTo(userId);
    }

    // Sortowanie i paginacja
    const ascending = sortOrder === "asc";
    builder.orderBy(sortBy, ascending);
    builder.paginate(page, limit);

    // Wykonaj zapytanie
    const { data, count } = await builder.execute();

    // Mapuj do DTO
    const tickets = TicketMapper.toTicketListDTO(data);

    // Metadane paginacji
    const total = count;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };
  }

  /**
   * Pobiera pojedynczy ticket po ID
   */
  async getTicketById(
    userId: string,
    userRole: UserRole,
    ticketId: string
  ): Promise<TicketDTO> {
    // Pobierz ticket z relacjami
    const ticket = await this.repository.findByIdWithRelations(ticketId);

    // Weryfikacja uprawnień
    await this.verifyUserAccess(userId, userRole, ticket);

    // Mapuj do DTO
    return TicketMapper.toTicketDTO(ticket);
  }

  /**
   * Weryfikuje czy użytkownik ma dostęp do ticketu
   */
  private async verifyUserAccess(
    userId: string,
    userRole: UserRole,
    ticket: any
  ): Promise<void> {
    if (userRole === "USER") {
      // USER może zobaczyć tylko swoje tickety
      if (ticket.created_by_id !== userId) {
        throw new Error("AUTHORIZATION_ERROR:Brak uprawnień do tego ticketu");
      }
    } else if (userRole === "ADMIN") {
      // ADMIN ma dostęp do wszystkich ticketów
      // Brak sprawdzenia uprawnień
    } else if (userRole === "AGENT") {
      // AGENT może zobaczyć tylko tickety z jego kategorii
      const { AgentCategoryService } = await import("@/app/lib/services/agent-categories");
      const hasAccess = await AgentCategoryService.hasAccessToCategory(
        userId,
        ticket.subcategories.category_id
      );

      if (!hasAccess) {
        throw new Error("AUTHORIZATION_ERROR:Brak uprawnień do tego ticketu");
      }
    }
  }
}

