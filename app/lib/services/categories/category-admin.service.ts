import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import type {
  CategoryWithAgentsDTO,
  UpdateCategoryCommand,
  UpdateSubcategoryCommand,
} from "@/src/types";
import { AuditLogService } from "@/app/lib/services/audit-log/audit-log.service";

export class CategoryAdminService {
  /**
   * Pobiera wszystkie kategorie z agentami (dla admin panelu)
   */
  static async getCategoriesWithAgents(): Promise<CategoryWithAgentsDTO[]> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        description,
        created_at,
        subcategories (
          id,
          name,
          category_id,
          description
        ),
        agent_categories (
          id,
          created_at,
          agent:users!agent_categories_agent_id_fkey (
            id,
            name,
            email
          )
        )
      `
      )
      .order("name");

    if (error) {
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }
    
    // ⚠️ UWAGA: Zweryfikować nazwę foreign key "agent_categories_agent_id_fkey"
    // w rzeczywistej bazie Supabase przed wdrożeniem. Może wymagać korekty.

    return (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      createdAt: cat.created_at,
      subcategories: (cat.subcategories || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        categoryId: sub.category_id,
        description: sub.description,
      })),
      agents: (cat.agent_categories || []).map((ac: any) => ({
        id: ac.agent.id,
        name: ac.agent.name,
        email: ac.agent.email,
        assignedAt: ac.created_at,
      })),
    }));
  }

  /**
   * Aktualizuje opis kategorii
   */
  static async updateCategoryDescription(
    categoryId: string,
    command: UpdateCategoryCommand,
    adminUserId: string
  ): Promise<void> {
    const supabase = createSupabaseAdmin();

    const { error } = await supabase
      .from("categories")
      .update({ description: command.description })
      .eq("id", categoryId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND:Kategoria nie istnieje");
      }
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    // Log akcji
    await AuditLogService.createLog({
      userId: adminUserId,
      action: "CATEGORY_UPDATED",
      resourceType: "category",
      resourceId: categoryId,
      details: { description: command.description },
    });
  }

  /**
   * Aktualizuje podkategorię
   */
  static async updateSubcategory(
    subcategoryId: string,
    command: UpdateSubcategoryCommand,
    adminUserId: string
  ): Promise<void> {
    const supabase = createSupabaseAdmin();

    const updateData: any = {};
    if (command.name !== undefined) updateData.name = command.name;
    if (command.description !== undefined)
      updateData.description = command.description;

    if (Object.keys(updateData).length === 0) {
      throw new Error("VALIDATION_ERROR:Brak danych do aktualizacji");
    }

    const { error } = await supabase
      .from("subcategories")
      .update(updateData)
      .eq("id", subcategoryId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND:Podkategoria nie istnieje");
      }
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    // Log akcji
    await AuditLogService.createLog({
      userId: adminUserId,
      action: "SUBCATEGORY_UPDATED",
      resourceType: "subcategory",
      resourceId: subcategoryId,
      details: updateData,
    });
  }
}
