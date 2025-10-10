import { z } from "zod";

/**
 * Schema walidacji dla parametrów zapytania GET /api/categories
 */
export const getCategoriesQuerySchema = z.object({
  includeSubcategories: z
    .string()
    .optional()
    .default("true")
    .transform((val) => val === "true"),
});

/**
 * Type inference dla zapytań
 */
export type GetCategoriesQueryInput = z.infer<typeof getCategoriesQuerySchema>;

