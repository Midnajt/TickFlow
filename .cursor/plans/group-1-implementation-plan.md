# Grupa 1 - Panel Administratora - Zarządzanie Danymi

## Status: W TRAKCIE IMPLEMENTACJI

**Priorytet:** Wysoki  
**Złożoność:** Średnia-Wysoka  
**Szacowany czas:** 4-6 batchy

## 📊 Postęp Implementacji
- **BATCH 0:** ✅ ZAKOŃCZONY (3/3 zadania)
- **BATCH 1:** ✅ ZAKOŃCZONY (6/6 zadań)
- **BATCH 2:** ✅ ZAKOŃCZONY (3/3 zadania)
- **BATCH 3:** ✅ ZAKOŃCZONY (4/4 zadania)
- **BATCH 4:** ✅ ZAKOŃCZONY (5/5 zadań)
- **BATCH 5:** ✅ ZAKOŃCZONY (1/1 zadanie)
- **BATCH 6:** ✅ ZAKOŃCZONY (1/1 zadanie)
- **BATCH 7:** ✅ ZAKOŃCZONY (3/3 zadania)
- **BATCH 8:** ✅ ZAKOŃCZONY (4/4 zadania)
- **BATCH 9:** ⏳ OCZEKUJE (0/4 zadania)
- **BATCH 10:** ⏳ OCZEKUJE (0/2 zadania)

**Łącznie:** 30/35 zadań wykonanych (85.7%)

---

## 📋 Zakres Funkcjonalności

### Wymagania z notes.txt:

1. **Panel Kategorii & Podkategorii**
   - Widok z listą kategorii, podkategorii i ich opisów
   - Możliwość aktualizowania opisów kategorii i podkategorii
   - Wyświetlanie przypisanych agentów do kategorii
   - **Tylko dla roli ADMIN**

2. **Panel Użytkowników**
   - Widok z listą użytkowników oraz ich ról
   - Możliwość utworzenia nowego użytkownika
   - Wymuszenie zmiany hasła dla nowego użytkownika
   - **Tylko dla roli ADMIN**

3. **Panel Logów (Audit Log)**
   - Widok z logami aktywności użytkowników
   - Rejestrowanie logowań użytkowników
   - Informacja: kto, kiedy, z jakiego IP
   - **Tylko dla roli ADMIN**

---

## 🗄️ Zmiany w Bazie Danych

### BATCH 0: Migracje SQL (Prerequisite)

#### Zadanie 0.1: Weryfikacja pola description w subcategories ✅
**Status:** Już istnieje w database.types.ts (linia 79)
```typescript
description: string | null;
```
**Akcja:** Brak migracji potrzebnej

---

#### Zadanie 0.2: Migracja - Tabela audit_logs
**Plik:** `supabase/migrations/20251022_create_audit_logs.sql` (NOWY)

**Cel:** Rejestrowanie aktywności użytkowników (logowania, akcje admina)

**Schemat:**
```sql
-- Enum dla typów akcji
CREATE TYPE audit_action AS ENUM (
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_PASSWORD_RESET',
  'CATEGORY_UPDATED',
  'SUBCATEGORY_UPDATED'
);

-- Tabela audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy dla wydajności
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS Policy (tylko ADMIN może czytać)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );
```

**Funkcjonalność:**
- ✅ Rejestrowanie wszystkich kluczowych akcji użytkowników
- ✅ Przechowywanie metadanych (IP, user agent, details)
- ✅ Optymalizacja zapytań przez indeksy
- ✅ Zabezpieczenie RLS (tylko ADMIN)

**⚠️ UWAGI DO IMPLEMENTACJI:**
1. **RLS Policy - auth.uid()**: W Supabase może być wymagane użycie innej funkcji zamiast `auth.uid()`. Należy przetestować po wdrożeniu migracji. Jeśli nie działa, rozważyć użycie `current_setting('request.jwt.claims', true)::json->>'sub'` lub podobnego rozwiązania zgodnego z Supabase.
2. **Foreign Key Verification**: Przed wdrożeniem zweryfikować rzeczywistą nazwę foreign key `audit_logs_user_id_fkey` w bazie Supabase - może się różnić od założonej.

---

#### Zadanie 0.3: Aktualizacja database.types.ts
**Plik:** `app/lib/database.types.ts`

**Dodać:**
```typescript
audit_logs: {
  Row: {
    id: string;
    user_id: string | null;
    action: Database["public"]["Enums"]["audit_action"];
    resource_type: string | null;
    resource_id: string | null;
    details: Json | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id?: string | null;
    action: Database["public"]["Enums"]["audit_action"];
    resource_type?: string | null;
    resource_id?: string | null;
    details?: Json | null;
    ip_address?: string | null;
    user_agent?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string | null;
    action?: Database["public"]["Enums"]["audit_action"];
    resource_type?: string | null;
    resource_id?: string | null;
    details?: Json | null;
    ip_address?: string | null;
    user_agent?: string | null;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "audit_logs_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
    }
  ];
}
```

**W Enums dodać:**
```typescript
audit_action: 
  | "USER_LOGIN" 
  | "USER_LOGOUT" 
  | "USER_CREATED" 
  | "USER_UPDATED" 
  | "USER_PASSWORD_RESET"
  | "CATEGORY_UPDATED"
  | "SUBCATEGORY_UPDATED";
```

**Uwaga:** Możesz wygenerować typy automatycznie:
```bash
npx supabase gen types typescript --local > app/lib/database.types.ts
```

---

## 📦 BATCH 1: Typy TypeScript & Walidatory (5 zadań)

### Zadanie 1.1: Typy DTO dla Kategorii i Podkategorii
**Plik:** `src/types.ts`

