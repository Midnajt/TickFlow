import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import { AuditLogsClient } from "./AuditLogsClient";
import type { AuditLogsListDTO } from "@/src/types";

export default async function AdminLogsPage() {
  // Fetch initial audit logs na serwerze dla SSR
  const supabase = createSupabaseAdmin();

  // Pobierz pierwsze 50 logów z ostatnich 7 dni
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error, count } = await supabase
    .from("audit_logs")
    .select(
      `
      id,
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
      created_at,
      user:users!audit_logs_user_id_fkey(name)
    `,
      { count: "exact" }
    )
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Admin Logs] Error fetching audit logs:", error);
    // W przypadku błędu, przekazujemy pustą listę
    return <AuditLogsClient initialLogs={{ logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false } }} />;
  }

  const logs = (data || []).map((log: any) => ({
    id: log.id,
    userId: log.user_id,
    userName: log.user?.name ?? null,
    action: log.action,
    resourceType: log.resource_type,
    resourceId: log.resource_id,
    details: log.details,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    createdAt: log.created_at,
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / 50);

  const initialLogs: AuditLogsListDTO = {
    logs,
    pagination: {
      page: 1,
      limit: 50,
      total,
      totalPages,
      hasMore: 1 < totalPages,
    },
  };

  return <AuditLogsClient initialLogs={initialLogs} />;
}
