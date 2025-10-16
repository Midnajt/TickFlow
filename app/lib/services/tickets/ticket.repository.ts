import { createSupabaseAdmin } from "@/app/lib/utils/supabase-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Repository Pattern - warstwa dostępu do danych dla ticketów
 * Izoluje logikę biznesową od szczegółów implementacji bazy danych
 */
export class TicketRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Tworzy nowy ticket w bazie danych
   */
  async create(data: {
    title: string;
    description: string;
    subcategoryId: string;
    createdById: string;
  }) {
    const { data: ticket, error } = await this.supabase
      .from("tickets")
      .insert({
        title: data.title,
        description: data.description,
        subcategory_id: data.subcategoryId,
        created_by_id: data.createdById,
        status: "OPEN",
        assigned_to_id: null,
      })
      .select()
      .single();

    if (error || !ticket) {
      throw new Error(`DATABASE_ERROR:Błąd podczas tworzenia ticketu: ${error?.message}`);
    }

    return ticket;
  }

  /**
   * Pobiera ticket po ID z pełnymi relacjami
   */
  async findByIdWithRelations(ticketId: string) {
    const { data: ticket, error } = await this.supabase
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
          description,
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

    return ticket;
  }

  /**
   * Pobiera podstawowe dane ticketu (bez pełnych relacji)
   */
  async findById(ticketId: string) {
    const { data: ticket, error } = await this.supabase
      .from("tickets")
      .select("id, status, subcategory_id, assigned_to_id, created_by_id")
      .eq("id", ticketId)
      .single();

    if (error || !ticket) {
      throw new Error("NOT_FOUND:Ticket nie został znaleziony");
    }

    return ticket;
  }

  /**
   * Przypisuje ticket do agenta i zmienia status
   */
  async assignToAgent(ticketId: string, agentId: string) {
    const { data: updatedTicket, error } = await this.supabase
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

    if (error || !updatedTicket) {
      throw new Error(`DATABASE_ERROR:Błąd podczas przypisywania ticketu: ${error?.message}`);
    }

    return updatedTicket;
  }

  /**
   * Aktualizuje status ticketu
   */
  async updateStatus(ticketId: string, status: string) {
    const { data: updatedTicket, error } = await this.supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticketId)
      .select("id, title, status, updated_at")
      .single();

    if (error || !updatedTicket) {
      throw new Error(`DATABASE_ERROR:Błąd podczas aktualizacji statusu: ${error?.message}`);
    }

    return updatedTicket;
  }

  /**
   * Zwraca instancję Supabase do użycia w Query Builder
   */
  getClient() {
    return this.supabase;
  }
}

