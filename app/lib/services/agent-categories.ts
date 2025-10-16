import { createSupabaseAdmin } from "@/app/lib/utils/supabase-auth";
import type {
  AgentCategoryDTO,
  GetAgentCategoriesResponseDTO,
  AgentDTO,
  GetAgentsByCategoryResponseDTO,
  CategoryBaseDTO,
} from "@/src/types";

/**
 * Serwis odpowiedzialny za zarządzanie przypisaniami agentów do kategorii
 */
export class AgentCategoryService {
  /**
   * Pobiera kategorie przypisane do agenta
   * @param agentId - ID agenta
   * @returns Lista kategorii przypisanych do agenta
   * @throws Error jeśli agent nie istnieje lub nie ma roli AGENT
   */
  static async getAgentCategories(
    agentId: string
  ): Promise<GetAgentCategoriesResponseDTO> {
    const supabase = createSupabaseAdmin();

    // Weryfikacja czy użytkownik jest agentem lub adminem
    const { data: agent, error: agentError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", agentId)
      .in("role", ["AGENT", "ADMIN"])
      .single();

    if (agentError || !agent) {
      throw new Error("NOT_FOUND:Agent nie został znaleziony lub nie ma roli AGENT/ADMIN");
    }

    // Admin ma dostęp do wszystkich kategorii
    if (agent.role === "ADMIN") {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(`DATABASE_ERROR:Błąd podczas pobierania kategorii: ${error.message}`);
      }

      // Mapowanie na ten sam format co agent categories
      const agentCategories: AgentCategoryDTO[] = (data || []).map((category: any) => ({
        id: `admin-${category.id}`,
        userId: agentId,
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
        },
        createdAt: new Date().toISOString(),
      }));

      return { agentCategories };
    }

    // Pobranie kategorii przypisanych do agenta (tylko dla AGENT roli)
    const { data, error } = await supabase
      .from("agent_categories")
      .select(
        `
        id,
        agent_id,
        category_id,
        created_at,
        categories!inner (
          id,
          name
        )
      `
      )
      .eq("agent_id", agentId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`DATABASE_ERROR:Błąd podczas pobierania kategorii agenta: ${error.message}`);
    }

    // Mapowanie do DTO
    const agentCategories: AgentCategoryDTO[] = (data || []).map((ac: any) => ({
      id: ac.id,
      userId: ac.agent_id,
      categoryId: ac.category_id,
      category: {
        id: ac.categories.id,
        name: ac.categories.name,
      },
      createdAt: ac.created_at,
    }));

    return { agentCategories };
  }

  /**
   * Pobiera listę agentów przypisanych do danej kategorii
   * @param categoryId - ID kategorii
   * @returns Lista agentów
   */
  static async getAgentsByCategory(
    categoryId: string
  ): Promise<GetAgentsByCategoryResponseDTO> {
    const supabase = createSupabaseAdmin();

    // Sprawdzenie czy kategoria istnieje
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .single();

    if (categoryError || !category) {
      throw new Error("NOT_FOUND:Kategoria nie została znaleziona");
    }

    // Pobranie agentów przypisanych do kategorii
    const { data, error } = await supabase
      .from("agent_categories")
      .select(
        `
        created_at,
        users!inner (
          id,
          name,
          email
        )
      `
      )
      .eq("category_id", categoryId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`DATABASE_ERROR:Błąd podczas pobierania agentów: ${error.message}`);
    }

    // Mapowanie do DTO
    const agents: AgentDTO[] = (data || []).map((ac: any) => ({
      id: ac.users.id,
      name: ac.users.name,
      email: ac.users.email,
      assignedAt: ac.created_at,
    }));

    return { agents };
  }

  /**
   * Sprawdza czy agent ma dostęp do danej kategorii
   * @param agentId - ID agenta
   * @param categoryId - ID kategorii
   * @returns true jeśli agent ma dostęp, false w przeciwnym razie
   */
  static async hasAccessToCategory(
    agentId: string,
    categoryId: string
  ): Promise<boolean> {
    const supabase = createSupabaseAdmin();

    // Sprawdzenie czy user to admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", agentId)
      .single();

    if (!userError && user?.role === "ADMIN") {
      return true;
    }

    const { data, error } = await supabase
      .from("agent_categories")
      .select("id")
      .eq("agent_id", agentId)
      .eq("category_id", categoryId)
      .single();

    return !error && !!data;
  }

  /**
   * Pobiera kategorie do których agent ma dostęp (tylko ID)
   * Pomocnicza metoda do filtrowania ticketów
   * @param agentId - ID agenta
   * @returns Array z ID kategorii
   */
  static async getAgentCategoryIds(agentId: string): Promise<string[]> {
    const supabase = createSupabaseAdmin();

    // Sprawdzenie czy user to admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", agentId)
      .single();

    // Admin ma dostęp do wszystkich kategorii
    if (!userError && user?.role === "ADMIN") {
      const { data, error } = await supabase
        .from("categories")
        .select("id");

      if (error) {
        throw new Error(`DATABASE_ERROR:Błąd podczas pobierania kategorii: ${error.message}`);
      }

      return (data || []).map((cat) => cat.id);
    }

    // Dla agentów zwróć przypisane kategorie
    const { data, error } = await supabase
      .from("agent_categories")
      .select("category_id")
      .eq("agent_id", agentId);

    if (error) {
      throw new Error(`DATABASE_ERROR:Błąd podczas pobierania kategorii agenta: ${error.message}`);
    }

    return (data || []).map((ac) => ac.category_id);
  }

  /**
   * Sprawdza czy agent ma dostęp do ticketu (poprzez kategorię)
   * @param agentId - ID agenta
   * @param subcategoryId - ID podkategorii ticketu
   * @returns true jeśli ma dostęp, false w przeciwnym razie
   */
  static async hasAccessToTicket(
    agentId: string,
    subcategoryId: string
  ): Promise<boolean> {
    const supabase = createSupabaseAdmin();

    // Sprawdzenie czy user to admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", agentId)
      .single();

    if (!userError && user?.role === "ADMIN") {
      return true;
    }

    // Pobierz categoryId z subcategoryId
    const { data: subcategory, error: subError } = await supabase
      .from("subcategories")
      .select("category_id")
      .eq("id", subcategoryId)
      .single();

    if (subError || !subcategory) {
      return false;
    }

    // Sprawdź czy agent ma dostęp do tej kategorii
    return await this.hasAccessToCategory(agentId, subcategory.category_id);
  }
}

