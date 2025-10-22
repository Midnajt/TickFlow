import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import { CategoriesAdminClient } from "./CategoriesAdminClient";
import type { CategoryWithAgentsDTO } from "@/src/types";

export default async function AdminCategoriesPage() {
  // Fetch na serwerze dla SSR
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
    console.error("Error fetching categories:", error);
    // W przypadku błędu, przekazujemy pustą tablicę
    return <CategoriesAdminClient initialCategories={[]} />;
  }

  const categories: CategoryWithAgentsDTO[] = (data || []).map((cat: any) => ({
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

  return <CategoriesAdminClient initialCategories={categories} />;
}