**Dodać po istniejących CategoryDTO:**
```typescript
// --- Admin Category Management DTOs ---

// Update category description command
export interface UpdateCategoryCommand {
  description: string | null;
}

// Update subcategory command
export interface UpdateSubcategoryCommand {
  name?: string;
  description?: string | null;
}

// Category with agents (for admin panel)
export interface CategoryWithAgentsDTO extends CategoryDTO {
  agents: Array<{
    id: string;
    name: string;
    email: string;
    assignedAt: string;
  }>;
}
```

---

### Zadanie 1.2: Typy DTO dla Użytkowników
**Plik:** `src/types.ts`

**Dodać:**
```typescript
// --- Admin User Management DTOs ---

// Create user command (admin only)
export interface CreateUserCommand {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

// User detail DTO (for admin panel)
export interface UserDetailDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  forcePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
  // Statystyki
  ticketsCreatedCount?: number;
  ticketsAssignedCount?: number;
}

// Update user command
export interface UpdateUserCommand {
  name?: string;
  role?: UserRole;
  forcePasswordChange?: boolean;
}

// Force password reset command
export interface ForcePasswordResetCommand {
  userId: string;
}
```

---

### Zadanie 1.3: Typy DTO dla Audit Logs
**Plik:** `src/types.ts`

**Dodać:**
```typescript
// --- Audit Log DTOs ---

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export type AuditAction = Database["public"]["Enums"]["audit_action"];

export interface AuditLogDTO {
  id: AuditLogRow["id"];
  userId: AuditLogRow["user_id"];
  userName: string | null; // joined from users
  action: AuditAction;
  resourceType: AuditLogRow["resource_type"];
  resourceId: AuditLogRow["resource_id"];
  details: AuditLogRow["details"];
  ipAddress: AuditLogRow["ip_address"];
  userAgent: AuditLogRow["user_agent"];
  createdAt: AuditLogRow["created_at"];
}

export interface GetAuditLogsParams {
  userId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsListDTO {
  logs: AuditLogDTO[];
  pagination: PaginationDTO;
}

// Create audit log command (internal use)
export interface CreateAuditLogCommand {
  userId?: string | null;
  action: AuditAction;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
```

---

### Zadanie 1.4: Walidatory Zod dla Kategorii
**Plik:** `app/lib/validators/categories.ts` (NOWY)

**Kod:**
```typescript
import { z } from "zod";

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
```

---

### Zadanie 1.5: Walidatory Zod dla Użytkowników
**Plik:** `app/lib/validators/users.ts` (NOWY)

**Kod:**
```typescript
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
```

---

### Zadanie 1.6: Walidatory Zod dla Audit Logs
**Plik:** `app/lib/validators/audit-logs.ts` (NOWY)

**Kod:**
```typescript
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
```

---

## 📊 Podsumowanie Batch 1

### Pliki utworzone: 3
1. ✅ `app/lib/validators/categories.ts` - walidatory kategorii/podkategorii
2. ✅ `app/lib/validators/users.ts` - walidatory zarządzania użytkownikami
3. ✅ `app/lib/validators/audit-logs.ts` - walidatory logów

### Pliki zmodyfikowane: 2
1. ✅ `src/types.ts` - dodano DTOs dla wszystkich funkcjonalności
2. ✅ `app/lib/database.types.ts` - dodano audit_logs (po migracji)

---

## 📦 BATCH 2: Services - Audit Log (3 zadania)

### Zadanie 2.1: Audit Log Service
**Plik:** `app/lib/services/audit-log/audit-log.service.ts` (NOWY)

**Funkcjonalność:**
- Zapisywanie logów (createLog)
- Pobieranie logów z filtrowaniem i paginacją (getLogs)
- Helper do pobierania IP z request

**Kod:**
```typescript
import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import type {
  AuditLogsListDTO,
  CreateAuditLogCommand,
  GetAuditLogsParams,
} from "@/src/types";

export class AuditLogService {
  /**
   * Tworzy nowy wpis w audit log
   */
  static async createLog(command: CreateAuditLogCommand): Promise<void> {
    const supabase = createSupabaseAdmin();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: command.userId ?? null,
      action: command.action,
      resource_type: command.resourceType ?? null,
      resource_id: command.resourceId ?? null,
      details: command.details ?? null,
      ip_address: command.ipAddress ?? null,
      user_agent: command.userAgent ?? null,
    });

    if (error) {
      console.error("[AuditLog] Failed to create log:", error);
      // Nie rzucamy błędu - logowanie nie powinno blokować operacji
    }
  }

  /**
   * Pobiera logi z filtrowaniem i paginacją
   */
  static async getLogs(
    params: GetAuditLogsParams
  ): Promise<AuditLogsListDTO> {
    const supabase = createSupabaseAdmin();
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    // Build query
    let query = supabase
      .from("audit_logs")
      .select(
        `
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        user:users!audit_logs_user_id_fkey(name)
      `,
        { count: "exact" }
      );

    // Filters
    if (userId) query = query.eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    const logs = (data || []).map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user?.name ?? null,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    }));

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Helper do pobierania IP z request
   */
  static getClientIp(request: Request): string | null {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    
    return realIp;
  }

  /**
   * Helper do pobierania User Agent
   */
  static getUserAgent(request: Request): string | null {
    return request.headers.get("user-agent");
  }
}
```

---

### Zadanie 2.2: Integracja z Login Endpoint
**Plik:** `app/api/auth/login/route.ts`

**Modyfikacja:** Dodać logowanie po udanym zalogowaniu

**Przed (po linii z session.set):**
```typescript
// ... session set logic ...

return successResponse<LoginResponseDTO>(
  {
    user: userSession,
    session: {
      token: "secure-cookie-based-session",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  200
);
```

**Po:**
```typescript
// ... session set logic ...

// Log successful login
await AuditLogService.createLog({
  userId: user.id,
  action: "USER_LOGIN",
  details: { email: user.email },
  ipAddress: AuditLogService.getClientIp(request),
  userAgent: AuditLogService.getUserAgent(request),
});

return successResponse<LoginResponseDTO>(
  {
    user: userSession,
    session: {
      token: "secure-cookie-based-session",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  200
);
```

