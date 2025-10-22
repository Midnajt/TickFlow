import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import bcrypt from "bcryptjs";
import type {
  CreateUserCommand,
  UpdateUserCommand,
  UserDetailDTO,
} from "@/src/types";
import { AuditLogService } from "@/app/lib/services/audit-log/audit-log.service";

export class UserAdminService {
  /**
   * Pobiera wszystkich użytkowników ze statystykami
   * 
   * ⚠️ PERFORMANCE NOTE: Dla >1000 użytkowników z tysiącami ticketów, 
   * nested count może być wolny. W przyszłości rozważyć:
   * - Osobne query z GROUP BY i agregacją
   * - Cache wyników (revalidate co 5 min)
   * - Dedykowana tabela z counters (denormalizacja)
   */
  static async getAllUsers(): Promise<UserDetailDTO[]> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        name,
        role,
        force_password_change,
        created_at,
        updated_at,
        ticketsCreated:tickets!tickets_created_by_id_fkey(count),
        ticketsAssigned:tickets!tickets_assigned_to_id_fkey(count)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    return (data || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      forcePasswordChange: user.force_password_change,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      ticketsCreatedCount: user.ticketsCreated?.[0]?.count ?? 0,
      ticketsAssignedCount: user.ticketsAssigned?.[0]?.count ?? 0,
    }));
  }

  /**
   * Tworzy nowego użytkownika
   */
  static async createUser(
    command: CreateUserCommand,
    adminUserId: string
  ): Promise<UserDetailDTO> {
    const supabase = createSupabaseAdmin();

    // Sprawdź czy email już istnieje
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", command.email)
      .single();

    if (existing) {
      throw new Error("VALIDATION_ERROR:Użytkownik z tym emailem już istnieje");
    }

    // Hash hasła
    const hashedPassword = await bcrypt.hash(command.password, 10);

    // Utwórz użytkownika
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: command.email,
        name: command.name,
        role: command.role,
        password: hashedPassword,
        force_password_change: true, // Zawsze wymuszamy zmianę
      })
      .select()
      .single();

    if (error) {
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    // Log akcji
    // 🚨 CRITICAL: NIE logować hasła (nawet hashowanego) w details!
    await AuditLogService.createLog({
      userId: adminUserId,
      action: "USER_CREATED",
      resourceType: "user",
      resourceId: newUser.id,
      details: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        // ❌ NIE dodawać: password, hashedPassword, etc.
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      forcePasswordChange: newUser.force_password_change,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
      ticketsCreatedCount: 0,
      ticketsAssignedCount: 0,
    };
  }

  /**
   * Aktualizuje użytkownika
   */
  static async updateUser(
    userId: string,
    command: UpdateUserCommand,
    adminUserId: string
  ): Promise<void> {
    const supabase = createSupabaseAdmin();

    // ⚠️ SECURITY: Zapobiegaj self-modification (admin zmienia własną rolę)
    if (userId === adminUserId && command.role !== undefined) {
      throw new Error("FORBIDDEN:Nie możesz zmienić własnej roli");
    }

    const updateData: any = {};
    if (command.name !== undefined) updateData.name = command.name;
    if (command.role !== undefined) updateData.role = command.role;
    if (command.forcePasswordChange !== undefined)
      updateData.force_password_change = command.forcePasswordChange;

    if (Object.keys(updateData).length === 0) {
      throw new Error("VALIDATION_ERROR:Brak danych do aktualizacji");
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND:Użytkownik nie istnieje");
      }
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    // Log akcji
    await AuditLogService.createLog({
      userId: adminUserId,
      action: "USER_UPDATED",
      resourceType: "user",
      resourceId: userId,
      details: updateData,
    });
  }

  /**
   * Wymusza reset hasła (ustawia force_password_change = true)
   */
  static async forcePasswordReset(
    userId: string,
    adminUserId: string
  ): Promise<void> {
    const supabase = createSupabaseAdmin();

    const { error } = await supabase
      .from("users")
      .update({ force_password_change: true })
      .eq("id", userId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND:Użytkownik nie istnieje");
      }
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    // Log akcji
    await AuditLogService.createLog({
      userId: adminUserId,
      action: "USER_PASSWORD_RESET",
      resourceType: "user",
      resourceId: userId,
    });
  }
}
