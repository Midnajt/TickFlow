import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/utils/auth";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { createSupabaseAdmin } from "@/app/lib/utils/supabase-auth";

/**
 * GET /api/agents
 * Pobiera listę wszystkich agentów i adminów
 */
export const GET = withRole(
  ["AGENT", "ADMIN"],
  async (request: NextRequest, user) => {
    try {
      const supabase = createSupabaseAdmin();
      
      const { data: agents, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .in("role", ["AGENT", "ADMIN"])
        .order("name");

      if (error) {
        throw new Error(`DATABASE_ERROR:${error.message}`);
      }

      return successResponse({ agents }, 200);
    } catch (error) {
      return errorResponse("Błąd pobierania listy agentów", "INTERNAL_ERROR", 500);
    }
  }
);

