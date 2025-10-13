import { createSupabaseAdmin } from "@/app/lib/utils/supabase-auth";
import { CategoryService } from "./categories";
import { AgentCategoryService } from "./agent-categories";
import type {
  CreateTicketCommand,
  TicketDTO,
  GetTicketsParams,
  TicketsListDTO,
  TicketListItemDTO,
  UserRole,
  TicketAssignmentDTO,
  UpdateTicketStatusCommand,
  TicketStatusUpdateDTO,
  TicketStatus,
  UserBaseDTO,
  SubcategoryDTO,
  CategoryBaseDTO,
  PaginationDTO,
} from "@/src/types";

/**
 * Serwis odpowiedzialny za zarządzanie ticketami
 */
export class TicketService {
  /**
   * Tworzy nowy ticket
   * @param userId - ID użytkownika tworzącego ticket
   * @param userRole - Rola użytkownika
   * @param command - Dane ticketu
   * @returns Utworzony ticket z pełnymi danymi
   * @throws Error jeśli podkategoria nie istnieje
   */
  static async createTicket(
    userId: string,
    userRole: UserRole,
    command: CreateTicketCommand
  ): Promise<TicketDTO> {
    const supabase = createSupabaseAdmin();

    // Sprawdzenie czy podkategoria istnieje
    const subcategoryExists = await CategoryService.subcategoryExists(
      command.subcategoryId
    );

    if (!subcategoryExists) {
      throw new Error("VALIDATION_ERROR:Podkategoria nie istnieje");
    }

    // Utworzenie ticketu
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        title: command.title,
        description: command.description,
        subcategory_id: command.subcategoryId,
        created_by_id: userId,
        status: "OPEN",
        assigned_to_id: null,
      })
      .select()
      .single();

    if (error || !ticket) {
      throw new Error(`DATABASE_ERROR:Błąd podczas tworzenia ticketu: ${error?.message}`);
    }

    // Pobranie pełnych danych ticketu (z relacjami)
    return await this.getTicketById(userId, userRole, ticket.id);
  }

  /**
   * Pobiera listę ticketów z filtrowaniem i paginacją
   * @param userId - ID użytkownika
   * @param userRole - Rola użytkownika (USER/AGENT)
   * @param params - Parametry zapytania (status, paginacja, sortowanie)
   * @returns Lista ticketów z metadanymi paginacji
   */
  static async getTickets(
    userId: string,
    userRole: UserRole,
    params: GetTicketsParams
  ): Promise<TicketsListDTO> {
    const supabase = createSupabaseAdmin();

    const {
      status,
      assignedToMe,
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
    } = params;

    // Budowanie zapytania z join'ami
    let query = supabase
      .from("tickets")
      .select(
        `
        id,
        title,
        status,
        created_at,
        updated_at,
        subcategory_id,
        created_by_id,
        assigned_to_id,
        subcategories!inner (
          id,
          name,
          category_id,
          categories!inner (
            id,
            name
          )
        ),
        createdBy:users!tickets_created_by_id_fkey (
          id,
          name,
          email
        ),
        assignedTo:users!tickets_assigned_to_id_fkey (
          id,
          name,
          email
        )
      `,
        { count: "exact" }
      );

    // Filtrowanie na podstawie roli użytkownika
    if (userRole === "USER") {
      // USER widzi tylko swoje tickety
      query = query.eq("created_by_id", userId);
    } else if (userRole === "AGENT") {
      // AGENT widzi tickety z kategorii do których ma dostęp
      const agentCategoryIds = await AgentCategoryService.getAgentCategoryIds(userId);

      if (agentCategoryIds.length === 0) {
        // Agent nie ma przypisanych kategorii - zwróć pustą listę
        return {
          tickets: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }

      // Filtruj po kategoriach agenta
      query = query.in("subcategories.category_id", agentCategoryIds);
    }

    // Opcjonalne filtrowanie po statusie
    if (status) {
      query = query.eq("status", status);
    }

    // Opcjonalne filtrowanie po przypisaniu do mnie
    if (assignedToMe && userRole === "AGENT") {
      query = query.eq("assigned_to_id", userId);
    }

    // Sortowanie
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // Paginacja
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Wykonanie zapytania
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`DATABASE_ERROR:Błąd podczas pobierania ticketów: ${error.message}`);
    }

    // Mapowanie do DTO
    const tickets: TicketListItemDTO[] = (data || []).map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status as TicketStatus,
      subcategory: {
        id: ticket.subcategories.id,
        name: ticket.subcategories.name,
        categoryId: ticket.subcategories.category_id,
        category: {
          id: ticket.subcategories.categories.id,
          name: ticket.subcategories.categories.name,
        },
      },
      createdBy: {
        id: ticket.createdBy!.id,
        name: ticket.createdBy!.name,
        email: ticket.createdBy!.email,
      },
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            name: ticket.assignedTo.name,
            email: ticket.assignedTo.email,
          }
        : null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    }));

    // Metadane paginacji
    const total = count || 0;
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
   * @param userId - ID użytkownika
   * @param userRole - Rola użytkownika
   * @param ticketId - ID ticketu
   * @returns Pełne dane ticketu
   * @throws Error jeśli ticket nie istnieje lub użytkownik nie ma uprawnień
   */
  static async getTicketById(
    userId: string,
    userRole: UserRole,
    ticketId: string
  ): Promise<TicketDTO> {
    const supabase = createSupabaseAdmin();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        subcategory_id,
        created_by_id,
        assigned_to_id,
        subcategories!inner (
          id,
          name,
          category_id,
          categories!inner (
            id,
            name
          )
        ),
        createdBy:users!tickets_created_by_id_fkey (
          id,
          name,
          email
        ),
        assignedTo:users!tickets_assigned_to_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("id", ticketId)
      .single();

    if (error || !ticket) {
      throw new Error("NOT_FOUND:Ticket nie został znaleziony");
    }

    // Weryfikacja uprawnień
    if (userRole === "USER") {
      // USER może zobaczyć tylko swoje tickety
      if (ticket.created_by_id !== userId) {
        throw new Error("AUTHORIZATION_ERROR:Brak uprawnień do tego ticketu");
      }
    } else if (userRole === "AGENT") {
      // AGENT może zobaczyć tylko tickety z jego kategorii
      const hasAccess = await AgentCategoryService.hasAccessToCategory(
        userId,
        ticket.subcategories.category_id
      );

      if (!hasAccess) {
        throw new Error("AUTHORIZATION_ERROR:Brak uprawnień do tego ticketu");
      }
    }

    // Mapowanie do DTO
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status as TicketStatus,
      subcategoryId: ticket.subcategory_id,
      subcategory: {
        id: ticket.subcategories.id,
        name: ticket.subcategories.name,
        categoryId: ticket.subcategories.category_id,
        category: {
          id: ticket.subcategories.categories.id,
          name: ticket.subcategories.categories.name,
        },
      },
      createdById: ticket.created_by_id,
      createdBy: {
        id: ticket.createdBy!.id,
        name: ticket.createdBy!.name,
        email: ticket.createdBy!.email,
      },
      assignedToId: ticket.assigned_to_id,
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            name: ticket.assignedTo.name,
            email: ticket.assignedTo.email,
          }
        : null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  }

  /**
   * Przypisuje ticket do agenta
   * @param agentId - ID agenta
   * @param ticketId - ID ticketu
   * @returns Zaktualizowany ticket
   * @throws Error jeśli ticket nie istnieje lub agent nie ma dostępu
   */
  static async assignTicket(
    agentId: string,
    ticketId: string
  ): Promise<TicketAssignmentDTO> {
    const supabase = createSupabaseAdmin();

    // Pobranie ticketu
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, status, subcategory_id, assigned_to_id")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error("NOT_FOUND:Ticket nie został znaleziony");
    }

    // Sprawdzenie czy ticket jest już przypisany
    if (ticket.assigned_to_id) {
      throw new Error("VALIDATION_ERROR:Ticket jest już przypisany do innego agenta");
    }

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

    // Przypisanie ticketu i zmiana statusu na IN_PROGRESS
    const { data: updatedTicket, error: updateError } = await supabase
      .from("tickets")
      .update({
        assigned_to_id: agentId,
        status: "IN_PROGRESS",
      })
      .eq("id", ticketId)
      .select(
        `
        id,
        title,
        status,
        updated_at,
        assigned_to_id,
        assignedTo:users!tickets_assigned_to_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .single();

    if (updateError || !updatedTicket) {
      throw new Error(`DATABASE_ERROR:Błąd podczas przypisywania ticketu: ${updateError?.message}`);
    }

    return {
      ticket: {
        id: updatedTicket.id,
        title: updatedTicket.title,
        status: updatedTicket.status as TicketStatus,
        assignedToId: updatedTicket.assigned_to_id!,
        assignedTo: {
          id: updatedTicket.assignedTo!.id,
          name: updatedTicket.assignedTo!.name,
          email: updatedTicket.assignedTo!.email,
        },
        updatedAt: updatedTicket.updated_at,
      },
    };
  }

  /**
   * Aktualizuje status ticketu
   * @param agentId - ID agenta
   * @param ticketId - ID ticketu
   * @param status - Nowy status
   * @returns Zaktualizowany ticket
   * @throws Error jeśli ticket nie istnieje lub agent nie ma uprawnień
   */
  static async updateTicketStatus(
    agentId: string,
    ticketId: string,
    status: TicketStatus
  ): Promise<TicketStatusUpdateDTO> {
    const supabase = createSupabaseAdmin();

    // Pobranie ticketu
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, status, subcategory_id, assigned_to_id")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error("NOT_FOUND:Ticket nie został znaleziony");
    }

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

    // Aktualizacja statusu
    const { data: updatedTicket, error: updateError } = await supabase
      .from("tickets")
      .update({
        status,
      })
      .eq("id", ticketId)
      .select("id, title, status, updated_at")
      .single();

    if (updateError || !updatedTicket) {
      throw new Error(`DATABASE_ERROR:Błąd podczas aktualizacji statusu: ${updateError?.message}`);
    }

    return {
      ticket: {
        id: updatedTicket.id,
        title: updatedTicket.title,
        status: updatedTicket.status as TicketStatus,
        updatedAt: updatedTicket.updated_at,
      },
    };
  }

  /**
   * Zwraca statystyki ticketów dla dashboardu
   * - openCount: liczba ticketów w statusie OPEN
   * - resolvedCount: liczba ticketów w statusach RESOLVED + CLOSED
   * Wykorzystuje istniejące reguły dostępu z getTickets.
   */
  static async getTicketStats(
    userId: string,
    userRole: UserRole
  ): Promise<{ openCount: number; resolvedCount: number }> {
    const [open, resolved, closed] = await Promise.all([
      this.getTickets(userId, userRole, { status: "OPEN", page: 1, limit: 1 }),
      this.getTickets(userId, userRole, { status: "RESOLVED", page: 1, limit: 1 }),
      this.getTickets(userId, userRole, { status: "CLOSED", page: 1, limit: 1 }),
    ]);

    const openCount = open.pagination?.total || 0;
    const resolvedCount = (resolved.pagination?.total || 0) + (closed.pagination?.total || 0);

    return { openCount, resolvedCount };
  }
}

