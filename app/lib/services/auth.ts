import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { supabaseServer } from "@/app/lib/supabase-server";
import type {
  LoginCommand,
  LoginResponseDTO,
  UserSessionDTO,
  ChangePasswordCommand,
  ChangePasswordResponseDTO,
  SessionDTO,
} from "@/src/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);
const JWT_EXPIRATION = "7d"; // 7 dni
const BCRYPT_ROUNDS = 10;

/**
 * Serwis odpowiedzialny za uwierzytelnianie użytkowników
 */
export class AuthService {
  /**
   * Logowanie użytkownika
   * @throws Error jeśli dane uwierzytelniające są nieprawidłowe
   */
  static async login(
    command: LoginCommand
  ): Promise<LoginResponseDTO> {
    const { email, password } = command;

    // Pobranie użytkownika z bazy danych
    const { data: user, error } = await supabaseServer
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      throw new Error("AUTHENTICATION_ERROR:Nieprawidłowy email lub hasło");
    }

    // Weryfikacja hasła
    const isPasswordValid = await compare(password, (user as any).password);
    if (!isPasswordValid) {
      throw new Error("AUTHENTICATION_ERROR:Nieprawidłowy email lub hasło");
    }

    // Utworzenie sesji JWT
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dni od teraz

    const token = await new SignJWT({
      userId: (user as any).id,
      email: (user as any).email,
      role: (user as any).role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET);

    // Utworzenie DTO użytkownika
    const userSession: UserSessionDTO = {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      role: (user as any).role,
      passwordResetRequired: (user as any).force_password_change,
    };

    return {
      user: userSession,
      session: {
        token,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  /**
   * Zmiana hasła użytkownika
   * @throws Error jeśli aktualne hasło jest nieprawidłowe lub nowe hasło nie spełnia wymogów
   */
  static async changePassword(
    userId: string,
    command: ChangePasswordCommand
  ): Promise<ChangePasswordResponseDTO> {
    const { currentPassword, newPassword } = command;

    // Pobranie użytkownika z bazy danych
    const { data: user, error } = await supabaseServer
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new Error("AUTHENTICATION_ERROR:Użytkownik nie został znaleziony");
    }

    // Weryfikacja obecnego hasła
    const isPasswordValid = await compare(currentPassword, (user as any).password);
    if (!isPasswordValid) {
      throw new Error("AUTHENTICATION_ERROR:Aktualne hasło jest nieprawidłowe");
    }

    // Hashowanie nowego hasła
    const hashedPassword = await hash(newPassword, BCRYPT_ROUNDS);

    // Aktualizacja hasła w bazie danych i ustawienie force_password_change na false
    const { error: updateError } = await supabaseServer
      .from("users")
      .update({
        password: hashedPassword,
        force_password_change: false,
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error("INTERNAL_ERROR:Nie udało się zaktualizować hasła");
    }

    return {
      message: "Hasło zostało pomyślnie zmienione",
      passwordResetRequired: false,
    };
  }

  /**
   * Weryfikacja tokenu JWT i pobranie sesji użytkownika
   * @throws Error jeśli token jest nieprawidłowy lub wygasł
   */
  static async getSession(token: string): Promise<SessionDTO> {
    try {
      // Weryfikacja tokenu JWT
      const { payload } = await jwtVerify(token, JWT_SECRET);

      const userId = payload.userId as string;

      // Pobranie aktualnych danych użytkownika z bazy
      const { data: user, error } = await supabaseServer
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new Error("AUTHENTICATION_ERROR:Sesja użytkownika jest nieprawidłowa");
      }

      const userSession: UserSessionDTO = {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
        passwordResetRequired: (user as any).force_password_change,
      };

      return {
        user: userSession,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("AUTHENTICATION_ERROR")) {
          throw error;
        }
      }
      throw new Error("AUTHENTICATION_ERROR:Token jest nieprawidłowy lub wygasł");
    }
  }

  /**
   * Wylogowanie użytkownika
   * W obecnej implementacji JWT jest stateless, więc wylogowanie
   * polega na usunięciu tokenu po stronie klienta.
   * Może być rozszerzone o blacklistę tokenów w przyszłości.
   */
  static async logout(): Promise<{ message: string }> {
    // W przypadku JWT stateless, wylogowanie odbywa się po stronie klienta
    // (usunięcie cookie/tokenu z local storage)
    // Tutaj możemy dodać logikę blacklisty tokenów jeśli potrzebna

    return {
      message: "Pomyślnie wylogowano",
    };
  }
}