**Import:**
```typescript
import { AuditLogService } from "@/app/lib/services/audit-log/audit-log.service";
```

---

### Zadanie 2.3: Integracja z Logout Endpoint
**Plik:** `app/api/auth/logout/route.ts`

**Modyfikacja:** Dodać logowanie przed wylogowaniem

**Przed:**
```typescript
export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const supabaseSession = await getServerSession();
    await supabaseSession.set(null);

    return successResponse<LogoutResponseDTO>(
      { message: "Wylogowano pomyślnie" },
      200
    );
  } catch (error) {
    return errorResponse("Błąd wylogowania", "INTERNAL_ERROR", 500);
  }
});
```

**Po:**
```typescript
export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    // Log logout BEFORE destroying session
    await AuditLogService.createLog({
      userId: session.user.id,
      action: "USER_LOGOUT",
      ipAddress: AuditLogService.getClientIp(request),
      userAgent: AuditLogService.getUserAgent(request),
    });

    const supabaseSession = await getServerSession();
    await supabaseSession.set(null);

    return successResponse<LogoutResponseDTO>(
      { message: "Wylogowano pomyślnie" },
      200
    );
  } catch (error) {
    return errorResponse("Błąd wylogowania", "INTERNAL_ERROR", 500);
  }
});
```

---

## 📊 Podsumowanie Batch 2

### Pliki utworzone: 1
1. ✅ `app/lib/services/audit-log/audit-log.service.ts` - serwis do logowania

### Pliki zmodyfikowane: 2
1. ✅ `app/api/auth/login/route.ts` - logowanie USER_LOGIN
2. ✅ `app/api/auth/logout/route.ts` - logowanie USER_LOGOUT

---

## 📦 BATCH 3: Services - Category Management (4 zadania) ✅ ZAKOŃCZONY

### Zadanie 3.1: Category Admin Service
**Plik:** `app/lib/services/categories/category-admin.service.ts` (NOWY)

**Funkcjonalność:**
- Pobieranie kategorii z przypisanymi agentami
- Aktualizacja opisu kategorii
- Aktualizacja podkategorii (nazwa + opis)

**Kod:**
```typescript
import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import type {
  CategoryWithAgentsDTO,
  UpdateCategoryCommand,
  UpdateSubcategoryCommand,
} from "@/src/types";
import { AuditLogService } from "@/app/lib/services/audit-log/audit-log.service";

export class CategoryAdminService {
  /**
   * Pobiera wszystkie kategorie z agentami (dla admin panelu)
   */
  static async getCategoriesWithAgents(): Promise<CategoryWithAgentsDTO[]> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        description,
        created_at,
        subcategories (
          id,
          name,
          category_id,
          description
        ),
        agent_categories (
          id,
          created_at,
          agent:users!agent_categories_agent_id_fkey (
            id,
            name,
            email
          )
        )
      `
      )
      .order("name");

    if (error) {
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }
    
    // ⚠️ UWAGA: Zweryfikować nazwę foreign key "agent_categories_agent_id_fkey"
    // w rzeczywistej bazie Supabase przed wdrożeniem. Może wymagać korekty.

    return (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      createdAt: cat.created_at,
      subcategories: (cat.subcategories || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        categoryId: sub.category_id,
        description: sub.description,
      })),
      agents: (cat.agent_categories || []).map((ac: any) => ({
        id: ac.agent.id,
        name: ac.agent.name,
        email: ac.agent.email,
        assignedAt: ac.created_at,
      })),
    }));
  }

  /**
   * Aktualizuje opis kategorii
   */
  static async updateCategoryDescription(
    categoryId: string,
    command: UpdateCategoryCommand,
    adminUserId: string
  ): Promise<void> {
    const supabase = createSupabaseAdmin();

    const { error } = await supabase
      .from("categories")
      .update({ description: command.description })
      .eq("id", categoryId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND:Kategoria nie istnieje");
      }
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    // Log akcji
    await AuditLogService.createLog({
      userId: adminUserId,
      action: "CATEGORY_UPDATED",
      resourceType: "category",
      resourceId: categoryId,
      details: { description: command.description },
    });
  }

  /**
   * Aktualizuje podkategorię
   */
  static async updateSubcategory(
    subcategoryId: string,
    command: UpdateSubcategoryCommand,
    adminUserId: string
  ): Promise<void> {
    const supabase = createSupabaseAdmin();

    const updateData: any = {};
    if (command.name !== undefined) updateData.name = command.name;
    if (command.description !== undefined)
      updateData.description = command.description;

    if (Object.keys(updateData).length === 0) {
      throw new Error("VALIDATION_ERROR:Brak danych do aktualizacji");
    }

    const { error } = await supabase
      .from("subcategories")
      .update(updateData)
      .eq("id", subcategoryId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND:Podkategoria nie istnieje");
      }
      throw new Error(`DATABASE_ERROR:${error.message}`);
    }

    // Log akcji
    await AuditLogService.createLog({
      userId: adminUserId,
      action: "SUBCATEGORY_UPDATED",
      resourceType: "subcategory",
      resourceId: subcategoryId,
      details: updateData,
    });
  }
}
```

---

### Zadanie 3.2: API Endpoint - Get Categories with Agents
**Plik:** `app/api/admin/categories/route.ts` (NOWY)

**Endpoint:** `GET /api/admin/categories`

**Uprawnienia:** ADMIN tylko

**Kod:**
```typescript
import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { CategoryAdminService } from "@/app/lib/services/categories/category-admin.service";

