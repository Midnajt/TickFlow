import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole, TicketStatus } from "@/src/types";
import { AgentCategoryService } from "@/app/lib/services/agent-categories";

/**
 * Query Builder Pattern - buduje złożone zapytania do ticketów
 * Pozwala na łatwiejsze komponowanie filtrów i warunków
 */
export class TicketQueryBuilder {
  private query: any;
  private countEnabled = false;

  constructor(private supabase: SupabaseClient) {
    this.initializeQuery();
  }

  /**
   * Inicjalizuje podstawowe zapytanie z relacjami
   */
  private initializeQuery() {
    this.query = this.supabase.from("tickets").select(
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
    );
    return this;
  }

  /**
   * Włącza liczenie wyników (dla paginacji)
   */
  withCount() {
    this.countEnabled = true;
    // Restartuj query z count
    this.query = this.supabase.from("tickets").select(
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
      `,
      { count: "exact" }
    );
    return this;
  }

  /**
   * Filtruje tickety na podstawie roli użytkownika
   */
  async forUser(userId: string, userRole: UserRole) {
    if (userRole === "USER") {
      // USER widzi tylko swoje tickety
      this.query = this.query.eq("created_by_id", userId);
    } else if (userRole === "ADMIN") {
      // ADMIN widzi wszystkie tickety bez filtrów
      // Brak filtrowania - pozostaw query bez zmian
    } else if (userRole === "AGENT") {
      // AGENT widzi: (A) tickety przypisane do niego ORAZ (B) tickety nieprzypisane w jego kategoriach
      const agentCategoryIds = await AgentCategoryService.getAgentCategoryIds(userId);

      if (agentCategoryIds.length === 0) {
        // Brak przypisanych kategorii → pokaż tylko tickety przypisane do agenta
        this.query = this.query.eq("assigned_to_id", userId);
      } else {
        // Pobierz subcategory_id powiązane z kategoriami agenta (użyj kolumny na tabeli tickets: subcategory_id)
        const { data: subs, error: subsError } = await this.supabase
          .from("subcategories")
          .select("id")
          .in("category_id", agentCategoryIds);

        if (subsError) {
          // Jeśli nie udało się pobrać podkategorii, ogranicz do przypisanych do agenta
          this.query = this.query.eq("assigned_to_id", userId);
        } else {
          const subcategoryIds: string[] = (subs || []).map((s: any) => s.id);
          if (subcategoryIds.length === 0) {
            this.query = this.query.eq("assigned_to_id", userId);
          } else {
            // Warunek OR: assigned_to_id = userId OR (assigned_to_id IS NULL AND subcategory_id IN (...))
            this.query = this.query.or(
              `assigned_to_id.eq.${userId},and(assigned_to_id.is.null,subcategory_id.in.(${subcategoryIds.join(",")}))`
            );
          }
        }
      }
    }
    return this;
  }

  /**
   * Filtruje po statusie
   */
  withStatus(status: TicketStatus) {
    this.query = this.query.eq("status", status);
    return this;
  }

  /**
   * Filtruje tickety przypisane do użytkownika
   */
  assignedTo(userId: string) {
    this.query = this.query.eq("assigned_to_id", userId);
    return this;
  }

  /**
   * Sortuje wyniki
   */
  orderBy(field: string, ascending: boolean = false) {
    this.query = this.query.order(field, { ascending });
    return this;
  }

  /**
   * Paginacja
   */
  paginate(page: number, limit: number) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    this.query = this.query.range(from, to);
    return this;
  }

  /**
   * Wykonuje zapytanie i zwraca wyniki
   */
  async execute() {
    const { data, error, count } = await this.query;

    if (error) {
      throw new Error(`DATABASE_ERROR:Błąd podczas pobierania ticketów: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
    };
  }
}

