import { TicketQueryService } from "./ticket-query.service";
import { TicketCommandService } from "./ticket-command.service";
import { TicketStatsService } from "./ticket-stats.service";
import type {
  CreateTicketCommand,
  TicketDTO,
  GetTicketsParams,
  TicketsListDTO,
  UserRole,
  TicketAssignmentDTO,
  TicketStatusUpdateDTO,
  TicketStatus,
} from "@/src/types";

/**
 * Facade Pattern - główny serwis ticketów
 * Zachowuje kompatybilność z poprzednim API, ale wewnętrznie używa CQRS
 */
export class TicketService {
  private static queryService = new TicketQueryService();
  private static commandService = new TicketCommandService();
  private static statsService = new TicketStatsService();

  /**
   * Tworzy nowy ticket
   */
  static async createTicket(
    userId: string,
    userRole: UserRole,
    command: CreateTicketCommand
  ): Promise<TicketDTO> {
    return this.commandService.createTicket(userId, userRole, command);
  }

  /**
   * Pobiera listę ticketów z filtrowaniem i paginacją
   */
  static async getTickets(
    userId: string,
    userRole: UserRole,
    params: GetTicketsParams
  ): Promise<TicketsListDTO> {
    return this.queryService.getTickets(userId, userRole, params);
  }

  /**
   * Pobiera pojedynczy ticket po ID
   */
  static async getTicketById(
    userId: string,
    userRole: UserRole,
    ticketId: string
  ): Promise<TicketDTO> {
    return this.queryService.getTicketById(userId, userRole, ticketId);
  }

  /**
   * Przypisuje ticket do agenta
   */
  static async assignTicket(
    agentId: string,
    ticketId: string
  ): Promise<TicketAssignmentDTO> {
    return this.commandService.assignTicket(agentId, ticketId);
  }

  /**
   * Aktualizuje status ticketu
   */
  static async updateTicketStatus(
    agentId: string,
    ticketId: string,
    status: TicketStatus
  ): Promise<TicketStatusUpdateDTO> {
    return this.commandService.updateTicketStatus(agentId, ticketId, status);
  }

  /**
   * Zwraca statystyki ticketów dla dashboardu
   */
  static async getTicketStats(
    userId: string,
    userRole: UserRole
  ): Promise<{ openCount: number; resolvedCount: number }> {
    return this.statsService.getTicketStats(userId, userRole);
  }
}

// Export dla backward compatibility
export { TicketQueryService, TicketCommandService, TicketStatsService };

