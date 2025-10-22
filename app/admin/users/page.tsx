import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import { UsersAdminClient } from "./UsersAdminClient";
import type { UserDetailDTO } from "@/src/types";

export default async function AdminUsersPage() {
  // Fetch users na serwerze dla SSR
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      name,
      role,
      force_password_change,
      created_at,
      updated_at,
      ticketsCreated:tickets!tickets_created_by_id_fkey(count),
      ticketsAssigned:tickets!tickets_assigned_to_id_fkey(count)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin Users] Error fetching users:", error);
    // W przypadku błędu, przekazujemy pustą listę
    return <UsersAdminClient initialUsers={[]} />;
  }

  const users: UserDetailDTO[] = (data || []).map((user: any) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    forcePasswordChange: user.force_password_change,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    ticketsCreatedCount: user.ticketsCreated?.[0]?.count ?? 0,
    ticketsAssignedCount: user.ticketsAssigned?.[0]?.count ?? 0,
  }));

  return <UsersAdminClient initialUsers={users} />;
}
