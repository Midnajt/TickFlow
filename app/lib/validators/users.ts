import { z } from "zod";

/**
 * Walidator dla tworzenia użytkownika (admin)
 */
export const createUserSchema = z.object({
  email: z
    .string({ message: "Email jest wymagany" })
    .email("Nieprawidłowy format email"),
  name: z
    .string({ message: "Imię i nazwisko jest wymagane" })
    .min(2, "Imię i nazwisko musi mieć minimum 2 znaki")
    .max(100, "Imię i nazwisko nie może przekraczać 100 znaków"),
  role: z.enum(["USER", "AGENT", "ADMIN"], {
    message: "Rola musi być jedną z: USER, AGENT, ADMIN",
  }),
  password: z
    .string({ message: "Hasło jest wymagane" })
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .max(100, "Hasło nie może przekraczać 100 znaków")
    .regex(/[a-z]/, "Hasło musi zawierać małą literę")
    .regex(/[A-Z]/, "Hasło musi zawierać dużą literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę")
    .regex(/[^a-zA-Z0-9]/, "Hasło musi zawierać znak specjalny"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Walidator dla aktualizacji użytkownika
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Imię i nazwisko musi mieć minimum 2 znaki")
    .max(100, "Imię i nazwisko nie może przekraczać 100 znaków")
    .optional(),
  role: z.enum(["USER", "AGENT", "ADMIN"]).optional(),
  forcePasswordChange: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Walidator dla wymuszenia resetu hasła
 */
export const forcePasswordResetSchema = z.object({
  userId: z.string().uuid("Nieprawidłowy format ID użytkownika"),
});

export type ForcePasswordResetInput = z.infer<typeof forcePasswordResetSchema>;