export const GET = withRole(["ADMIN"], async (request: NextRequest, user) => {
  try {
    const categories = await CategoryAdminService.getCategoriesWithAgents();

    return successResponse({ categories }, 200);
  } catch (error) {
    console.error("[Admin Categories] Error:", error);

    if (error instanceof Error && error.message.startsWith("DATABASE_ERROR")) {
      return errorResponse(
        "Błąd pobierania kategorii",
        "DATABASE_ERROR",
        500
      );
    }

    return errorResponse(
      "Błąd pobierania kategorii",
      "INTERNAL_ERROR",
      500
    );
  }
});
```

---

### Zadanie 3.3: API Endpoint - Update Category
**Plik:** `app/api/admin/categories/[categoryId]/route.ts` (NOWY)

**Endpoint:** `PATCH /api/admin/categories/:categoryId`

**Uprawnienia:** ADMIN tylko

**Kod:**
```typescript
import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { CategoryAdminService } from "@/app/lib/services/categories/category-admin.service";
import { updateCategorySchema } from "@/app/lib/validators/categories";
import { ZodError } from "zod";

export const PATCH = withRole(
  ["ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ categoryId: string }> };
      const { categoryId } = await params;

      const body = await request.json();
      const validatedData = updateCategorySchema.parse(body);

      await CategoryAdminService.updateCategoryDescription(
        categoryId,
        validatedData,
        user.id
      );

      return successResponse({ message: "Kategoria zaktualizowana" }, 200);
    } catch (error) {
      console.error("[Update Category] Error:", error);

      if (error instanceof ZodError) {
        return errorResponse(
          error.errors[0].message,
          "VALIDATION_ERROR",
          400
        );
      }

      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "NOT_FOUND", 404);
        }

        if (error.message.startsWith("DATABASE_ERROR")) {
          return errorResponse(
            "Błąd aktualizacji kategorii",
            "DATABASE_ERROR",
            500
          );
        }
      }

      return errorResponse(
        "Błąd aktualizacji kategorii",
        "INTERNAL_ERROR",
        500
      );
    }
  }
);
```

---

### Zadanie 3.4: API Endpoint - Update Subcategory
**Plik:** `app/api/admin/subcategories/[subcategoryId]/route.ts` (NOWY)

**Endpoint:** `PATCH /api/admin/subcategories/:subcategoryId`

**⚠️ TODO: Uzupełnić pełny kod (podobny do 3.3)**

**Szkielet kodu:**
```typescript
import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { CategoryAdminService } from "@/app/lib/services/categories/category-admin.service";
import { updateSubcategorySchema } from "@/app/lib/validators/categories";
import { ZodError } from "zod";

export const PATCH = withRole(
  ["ADMIN"],
  async (request: NextRequest, user, context) => {
    try {
      const { params } = context as { params: Promise<{ subcategoryId: string }> };
      const { subcategoryId } = await params;

      const body = await request.json();
      const validatedData = updateSubcategorySchema.parse(body);

      await CategoryAdminService.updateSubcategory(
        subcategoryId,
        validatedData,
        user.id
      );

      return successResponse({ message: "Podkategoria zaktualizowana" }, 200);
    } catch (error) {
      console.error("[Update Subcategory] Error:", error);

      if (error instanceof ZodError) {
        return errorResponse(
          error.errors[0].message,
          "VALIDATION_ERROR",
          400
        );
      }

      if (error instanceof Error) {
        if (error.message.startsWith("NOT_FOUND")) {
          const message = error.message.split(":")[1];
          return errorResponse(message, "NOT_FOUND", 404);
        }

        if (error.message.startsWith("DATABASE_ERROR")) {
          return errorResponse(
            "Błąd aktualizacji podkategorii",
            "DATABASE_ERROR",
            500
          );
        }
      }

      return errorResponse(
        "Błąd aktualizacji podkategorii",
        "INTERNAL_ERROR",
        500
      );
    }
  }
);
```

---

## 📊 Podsumowanie Batch 3

### Pliki utworzone: 4 ✅ ZAKOŃCZONE
1. ✅ `app/lib/services/categories/category-admin.service.ts`
2. ✅ `app/api/admin/categories/route.ts`
3. ✅ `app/api/admin/categories/[categoryId]/route.ts`
4. ✅ `app/api/admin/subcategories/[subcategoryId]/route.ts`

---

## 📦 BATCH 4: Services - User Management (4 zadania)

### Zadanie 4.1: User Admin Service
**Plik:** `app/lib/services/users/user-admin.service.ts` (NOWY)

**Funkcjonalność:**
- Pobieranie listy wszystkich użytkowników ze statystykami
- Tworzenie nowego użytkownika
- Aktualizacja użytkownika
- Wymuszenie resetu hasła

**Kod (fragment):**
```typescript
import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import bcrypt from "bcrypt";
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
```

---

### Zadanie 4.2 - 4.5: API Endpoints dla User Management
**Pliki:**
- `app/api/admin/users/route.ts` - GET (lista) + POST (create)
- `app/api/admin/users/[userId]/route.ts` - PATCH (update)
- `app/api/admin/users/[userId]/force-password-reset/route.ts` - POST

*Kod podobny do Batch 3, używa `withRole(["ADMIN"])` i odpowiednich serwisów*

**⚠️ KRYTYCZNE UWAGI DO IMPLEMENTACJI:**

1. **Rate Limiting** (Zadanie 4.2 - POST /users):
   - Dodać rate limiting: max 10 użytkowników / min / admin
   - Zabezpieczenie przed botami automatycznie tworzącymi konta
   - Można użyć middleware lub dedykowanego rate-limitera

2. **Self-Modification Protection** (Zadanie 4.3 - PATCH /users/:id):
   - W endpoint dodać obsługę błędu `FORBIDDEN` z UserAdminService
   - Error handler powinien zwracać 403 dla self-modification attempts
   
   ```typescript
   if (error instanceof Error && error.message.startsWith("FORBIDDEN")) {
     const message = error.message.split(":")[1];
     return errorResponse(message, "FORBIDDEN", 403);
   }
   ```

3. **Password Security** (Zadanie 4.2 - POST /users):
   - Upewnić się, że hasło nigdy nie jest zwracane w response
   - UserDetailDTO nie zawiera pola password (✅ już OK)
   - Audit log nie zawiera hasła (✅ już poprawione wyżej)

---

## 📊 Podsumowanie Batch 4 ✅ ZAKOŃCZONY

### Pliki utworzone: 4
1. ✅ `app/lib/services/users/user-admin.service.ts`
2. ✅ `app/api/admin/users/route.ts` (GET + POST)
3. ✅ `app/api/admin/users/[userId]/route.ts` (PATCH)
4. ✅ `app/api/admin/users/[userId]/force-password-reset/route.ts` (POST)

### Zaimplementowane funkcjonalności:
- ✅ Pobieranie listy wszystkich użytkowników ze statystykami
- ✅ Tworzenie nowego użytkownika z walidacją
- ✅ Aktualizacja użytkownika (nazwa, rola, force password change)
- ✅ Wymuszenie resetu hasła
- ✅ Zabezpieczenie przed self-modification (admin nie może zmienić własnej roli)
- ✅ Logowanie wszystkich akcji w audit_logs
- ✅ Walidacja danych wejściowych z Zod
- ✅ Obsługa błędów i odpowiednie kody HTTP

### Krytyczne fixes zaimplementowane:
- ✅ Usunięcie hasła z audit log details (bezpieczeństwo)
- ✅ Dodanie self-modification protection (zabezpieczenie)
- ⚠️ Rozważenie rate limiting dla POST /users (do przyszłej implementacji)
- ⚠️ Optymalizacja user statistics query (do przyszłej implementacji)

---

## 📊 Podsumowanie Batch 5 ✅ ZAKOŃCZONY

### Pliki utworzone: 1
1. ✅ `app/api/admin/audit-logs/route.ts` - endpoint do pobierania logów

### Zaimplementowane funkcjonalności:
- ✅ GET /api/admin/audit-logs z filtrowaniem i paginacją
- ✅ Walidacja parametrów zapytania z Zod
- ✅ Filtry: userId, action, startDate, endDate, page, limit
- ✅ Uprawnienia: tylko ADMIN
- ✅ Obsługa błędów i odpowiednie kody HTTP

---

## 📦 BATCH 5: API Endpoint - Audit Logs (1 zadanie)

### Zadanie 5.1: API Endpoint - Get Audit Logs
**Plik:** `app/api/admin/audit-logs/route.ts` (NOWY)

**Endpoint:** `GET /api/admin/audit-logs`

**Query params:** userId, action, startDate, endDate, page, limit

**Kod:**
```typescript
import { NextRequest } from "next/server";
import { withRole } from "@/app/lib/middleware/auth-middleware";
import { successResponse, errorResponse } from "@/app/lib/utils/api-response";
import { AuditLogService } from "@/app/lib/services/audit-log/audit-log.service";
import { getAuditLogsSchema } from "@/app/lib/validators/audit-logs";
import { ZodError } from "zod";

