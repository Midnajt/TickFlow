import { TicketQueryService } from "./ticket-query.service";
import type { UserRole } from "@/src/types";

/**
 * Stats Service - obsługuje statystyki ticketów
 * Wydzielony do osobnego serwisu dla przejrzystości
 */
export class TicketStatsService {
  private queryService: TicketQueryService;

  constructor() {
    this.queryService = new TicketQueryService();
  }

  /**
   * Zwraca statystyki ticketów dla dashboardu
   * - openCount: liczba ticketów w statusie OPEN
   * - resolvedCount: liczba ticketów w statusach RESOLVED + CLOSED
   */
  async getTicketStats(
    userId: string,
    userRole: UserRole
  ): Promise<{ openCount: number; resolvedCount: number }> {
    const [open, resolved, closed] = await Promise.all([
      this.queryService.getTickets(userId, userRole, {
        status: "OPEN",
        page: 1,
        limit: 1,
      }),
      this.queryService.getTickets(userId, userRole, {
        status: "RESOLVED",
        page: 1,
        limit: 1,
      }),
      this.queryService.getTickets(userId, userRole, {
        status: "CLOSED",
        page: 1,
        limit: 1,
      }),
    ]);

    const openCount = open.pagination?.total || 0;
    const resolvedCount =
      (resolved.pagination?.total || 0) + (closed.pagination?.total || 0);

    return { openCount, resolvedCount };
  }
}

