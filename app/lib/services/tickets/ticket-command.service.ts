import { TicketRepository } from "./ticket.repository";
import { TicketQueryService } from "./ticket-query.service";
import { TicketMapper } from "./ticket-mapper";
import { CategoryService } from "@/app/lib/services/categories";
import { AgentCategoryService } from "@/app/lib/services/agent-categories";
import type {
  CreateTicketCommand,
  TicketDTO,
  TicketAssignmentDTO,
  TicketStatusUpdateDTO,
  TicketTransferDTO,
  TicketStatus,
  UserRole,
} from "@/src/types";

/**
 * Command Service - obsługuje operacje zapisu ticketów
 * Implementuje CQRS pattern (Command)
 */
export class TicketCommandService {
  private repository: TicketRepository;
  private queryService: TicketQueryService;

  constructor() {
    this.repository = new TicketRepository();
    this.queryService = new TicketQueryService();
  }

  /**
   * Tworzy nowy ticket
   */
  async createTicket(
    userId: string,
    userRole: UserRole,
    command: CreateTicketCommand
  ): Promise<TicketDTO> {
    // Sprawdzenie czy podkategoria istnieje
    const subcategoryExists = await CategoryService.subcategoryExists(
      command.subcategoryId
    );

    if (!subcategoryExists) {
      throw new Error("VALIDATION_ERROR:Podkategoria nie istnieje");
    }

    // Utworzenie ticketu
    const createdTicket = await this.repository.create({
      title: command.title,
      description: command.description,
      subcategoryId: command.subcategoryId,
      createdById: userId,
    });

    // Pobranie pełnych danych ticketu (z relacjami)
    return await this.queryService.getTicketById(
      userId,
      userRole,
      createdTicket.id
    );
  }

  /**
   * Przypisuje ticket do agenta
   */
  async assignTicket(
    agentId: string,
    ticketId: string,
    userRole: UserRole = "AGENT"
  ): Promise<TicketAssignmentDTO> {
    // Pobranie ticketu
    const ticket = await this.repository.findById(ticketId);

    // Sprawdzenie czy ticket jest już przypisany
    if (ticket.assigned_to_id) {
      throw new Error("VALIDATION_ERROR:Ticket jest już przypisany do innego agenta");
    }

    // Admin może przypisać każdy ticket
    if (userRole !== "ADMIN") {
      // Sprawdzenie czy agent ma dostęp do kategorii ticketu
      const hasAccess = await AgentCategoryService.hasAccessToTicket(
        agentId,
        ticket.subcategory_id
      );

      if (!hasAccess) {
        throw new Error(
          "AUTHORIZATION_ERROR:Nie masz uprawnień do kategorii tego ticketu"
        );
      }
    }

    // Przypisanie ticketu i zmiana statusu na IN_PROGRESS
    const updatedTicket = await this.repository.assignToAgent(ticketId, agentId);

    // Mapuj do DTO
    return TicketMapper.toTicketAssignmentDTO(updatedTicket);
  }

  /**
   * Aktualizuje status ticketu
   */
  async updateTicketStatus(
    agentId: string,
    ticketId: string,
    status: TicketStatus,
    userRole: UserRole = "AGENT"
  ): Promise<TicketStatusUpdateDTO> {
    // Pobranie ticketu
    const ticket = await this.repository.findById(ticketId);

    // Admin może zmienić status każdego ticketu
    if (userRole !== "ADMIN") {
      // Sprawdzenie czy agent ma dostęp do kategorii ticketu
      const hasAccess = await AgentCategoryService.hasAccessToTicket(
        agentId,
        ticket.subcategory_id
      );

      if (!hasAccess) {
        throw new Error(
          "AUTHORIZATION_ERROR:Nie masz uprawnień do kategorii tego ticketu"
        );
      }

      // Sprawdzenie czy ticket jest przypisany do tego agenta (tylko jeśli już jest przypisany)
      if (ticket.assigned_to_id && ticket.assigned_to_id !== agentId) {
        throw new Error("AUTHORIZATION_ERROR:Ten ticket jest przypisany do innego agenta");
      }
    }

    // Aktualizacja statusu
    const updatedTicket = await this.repository.updateStatus(ticketId, status);

    // Mapuj do DTO
    return TicketMapper.toTicketStatusUpdateDTO(updatedTicket);
  }

