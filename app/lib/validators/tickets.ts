import * as z from "zod";
import { Constants } from "@/app/lib/database.types";

/**
 * Schema walidacji dla tworzenia ticketu
 */
export const createTicketSchema = z.object({
  title: z
    .string({ message: "Tytuł jest wymagany" })
    .min(3, "Tytuł musi mieć minimum 3 znaki")
    .max(200, "Tytuł może mieć maksymalnie 200 znaków")
    .trim(),
  description: z
    .string({ message: "Opis jest wymagany" })
    .min(10, "Opis musi mieć minimum 10 znaków")
    .max(2000, "Opis może mieć maksymalnie 2000 znaków")
    .trim(),
  subcategoryId: z
    .string({ message: "Podkategoria jest wymagana" })
    .uuid("Nieprawidłowy format ID podkategorii"),
});

/**
 * Schema walidacji dla zmiany statusu ticketu
 */
export const updateTicketStatusSchema = z.object({
  status: z.enum(Constants.public.Enums.ticket_status, {
    message: "Nieprawidłowy status ticketu",
  }),
});

/**
 * Schema walidacji dla parametrów zapytania GET /api/tickets
 */
export const getTicketsQuerySchema = z.object({
  status: z
    .enum(Constants.public.Enums.ticket_status)
    .optional(),
  assignedToMe: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  sortBy: z
    .enum(["created_at", "updated_at", "status", "title"])
    .default("created_at"),
  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

/**
 * Type inference dla komend i zapytań
 */
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type GetTicketsQueryInput = z.infer<typeof getTicketsQuerySchema>;

