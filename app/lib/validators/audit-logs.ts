import { z } from "zod";

/**
 * Walidator dla parametrów zapytania audit logs
 */
export const getAuditLogsSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z
    .enum([
      "USER_LOGIN",
      "USER_LOGOUT",
      "USER_CREATED",
      "USER_UPDATED",
      "USER_PASSWORD_RESET",
      "CATEGORY_UPDATED",
      "SUBCATEGORY_UPDATED",
    ])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>;
