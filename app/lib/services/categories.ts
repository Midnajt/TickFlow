import { createSupabaseAdmin } from "@/app/lib/utils/supabase-auth";
import type {
  CategoryDTO,
  CategoriesListDTO,
  SubcategoryDTO,
  CategoryBaseDTO,
} from "@/src/types";

/**
 * Serwis odpowiedzialny za zarządzanie kategoriami i podkategoriami
 */
export class CategoryService {
  /**
   * Pobiera wszystkie kategorie z opcjonalnymi podkategoriami
   * @param includeSubcategories - Czy dołączyć podkategorie do wyników
   * @returns Lista kategorii
   */
  static async getCategories(
    includeSubcategories: boolean = true
  ): Promise<CategoriesListDTO> {
    const supabase = createSupabaseAdmin();

    if (includeSubcategories) {
      // Pobranie kategorii z podkategoriami (LEFT JOIN)
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
          )
        `
        )
        .order("name", { ascending: true });

      if (error) {
        throw new Error(`DATABASE_ERROR:Błąd podczas pobierania kategorii: ${error.message}`);
      }

      // Mapowanie do DTO
      const categories: CategoryDTO[] = (data || []).map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.created_at,
        subcategories: (category.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.category_id,
          description: sub.description,
        })),
      }));

      return { categories };
    } else {
      // Pobranie tylko kategorii bez podkategorii
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, created_at")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(`DATABASE_ERROR:Błąd podczas pobierania kategorii: ${error.message}`);
      }

      // Mapowanie do DTO (bez subcategories)
      const categories: CategoryDTO[] = (data || []).map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.created_at,
        subcategories: [],
      }));

      return { categories };
    }
  }

  /**
   * Pobiera pojedynczą kategorię po ID
   * @param categoryId - ID kategorii
   * @param includeSubcategories - Czy dołączyć podkategorie
   * @returns Kategoria z opcjonalnymi podkategoriami
   * @throws Error jeśli kategoria nie została znaleziona
   */
  static async getCategoryById(
    categoryId: string,
    includeSubcategories: boolean = true
  ): Promise<CategoryDTO> {
    const supabase = createSupabaseAdmin();

    if (includeSubcategories) {
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
          )
        `
        )
        .eq("id", categoryId)
        .single();

      if (error || !data) {
        throw new Error("NOT_FOUND:Kategoria nie została znaleziona");
      }

      return {
        id: (data as any).id,
        name: (data as any).name,
        description: (data as any).description,
        createdAt: (data as any).created_at,
        subcategories: ((data as any).subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.category_id,
          description: sub.description,
        })),
      };
    } else {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, created_at")
        .eq("id", categoryId)
        .single();

      if (error || !data) {
        throw new Error("NOT_FOUND:Kategoria nie została znaleziona");
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.created_at,
        subcategories: [],
      };
    }
  }

  /**
   * Pobiera podkategorie dla danej kategorii
   * @param categoryId - ID kategorii
   * @returns Lista podkategorii
   */
  static async getSubcategoriesByCategoryId(
    categoryId: string
  ): Promise<SubcategoryDTO[]> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("subcategories")
      .select("id, name, category_id, description")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`DATABASE_ERROR:Błąd podczas pobierania podkategorii: ${error.message}`);
    }

    return (data || []).map((sub) => ({
      id: sub.id,
      name: sub.name,
      categoryId: sub.category_id,
      description: sub.description,
    }));
  }

  /**
   * Sprawdza czy podkategoria istnieje
   * @param subcategoryId - ID podkategorii
   * @returns true jeśli istnieje, false w przeciwnym razie
   */
  static async subcategoryExists(subcategoryId: string): Promise<boolean> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("subcategories")
      .select("id")
      .eq("id", subcategoryId)
      .single();

    return !error && !!data;
  }

  /**
   * Pobiera kategorię dla danej podkategorii
   * @param subcategoryId - ID podkategorii
   * @returns Kategoria (base info)
   * @throws Error jeśli podkategoria nie została znaleziona
   */
  static async getCategoryBySubcategoryId(
    subcategoryId: string
  ): Promise<CategoryBaseDTO> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("subcategories")
      .select(
        `
        category_id,
        categories (
          id,
          name
        )
      `
      )
      .eq("id", subcategoryId)
      .single();

    if (error || !data || !(data as any).categories) {
      throw new Error("NOT_FOUND:Podkategoria nie została znaleziona");
    }

    return {
      id: (data as any).categories.id,
      name: (data as any).categories.name,
    };
  }
}

