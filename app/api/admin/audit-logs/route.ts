import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse, validationErrorResponse } from "@/app/lib/utils/api-response";
import { AuditLogService } from "@/app/lib/services/audit-log/audit-log.service";
import { getAuditLogsSchema } from "@/app/lib/validators/audit-logs";
import { ZodError } from "zod";

export const GET = withRole(["ADMIN"], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const validatedParams = getAuditLogsSchema.parse(params);

    const result = await AuditLogService.getLogs(validatedParams);

    return successResponse(result, 200);
  } catch (error) {
    console.error("[Admin Audit Logs] Error:", error);

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    if (error instanceof Error && error.message.startsWith("DATABASE_ERROR")) {
      return errorResponse("Błąd pobierania logów", "DATABASE_ERROR", 500);
    }

    return errorResponse("Błąd pobierania logów", "INTERNAL_ERROR", 500);
  }
});