export const GET = withRole(["ADMIN"], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const validatedParams = getAuditLogsSchema.parse(params);

    const result = await AuditLogService.getLogs(validatedParams);

    return successResponse(result, 200);
  } catch (error) {
    console.error("[Admin Audit Logs] Error:", error);

    if (error instanceof ZodError) {
      return errorResponse(error.errors[0].message, "VALIDATION_ERROR", 400);
    }

    if (error instanceof Error && error.message.startsWith("DATABASE_ERROR")) {
      return errorResponse("Błąd pobierania logów", "DATABASE_ERROR", 500);
    }

    return errorResponse("Błąd pobierania logów", "INTERNAL_ERROR", 500);
  }
});
```

---

## 📦 BATCH 6: API Client (1 zadanie)

### Zadanie 6.1: API Client - Admin Endpoints
**Plik:** `app/lib/api-client.ts`

**Dodać nowy obiekt `adminApi`:**

```typescript
// Na końcu pliku, po ticketsApi:

export const adminApi = {
  // Categories
  getCategories: async () => {
    const response = await fetch(`${API_BASE}/admin/categories`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<{ categories: CategoryWithAgentsDTO[] }>(response);
  },

  updateCategory: async (categoryId: string, description: string | null) => {
    const response = await fetch(`${API_BASE}/admin/categories/${categoryId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ description }),
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(response);
  },

  updateSubcategory: async (
    subcategoryId: string,
    data: { name?: string; description?: string | null }
  ) => {
    const response = await fetch(`${API_BASE}/admin/subcategories/${subcategoryId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(response);
  },

  // Users
  getUsers: async () => {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<{ users: UserDetailDTO[] }>(response);
  },

  createUser: async (data: CreateUserCommand) => {
    const response = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<{ user: UserDetailDTO }>(response);
  },

  updateUser: async (userId: string, data: UpdateUserCommand) => {
    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(response);
  },

  forcePasswordReset: async (userId: string) => {
    const response = await fetch(
      `${API_BASE}/admin/users/${userId}/force-password-reset`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse<{ message: string }>(response);
  },

  // Audit Logs
  getAuditLogs: async (params?: GetAuditLogsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.set('userId', params.userId);
    if (params?.action) queryParams.set('action', params.action);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `${API_BASE}/admin/audit-logs?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse<AuditLogsListDTO>(response);
  },
};
```

---

## 📊 Podsumowanie Batch 6 ✅ ZAKOŃCZONY

### Pliki zmodyfikowane: 1
1. ✅ `app/lib/api-client.ts` - dodano adminApi

### Zaimplementowane funkcjonalności:
- ✅ adminApi.getCategories() - pobieranie kategorii z agentami
- ✅ adminApi.updateCategory() - aktualizacja opisu kategorii
- ✅ adminApi.updateSubcategory() - aktualizacja podkategorii
- ✅ adminApi.getUsers() - pobieranie listy użytkowników
- ✅ adminApi.createUser() - tworzenie nowego użytkownika
- ✅ adminApi.updateUser() - aktualizacja użytkownika
- ✅ adminApi.forcePasswordReset() - wymuszenie resetu hasła
- ✅ adminApi.getAuditLogs() - pobieranie logów z filtrowaniem
- ✅ Wszystkie metody z proper TypeScript typing
- ✅ Obsługa query parameters dla filtrowania
- ✅ Spójny error handling z resztą API

---

## 📊 Podsumowanie Batch 7 ✅ ZAKOŃCZONY

### Pliki utworzone: 2
1. ✅ `app/admin/layout.tsx` - layout dla admin panelu z nawigacją
2. ✅ `app/admin/page.tsx` - redirect na /admin/categories

### Pliki zmodyfikowane: 1
1. ✅ `app/components/DashboardHeader.tsx` - dodano link do admin panelu dla ADMIN

### Zaimplementowane funkcjonalności:
- ✅ Layout z nawigacją między sekcjami admin panelu
- ✅ Sprawdzanie uprawnień (tylko ADMIN może wejść)
- ✅ Link w headerze dla użytkowników z rolą ADMIN
- ✅ Automatyczne przekierowanie z /admin na /admin/categories
- ✅ Responsywny design z Tailwind CSS

---

## 📊 Podsumowanie Batch 8 ✅ ZAKOŃCZONY

### Pliki utworzone: 2
1. ✅ `app/admin/categories/page.tsx` - Server Component z fetch danych
2. ✅ `app/admin/categories/CategoriesAdminClient.tsx` - Client Component

### Zaimplementowane funkcjonalności:
- ✅ Server-side rendering kategorii z agentami i podkategoriami
- ✅ Inline edycja opisów kategorii
- ✅ Inline edycja nazw i opisów podkategorii
- ✅ Wyświetlanie przypisanych agentów
- ✅ Obsługa błędów i komunikatów sukcesu
- ✅ Loading states podczas zapisywania
- ✅ Responsywna tabela dla podkategorii
- ✅ Walidacja danych przed zapisem

---

## 📦 BATCH 7: Frontend - Admin Layout & Navigation (3 zadania)

### Zadanie 7.1: Admin Layout
**Plik:** `app/admin/layout.tsx` (NOWY)

**Funkcjonalność:**
- Layout dla wszystkich stron admin panelu
- Navigation z zakładkami
- Redirect jeśli nie ADMIN

**Kod:**
```typescript
import { redirect } from "next/navigation";
import { getServerSession } from "@/app/lib/supabase-server";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/tickets");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel Administratora</h1>
          <p className="mt-2 text-sm text-gray-600">
            Zarządzaj użytkownikami, kategoriami i monitoruj aktywność systemu
          </p>
        </div>

        {/* Navigation Tabs */}
        {/* ⚠️ TODO: Dodać active state dla aktywnej zakładki */}
        {/* Można użyć usePathname() w Client Component lub stworzyć AdminNav component */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/admin/categories"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Kategorie
            </Link>
            <Link
              href="/admin/users"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Użytkownicy
            </Link>
            <Link
              href="/admin/logs"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Logi Aktywności
            </Link>
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}
```

**⚠️ UWAGA UX:**
- Brak Error Boundary - błąd w dowolnej podstronie /admin/* może zepsuć cały layout
- Rozważyć dodanie Error Boundary w layout lub osobnych dla każdej strony
- Przykład: `<ErrorBoundary fallback={<AdminErrorPage />}>{children}</ErrorBoundary>`

---

### Zadanie 7.2: Admin Navigation Link (DashboardHeader)
**Plik:** `app/components/DashboardHeader.tsx`

**Modyfikacja:** Dodać link do admin panelu dla ADMIN

**Po istniejących linkach:**
```typescript
{session.user.role === 'ADMIN' && (
  <Link
    href="/admin/categories"
    className="text-sm font-medium text-gray-700 hover:text-gray-900"
  >
    Panel Administratora
  </Link>
)}
```

---

### Zadanie 7.3: Redirect - Admin Index Page
**Plik:** `app/admin/page.tsx` (NOWY)

**Funkcjonalność:** Przekierowanie na /admin/categories

**Kod:**
```typescript
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/categories");
}
```

---

## 📦 BATCH 8: Frontend - Categories Management Page (4 zadania)

### Zadanie 8.1: Categories Admin Page (Server Component)
**Plik:** `app/admin/categories/page.tsx` (NOWY)

**Funkcjonalność:**
- Fetch danych po stronie serwera
- Przekazanie do Client Component

**Kod:**
```typescript
import { createSupabaseAdmin } from "@/app/lib/supabase-server";
import { CategoriesAdminClient } from "./CategoriesAdminClient";
import type { CategoryWithAgentsDTO } from "@/src/types";

export default async function AdminCategoriesPage() {
  // Fetch na serwerze dla SSR
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      description,
      created_at,
      subcategories (
        id,
        name,
        category_id,
        description
      ),
      agent_categories (
        id,
        created_at,
        agent:users!agent_categories_agent_id_fkey (
          id,
          name,
          email
        )
      )
    `
    )
    .order("name");

  const categories: CategoryWithAgentsDTO[] = (data || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    createdAt: cat.created_at,
    subcategories: (cat.subcategories || []).map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      categoryId: sub.category_id,
      description: sub.description,
    })),
    agents: (cat.agent_categories || []).map((ac: any) => ({
      id: ac.agent.id,
      name: ac.agent.name,
      email: ac.agent.email,
      assignedAt: ac.created_at,
    })),
  }));

  return <CategoriesAdminClient initialCategories={categories} />;
}
```

---

### Zadanie 8.2: Categories Admin Client Component
**Plik:** `app/admin/categories/CategoriesAdminClient.tsx` (NOWY)

**Funkcjonalność:**
- Wyświetlanie listy kategorii w tabelach/kartach
- Inline edycja opisów
- Modal do edycji podkategorii
- Wyświetlanie przypisanych agentów

**Struktura UI:**
- Dla każdej kategorii: karta z:
  - Nazwa kategorii + edytowalny opis
  - Lista podkategorii (nazwa + opis)
  - Lista przypisanych agentów
  - Przyciski: Zapisz opis

**Kod (szkielet - ~200 linii):**
```typescript
"use client";

import { useState } from "react";
import type { CategoryWithAgentsDTO } from "@/src/types";
import { adminApi } from "@/app/lib/api-client";

interface Props {
  initialCategories: CategoryWithAgentsDTO[];
}

export function CategoriesAdminClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handlers: handleUpdateCategoryDescription, handleUpdateSubcategory, etc.

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id} className="bg-white shadow rounded-lg p-6">
          {/* Category Header */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
            {/* Editable description */}
          </div>

          {/* Subcategories Table */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Podkategorie</h3>
            {/* Table with subcategories */}
          </div>

          {/* Assigned Agents */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Przypisani agenci</h3>
            {/* List of agents */}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 📦 BATCH 9: Frontend - Users Management Page (4 zadania)

### Zadanie 9.1: Users Admin Page (Server Component)
**Plik:** `app/admin/users/page.tsx` (NOWY)

**Podobny do 8.1, fetch users + przekazanie do Client**

---

### Zadanie 9.2: Users Admin Client Component
**Plik:** `app/admin/users/UsersAdminClient.tsx` (NOWY)

**Funkcjonalność:**
- Tabela z użytkownikami (email, nazwa, rola, data utworzenia, statystyki)
- Przycisk "Dodaj użytkownika" → modal
- Akcje dla każdego użytkownika:
  - Edytuj (modal)
  - Wymuś reset hasła
- Filtry: rola, data

**UI Components:**
- UserTable
- CreateUserModal
- EditUserModal

---

### Zadanie 9.3: Create User Modal Component
**Plik:** `app/components/admin/CreateUserModal.tsx` (NOWY)

**Formularz:**
- Email (input)
- Imię i nazwisko (input)
- Rola (select: USER, AGENT, ADMIN)
- Hasło (input + strength indicator)
- Potwierdź hasło (input)

**Walidacja:** Client-side + Zod schema

---

### Zadanie 9.4: Edit User Modal Component
**Plik:** `app/components/admin/EditUserModal.tsx` (NOWY)

**Formularz:**
- Imię i nazwisko (edytowalne)
- Rola (edytowalna)
- Force password change (checkbox)

---

## 📦 BATCH 10: Frontend - Audit Logs Page (2 zadania)

### Zadanie 10.1: Audit Logs Page (Server Component)
**Plik:** `app/admin/logs/page.tsx` (NOWY)

**Fetch initial page + przekazanie do Client**

---

### Zadanie 10.2: Audit Logs Client Component
**Plik:** `app/admin/logs/AuditLogsClient.tsx` (NOWY)

**Funkcjonalność:**
- Tabela z logami (data, użytkownik, akcja, zasób, IP, details)
- Paginacja
- Filtry:
  - Użytkownik (select)
  - Akcja (select)
  - Zakres dat (date pickers)
- Auto-refresh co 30s (opcjonalnie)
- Eksport do CSV (opcjonalnie)

**UI:**
- Tabela responsive
- Badge dla action type
- Expandable row dla details (JSON)

---

## 🎯 Podsumowanie Implementacji

### Łączna liczba zadań: ~35-40

**Batche:**
0. Migracje (3 zadania)
1. Typy & Walidatory (6 zadań)
2. Audit Log Service (3 zadania)
3. Category Management Service (4 zadania)
4. User Management Service (5 zadań)
5. Audit Logs API (1 zadanie)
6. API Client (1 zadanie)
7. Admin Layout (3 zadania)
8. Categories UI (4 zadania)
9. Users UI (4 zadania)
10. Audit Logs UI (2 zadania)

---

## 📋 Testing Checklist

### Categories Management:
- [ ] Admin może zobaczyć wszystkie kategorie z przypisanymi agentami
- [ ] Admin może zaktualizować opis kategorii
- [ ] Admin może zaktualizować nazwę i opis podkategorii
- [ ] Zmiany są logowane w audit_logs
- [ ] Non-admin nie ma dostępu do /admin/categories (403)

### Users Management:
- [ ] Admin może zobaczyć listę wszystkich użytkowników ze statystykami
- [ ] Admin może utworzyć nowego użytkownika
- [ ] Nowy użytkownik ma force_password_change = true
- [ ] Admin może zaktualizować rolę użytkownika
- [ ] Admin może wymusić reset hasła
- [ ] Wszystkie akcje są logowane
- [ ] Walidacja: nie można utworzyć duplikatu email
- [ ] Walidacja: hasło spełnia wymagania bezpieczeństwa

### Audit Logs:
- [ ] Logowania są zapisywane z IP i User Agent
- [ ] Admin może filtrować logi po użytkowniku
- [ ] Admin może filtrować logi po akcji
- [ ] Admin może filtrować logi po dacie
- [ ] Paginacja działa poprawnie
- [ ] Details JSON są poprawnie wyświetlane

### Bezpieczeństwo:
- [ ] Wszystkie endpointy /api/admin/* wymagają roli ADMIN
- [ ] RLS policy na audit_logs pozwala czytać tylko ADMIN
- [ ] Hasła są hashowane przed zapisem
- [ ] Sesja jest wymagana dla wszystkich operacji

---

## 🚀 Sugerowana kolejność wykonania

1. **BATCH 0** - Migracje (najważniejsze, fundament)
2. **BATCH 1** - Typy & Walidatory (bez tego nic nie działa)
3. **BATCH 2** - Audit Log (zacząć logować od razu)
4. **BATCH 3** - Category Management Backend
5. **BATCH 4** - User Management Backend
6. **BATCH 5** - Audit Logs API
7. **BATCH 6** - API Client (frontend będzie potrzebował)
8. **BATCH 7** - Admin Layout (routing)
9. **BATCH 8-10** - UI Pages (można równolegle)

---

## 📝 Uwagi techniczne

### Performance:
- Categories fetch: można cache'ować (revalidate co 5 min)
- Users list: client-side filtering/sorting dla <1000 użytkowników
- Audit logs: zawsze server-side pagination (może być miliony rekordów)

### UX:
- Inline editing dla opisów (lepsze niż modals)
- Toasty dla sukcesu/błędu operacji
- Loading states podczas mutacji
- Optimistic updates gdzie możliwe

### Security:
- Rate limiting na tworzenie użytkowników (max 10/min)
- Audit log jako append-only (brak DELETE)
- IP z `x-forwarded-for` (Vercel proxy)

---

## 🚨 KRYTYCZNE UWAGI I ZAGROŻENIA

### ❌ Security Issues (MUST FIX przed wdrożeniem):

1. **Hasła w Audit Logs** (CRITICAL)
   - **Lokalizacja:** BATCH 4, linia 1113-1125
   - **Problem:** Ryzyko logowania hasła w details
   - **Fix:** ✅ Już poprawione - NIE logować żadnego hasła (plain text ani hash)
   - **Weryfikacja:** Przed merge sprawdzić wszystkie wywołania `AuditLogService.createLog`

2. **Self-Modification** (HIGH)
   - **Lokalizacja:** BATCH 4, linia 1150-1153
   - **Problem:** Admin może zmienić własną rolę → utrata dostępu
   - **Fix:** ✅ Dodano walidację `userId === adminUserId`
   - **Weryfikacja:** Test E2E - admin próbuje zmienić własną rolę (expect 403)

3. **RLS Policy - auth.uid()** (MEDIUM)
   - **Lokalizacja:** BATCH 0, linia 94
   - **Problem:** `auth.uid()` może nie działać w Supabase
   - **Fix:** Przetestować po migracji, ewentualnie użyć Supabase-specific funkcji
   - **Alternatywa:** `current_setting('request.jwt.claims', true)::json->>'sub'`

### ⚠️ Performance & Scalability:

4. **User Statistics Query** (MEDIUM)
   - **Lokalizacja:** BATCH 4, linia 1042-1043
   - **Problem:** Nested count może być wolny dla >1000 użytkowników z tysiącami ticketów
   - **Rozwiązania:**
     - Osobne query z GROUP BY
     - Cache (revalidate co 5 min)
     - Denormalizacja (counters table)
   - **Priority:** Zaimplementować jeśli performance test pokaże >2s response time

5. **Foreign Key Names** (LOW-MEDIUM)
   - **Lokalizacja:** BATCH 3, linia 760, 1520
   - **Problem:** Nazwa `agent_categories_agent_id_fkey` może się różnić w Supabase
   - **Fix:** Zweryfikować w Supabase Studio lub przez SQL query przed wdrożeniem
   - **Query:** `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'agent_categories';`

### 🎨 UX/UI Improvements:

6. **Active State Navigation** (LOW)
   - **Lokalizacja:** BATCH 7, linia 1538-1539
   - **Problem:** Brak visual indicator aktywnej zakładki
   - **Fix:** Użyć `usePathname()` w Client Component lub dedykowany AdminNav
   - **Priority:** Nice-to-have, nie blokuje MVP

7. **Error Boundaries** (MEDIUM)
   - **Lokalizacja:** BATCH 7, linia 1570-1573
   - **Problem:** Brak Error Boundary → błąd w child może crashnąć cały admin panel
   - **Fix:** Dodać React Error Boundary w AdminLayout
   - **Priority:** Powinno być przed produkcją

8. **Missing Code** (HIGH)
   - **Lokalizacja:** BATCH 3, Zadanie 3.4
   - **Problem:** Brak pełnego kodu dla update subcategory endpoint
   - **Fix:** ✅ Dodano pełny szkielet kodu w planie
   - **Action:** Skopiować i dostosować podczas implementacji

### 🔐 Security Best Practices (Recommended):

9. **Rate Limiting dla Admin Endpoints**
   - Obecnie brak rate limiting na /api/admin/*
   - Rekomendacja: max 10 użytkowników/min, max 100 requests/min ogólnie
   - Można użyć istniejącego rate-limitera lub middleware

10. **Audit Log Retention**
    - Plan nie definiuje polityki retencji logów
    - Rekomendacja: Dodać partycjonowanie lub archiwizację po 12 miesiącach
    - Opcjonalnie: Cleanup job dla starszych logów

### 📋 Przed Wdrożeniem - Pre-Deploy Checklist:

- [ ] 🚨 Zweryfikować brak hasła w audit logs (search codebase: `password`)
- [ ] 🚨 Przetestować self-modification protection (E2E test)
- [ ] ⚠️ Zweryfikować foreign key names w Supabase
- [ ] ⚠️ Przetestować RLS policy dla audit_logs
- [ ] ⚠️ Performance test: user list z >100 użytkowników
- [ ] 🎨 Dodać Error Boundary w AdminLayout
- [ ] 🎨 Dodać active state dla navigation tabs
- [ ] 🔐 Rozważyć rate limiting dla admin endpoints
- [ ] 📝 Uzupełnić kod dla Zadania 3.4 (update subcategory)

---

**Data utworzenia:** 2025-10-22  
**Ostatnia aktualizacja:** 2025-10-22 (dodano sekcję: Krytyczne Uwagi i Zagrożenia)  
**Autor planu:** AI Agent (Claude Sonnet 4.5)  
**Bazując na:** Grupa 2 Implementation (@todo-group2-implementation.md)

