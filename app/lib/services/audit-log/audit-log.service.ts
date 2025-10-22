import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import type {
  AuditLogsListDTO,
  CreateAuditLogCommand,
  GetAuditLogsParams,
} from "@/src/types";

export class AuditLogService {
  /**
   * Tworzy nowy wpis w audit log
   */
  static async createLog(command: CreateAuditLogCommand): Promise<void> {
    const supabase = createSupabaseAdmin();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: command.userId ?? null,
      action: command.action,
      resource_type: command.resourceType ?? null,
      resource_id: command.resourceId ?? null,
      details: command.details ?? null,
      ip_address: command.ipAddress ?? null,
      user_agent: command.userAgent ?? null,
    });

    if (error) {
      console.error("[AuditLog] Failed to create log:", error);
      // Nie rzucamy błędu - logowanie nie powinno blokować operacji
    }
  }

  /**
   * Pobiera logi z filtrowaniem i paginacją
   */
  static async getLogs(
    params: GetAuditLogsParams
  ): Promise<AuditLogsListDTO> {
    const supabase = createSupabaseAdmin();
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    // Build query
    let query = supabase
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
      );

    // Filters
    if (userId) query = query.eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`DATABASE_ERROR:${error.message}`);
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
    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Helper do pobierania IP z request
   */
  static getClientIp(request: Request): string | null {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    
    return realIp;
  }

  /**
   * Helper do pobierania User Agent
   */
  static getUserAgent(request: Request): string | null {
    return request.headers.get("user-agent");
  }
}

