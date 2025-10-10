import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/lib/database.types";

/**
 * Tworzy klienta Supabase z kontekstem autentykacji użytkownika (dla RLS)
 * 
 * UWAGA: Ta funkcja ustawia userId w Supabase, co aktywuje Row Level Security (RLS).
 * RLS automatycznie filtruje dane na poziomie bazy danych zgodnie z politykami bezpieczeństwa.
 * 
 * @param userId - ID zalogowanego użytkownika
 * @returns Klient Supabase z kontekstem użytkownika
 */
export function createSupabaseWithAuth(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        // Ustawienie auth context dla RLS
        // Supabase użyje tego w funkcji `auth.uid()` w RLS policies
        "x-user-id": userId,
      },
    },
  });

  return supabase;
}

/**
 * Tworzy klienta Supabase z kluczem service role (omija RLS)
 * UWAGA: Używać TYLKO w sytuacjach, gdzie potrzebujemy pełnego dostępu do danych
 * (np. seeding, migracje, operacje administracyjne)
 * 
 * @returns Klient Supabase z pełnymi uprawnieniami
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

