import { z } from "zod";

// Parse boolean that may come as a string from URLSearchParams
const booleanFromStringSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return value;
}, z.boolean());

/**
 * Walidator query params dla listy kategorii
 */
export const getCategoriesQuerySchema = z.object({
  includeSubcategories: booleanFromStringSchema.default(true),
});

export interface GetCategoriesQueryInput
  extends z.infer<typeof getCategoriesQuerySchema> {}

/**
 * Walidator dla aktualizacji opisu kategorii
 */
export const updateCategorySchema = z.object({
  description: z
    .string()
    .max(500, "Opis nie może przekraczać 500 znaków")
    .nullable()
    .optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/**
 * Walidator dla aktualizacji podkategorii
 */
export const updateSubcategorySchema = z.object({
  name: z
    .string()
    .min(2, "Nazwa musi mieć minimum 2 znaki")
    .max(100, "Nazwa nie może przekraczać 100 znaków")
    .optional(),
  description: z
    .string()
    .max(500, "Opis nie może przekraczać 500 znaków")
    .nullable()
    .optional(),
});

export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;