  /**
   * Przywraca zamknięty ticket (zmienia status z CLOSED na OPEN)
   */
  async restoreTicket(
    userId: string,
    ticketId: string,
    userRole: UserRole
  ): Promise<TicketStatusUpdateDTO> {
    // Pobranie ticketu
    const ticket = await this.repository.findById(ticketId);

    // Walidacja: tylko CLOSED może być przywrócony
    if (ticket.status !== "CLOSED") {
      throw new Error("VALIDATION_ERROR:Tylko zamknięte zgłoszenia można przywrócić");
    }

    // Sprawdzenie uprawnień
    if (userRole === "USER") {
      // USER może przywrócić tylko swoje zgłoszenia
      if (ticket.created_by_id !== userId) {
        throw new Error("AUTHORIZATION_ERROR:Możesz przywrócić tylko swoje zgłoszenia");
      }
    } else if (userRole === "AGENT") {
      // AGENT może przywrócić zgłoszenia ze swoich kategorii LUB przypisane do siebie
      const isAssignedToAgent = ticket.assigned_to_id === userId;
      const hasAccess = await AgentCategoryService.hasAccessToTicket(
        userId,
        ticket.subcategory_id
      );
      
      if (!isAssignedToAgent && !hasAccess) {
        throw new Error("AUTHORIZATION_ERROR:Nie masz uprawnień do tego zgłoszenia");
      }
    }
    // ADMIN może przywrócić każdy ticket (brak dodatkowej walidacji)

    // Przywrócenie ticketu
    const updatedTicket = await this.repository.restoreTicket(ticketId);
    
    // Mapuj do DTO
    return TicketMapper.toTicketStatusUpdateDTO(updatedTicket);
  }

  /**
   * Przekazuje ticket do innego agenta
   */
  async transferTicket(
    currentUserId: string,
    ticketId: string,
    targetAgentId: string,
    userRole: UserRole
  ): Promise<TicketTransferDTO> {
    // Pobranie ticketu
    const ticket = await this.repository.findById(ticketId);

    // Walidacja: ticket musi być przypisany
    if (!ticket.assigned_to_id) {
      throw new Error("VALIDATION_ERROR:Można przekazać tylko przypisane zgłoszenia");
    }

    // Sprawdzenie uprawnień
    if (userRole === "AGENT") {
      // AGENT może przekazać tylko tickety przypisane do siebie
      if (ticket.assigned_to_id !== currentUserId) {
        throw new Error("AUTHORIZATION_ERROR:Możesz przekazać tylko swoje zgłoszenia");
      }
    }
    // ADMIN może przekazać każdy przypisany ticket

    // Sprawdzenie czy docelowy użytkownik istnieje i jest agentem/adminem
    const { data: targetUser, error: userError } = await this.repository
      .getClient()
      .from("users")
      .select("id, role")
      .eq("id", targetAgentId)
      .single();

    if (userError || !targetUser) {
      throw new Error("VALIDATION_ERROR:Docelowy użytkownik nie istnieje");
    }

    if (targetUser.role !== "AGENT" && targetUser.role !== "ADMIN") {
      throw new Error("VALIDATION_ERROR:Można przekazać tylko agentowi lub administratorowi");
    }

    // Przekazanie ticketu
    const updatedTicket = await this.repository.transferTicket(ticketId, targetAgentId);
    
    // Mapuj do DTO
    return TicketMapper.toTicketAssignmentDTO(updatedTicket);
  }
}

