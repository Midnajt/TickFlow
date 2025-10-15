import * as z from "zod";

/**
 * Schema walidacji dla logowania użytkownika
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format adresu email")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Hasło jest wymagane" })
    .min(1, "Hasło jest wymagane"),
});

/**
 * Schema walidacji dla zmiany hasła
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: "Aktualne hasło jest wymagane" })
      .min(1, "Aktualne hasło nie może być puste"),
    newPassword: z
      .string({ message: "Nowe hasło jest wymagane" })
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .max(100, "Hasło może mieć maksymalnie 100 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Hasło musi zawierać przynajmniej jedną małą literę, jedną wielką literę, jedną cyfrę i jeden znak specjalny (@$!%*?&)"
      ),
    confirmPassword: z
      .string({ message: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła nie może być puste"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi różnić się od obecnego",
    path: ["newPassword"],
  });

/**
 * Type inference dla komend
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

