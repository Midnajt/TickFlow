# 📊 TickFlow - Plan Migracji Bazy Danych

**Dokument:** Database Migrations Technical Plan
**Data:** Październik 2025
**Status:** Ready for Implementation
**Docelowa Wersja DB:** PostgreSQL 14+ (Supabase)

---

## 📋 Spis Treści

1. [Streszczenie Zmian](#streszczenie-zmian)
2. [Migracje SQL](#migracje-sql)
3. [Aktualizacje Prisma Schema](#aktualizacje-prisma-schema)
4. [Kroki Wdrażania](#kroki-wdrażania)
5. [Rollback Strategy](#rollback-strategy)
6. [Walidacja i Testy](#walidacja-i-testy)

---

## 🎯 Streszczenie Zmian

### Nowe Tabele (3)

| Tabela | Przeznaczenie | Kolumny | Keys |
|--------|---------------|---------|------|
| `audit_logs` | Logowanie akcji admina | id, user_id, action, resource, resourceId, changes, ipAddress, userAgent, createdAt | PK: id, FK: user_id, Indexes: (user_id, created_at), (resource, created_at) |
| `login_logs` | Historia logowań | id, user_id, email, success, failureReason, ipAddress, userAgent, createdAt | PK: id, FK: user_id, Indexes: (user_id, created_at), (success, created_at) |
| `ai_suggestions_log` | Log sugestii AI | id, user_id, ticket_id, userInput, aiSuggestion, wasApplied, appliedAt, createdAt | PK: id, FK: user_id, ticket_id, Indexes: (user_id, created_at), (was_applied) |

### Modyfikacje Istniejących Tabel (3)

| Tabela | Kolumny | Typ | Nullable | Default |
|--------|---------|-----|----------|---------|
| `categories` | `ai_description` | TEXT | ✅ | NULL |
| `categories` | `ai_context` | JSONB | ✅ | NULL |
| `tickets` | `reopened_count` | INT | ❌ | 0 |
| `tickets` | `reopened_at` | TIMESTAMP | ✅ | NULL |
| `tickets` | `transferred_from_id` | UUID | ✅ | NULL |

---

## 💾 Migracje SQL

### Migration #1: Utwórz Tabelę Audit Logs

**Plik:** `supabase/migrations/20251021_create_audit_logs.sql`

```sql
-- Create enum for audit actions
CREATE TYPE audit_action_type AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGIN_FAILED',
  'FORCE_PASSWORD_RESET',
  'ASSIGN_TICKET',
  'TRANSFER_TICKET',
  'REOPEN_TICKET',
  'CLOSE_TICKET'
);

-- Create enum for resource types
CREATE TYPE audit_resource_type AS ENUM (
  'USER',
  'CATEGORY',
  'SUBCATEGORY',
  'TICKET',
  'AGENT_CATEGORY'
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action audit_action_type NOT NULL,
  resource audit_resource_type NOT NULL,
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_resource_created ON audit_logs(resource, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can read audit logs
CREATE POLICY audit_logs_admin_read ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policy: System can insert audit logs
CREATE POLICY audit_logs_system_insert ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Prevent deletion/update for immutability
CREATE POLICY audit_logs_no_delete ON audit_logs
  FOR DELETE USING (false);

CREATE POLICY audit_logs_no_update ON audit_logs
  FOR UPDATE USING (false);

COMMENT ON TABLE audit_logs IS 'Immutable audit log for all admin and security-related actions';
COMMENT ON COLUMN audit_logs.id IS 'Unique identifier';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.resource IS 'Type of resource affected';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values (for UPDATE)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values (for CREATE/UPDATE)';
COMMENT ON COLUMN audit_logs.changes IS 'Detailed diff of changes';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the client';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string';
```

---

### Migration #2: Utwórz Tabelę Login Logs

**Plik:** `supabase/migrations/20251021_create_login_logs.sql`

```sql
-- Create login_logs table
CREATE TABLE login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_user_created ON login_logs(user_id, created_at DESC);
CREATE INDEX idx_login_logs_email ON login_logs(email);
CREATE INDEX idx_login_logs_success ON login_logs(success);
CREATE INDEX idx_login_logs_success_created ON login_logs(success, created_at DESC);
CREATE INDEX idx_login_logs_created ON login_logs(created_at DESC);

-- Enable RLS
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can read login logs
CREATE POLICY login_logs_admin_read ON login_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policy: System can insert login logs
CREATE POLICY login_logs_system_insert ON login_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Prevent deletion/update for immutability
CREATE POLICY login_logs_no_delete ON login_logs
  FOR DELETE USING (false);

CREATE POLICY login_logs_no_update ON login_logs
  FOR UPDATE USING (false);

COMMENT ON TABLE login_logs IS 'Immutable log of all login attempts (successful and failed)';
COMMENT ON COLUMN login_logs.id IS 'Unique identifier';
COMMENT ON COLUMN login_logs.user_id IS 'User who attempted login (NULL if user not found)';
COMMENT ON COLUMN login_logs.email IS 'Email address used for login';
COMMENT ON COLUMN login_logs.success IS 'Whether login was successful';
COMMENT ON COLUMN login_logs.failure_reason IS 'Reason for login failure (invalid_credentials, user_not_found, etc)';
COMMENT ON COLUMN login_logs.ip_address IS 'IP address of the client';
COMMENT ON COLUMN login_logs.user_agent IS 'User agent string';
```

---

### Migration #3: Utwórz Tabelę AI Suggestions Log

**Plik:** `supabase/migrations/20251021_create_ai_suggestions_log.sql`

```sql
-- Create ai_suggestions_log table
CREATE TABLE ai_suggestions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  user_input TEXT NOT NULL,
  ai_suggestion JSONB NOT NULL,
  was_applied BOOLEAN,
  applied_at TIMESTAMP WITH TIME ZONE,
  applied_category_id VARCHAR(255),
  applied_subcategory_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions_log(user_id);
CREATE INDEX idx_ai_suggestions_user_created ON ai_suggestions_log(user_id, created_at DESC);
CREATE INDEX idx_ai_suggestions_ticket_id ON ai_suggestions_log(ticket_id);
CREATE INDEX idx_ai_suggestions_was_applied ON ai_suggestions_log(was_applied);
CREATE INDEX idx_ai_suggestions_was_applied_created ON ai_suggestions_log(was_applied, created_at DESC);
CREATE INDEX idx_ai_suggestions_created ON ai_suggestions_log(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_suggestions_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_suggestions_log_updated_at
  BEFORE UPDATE ON ai_suggestions_log
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_suggestions_log_updated_at();

-- Enable RLS
ALTER TABLE ai_suggestions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own logs, admins can read all
CREATE POLICY ai_suggestions_log_read ON ai_suggestions_log
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policy: System can insert
CREATE POLICY ai_suggestions_log_insert ON ai_suggestions_log
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Only admins can update (to mark as applied)
CREATE POLICY ai_suggestions_log_update ON ai_suggestions_log
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policy: Prevent deletion
CREATE POLICY ai_suggestions_log_no_delete ON ai_suggestions_log
  FOR DELETE USING (false);

COMMENT ON TABLE ai_suggestions_log IS 'Log of all AI suggestion requests and whether they were applied';
COMMENT ON COLUMN ai_suggestions_log.id IS 'Unique identifier';
COMMENT ON COLUMN ai_suggestions_log.user_id IS 'User who requested the suggestion';
COMMENT ON COLUMN ai_suggestions_log.ticket_id IS 'Ticket created from this suggestion (if applied)';
COMMENT ON COLUMN ai_suggestions_log.user_input IS 'Raw user input to AI model';
COMMENT ON COLUMN ai_suggestions_log.ai_suggestion IS 'Full AI response as JSON';
COMMENT ON COLUMN ai_suggestions_log.was_applied IS 'Whether user applied this suggestion';
COMMENT ON COLUMN ai_suggestions_log.applied_at IS 'When the suggestion was applied';
COMMENT ON COLUMN ai_suggestions_log.applied_category_id IS 'Category ID that was selected (from suggestion or user choice)';
COMMENT ON COLUMN ai_suggestions_log.applied_subcategory_id IS 'Subcategory ID that was selected (from suggestion or user choice)';
```

---

### Migration #4: Modyfikuj Tabelę Categories

**Plik:** `supabase/migrations/20251021_alter_categories_add_ai_fields.sql`

```sql
-- Add AI description fields to categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS ai_description TEXT,
  ADD COLUMN IF NOT EXISTS ai_context JSONB;

-- Create indexes for AI context searches
CREATE INDEX IF NOT EXISTS idx_categories_ai_description ON categories USING GIN (
  to_tsvector('polish', ai_description)
) WHERE ai_description IS NOT NULL;

COMMENT ON COLUMN categories.ai_description IS 'AI-friendly description of the category for ML models';
COMMENT ON COLUMN categories.ai_context IS 'Additional context for AI classification (keywords, examples, etc)';

-- Example AI context structure:
-- {
--   "keywords": ["hardware", "computer", "laptop", "printer"],
--   "examples": ["My mouse is not working", "Printer is offline"],
--   "exclusions": ["Software issues"],
--   "supportedLanguages": ["pl", "en"],
--   "sla_hours": 4
-- }
```

---

### Migration #5: Modyfikuj Tabelę Tickets

**Plik:** `supabase/migrations/20251021_alter_tickets_add_tracking_fields.sql`

```sql
-- Add tracking fields for ticket operations
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS reopened_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS transferred_from_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_tickets_reopened_at ON tickets(reopened_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_transferred_from_id ON tickets(transferred_from_id);

-- Update existing tickets to have correct reopened_count (should be 0)
UPDATE tickets SET reopened_count = 0 WHERE reopened_count IS NULL;

-- Make reopened_count NOT NULL
ALTER TABLE tickets
  ALTER COLUMN reopened_count SET NOT NULL;

COMMENT ON COLUMN tickets.reopened_count IS 'Number of times this ticket has been reopened';
COMMENT ON COLUMN tickets.reopened_at IS 'Timestamp when ticket was last reopened';
COMMENT ON COLUMN tickets.transferred_from_id IS 'User ID of agent who transferred this ticket (for audit trail)';
```

---

## 📝 Aktualizacje Prisma Schema

### Nowe Modele (Dodaj do `prisma/schema.prisma`)

```prisma
// ============================================================================
// AUDIT & LOGGING MODELS
// ============================================================================

enum AuditActionType {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGIN_FAILED
  FORCE_PASSWORD_RESET
  ASSIGN_TICKET
  TRANSFER_TICKET
  REOPEN_TICKET
  CLOSE_TICKET
}

enum AuditResourceType {
  USER
  CATEGORY
  SUBCATEGORY
  TICKET
  AGENT_CATEGORY
}

model AuditLog {
  id            String              @id @default(cuid())
  userId        String              @map("user_id")
  user          User                @relation("AuditLogs", fields: [userId], references: [id], onDelete: Cascade)
  action        AuditActionType
  resource      AuditResourceType
  resourceId    String?             @map("resource_id") @db.VarChar(255)
  oldValues     Json?               @map("old_values")
  newValues     Json?               @map("new_values")
  changes       Json?
  ipAddress     String?             @map("ip_address") @db.Inet
  userAgent     String?             @map("user_agent")
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([userId, createdAt])
  @@index([resource, resourceId])
  @@index([action, createdAt])
  @@index([createdAt])
  @@map("audit_logs")
}

model LoginLog {
  id            String              @id @default(cuid())
  userId        String?             @map("user_id")
  user          User?               @relation("LoginLogs", fields: [userId], references: [id], onDelete: SetNull)
  email         String              @db.VarChar(255)
  success       Boolean
  failureReason String?             @map("failure_reason") @db.VarChar(255)
  ipAddress     String?             @map("ip_address") @db.Inet
  userAgent     String?             @map("user_agent")
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([userId, createdAt])
  @@index([email])
  @@index([success])
  @@index([success, createdAt])
  @@index([createdAt])
  @@map("login_logs")
}

model AiSuggestionLog {
  id                    String              @id @default(cuid())
  userId                String              @map("user_id")
  user                  User                @relation("AiSuggestionLogs", fields: [userId], references: [id], onDelete: Cascade)
  ticketId              String?             @map("ticket_id")
  ticket                Ticket?             @relation("AiSuggestionLogs", fields: [ticketId], references: [id], onDelete: SetNull)
  userInput             String
  aiSuggestion          Json                @map("ai_suggestion")
  wasApplied            Boolean?            @map("was_applied")
  appliedAt             DateTime?           @map("applied_at") @db.Timestamptz(6)
  appliedCategoryId     String?             @map("applied_category_id") @db.VarChar(255)
  appliedSubcategoryId  String?             @map("applied_subcategory_id") @db.VarChar(255)
  createdAt             DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([userId, createdAt])
  @@index([ticketId])
  @@index([wasApplied])
  @@index([wasApplied, createdAt])
  @@index([createdAt])
  @@map("ai_suggestions_log")
}

// ============================================================================
// UPDATED MODELS
// ============================================================================

// Update User model - dodaj relacje do logów
model User {
  // ... existing fields ...
  
  auditLogs         AuditLog[]          @relation("AuditLogs")
  loginLogs         LoginLog[]          @relation("LoginLogs")
  aiSuggestionLogs  AiSuggestionLog[]   @relation("AiSuggestionLogs")
  transferredTickets Ticket[]           @relation("TransferredTickets")
}

// Update Category model - dodaj AI pola
model Category {
  // ... existing fields ...
  
  aiDescription String?
  aiContext     Json?
  
  @@map("categories")
}

// Update Ticket model - dodaj pola do śledzenia
model Ticket {
  // ... existing fields ...
  
  reopenedCount     Int                  @default(0) @map("reopened_count")
  reopenedAt        DateTime?            @map("reopened_at") @db.Timestamptz(6)
  transferredFromId String?              @map("transferred_from_id")
  transferredFrom   User?                @relation("TransferredTickets", fields: [transferredFromId], references: [id], onDelete: SetNull)
  
  aiSuggestionLogs  AiSuggestionLog[]   @relation("AiSuggestionLogs")
  
  @@index([reopenedAt])
  @@index([transferredFromId])
  @@map("tickets")
}
```

---

## 🚀 Kroki Wdrażania

### Krok 1: Przygotowanie (Dev Environment)

```bash
# 1.1 Utwórz gałąź
git checkout -b feature/admin-panel-migrations
git pull origin develop

# 1.2 Dodaj pliki migracji
touch supabase/migrations/20251021_create_audit_logs.sql
touch supabase/migrations/20251021_create_login_logs.sql
touch supabase/migrations/20251021_create_ai_suggestions_log.sql
touch supabase/migrations/20251021_alter_categories_add_ai_fields.sql
touch supabase/migrations/20251021_alter_tickets_add_tracking_fields.sql

# 1.3 Skopiuj zawartość SQL z powyższych definicji do plików
```

### Krok 2: Aktualizacja Prisma Schema

```bash
# 2.1 Edytuj prisma/schema.prisma - dodaj nowe modele (patrz wyżej)

# 2.2 Wygeneruj Prisma Client
npx prisma generate

# 2.3 Format kodu
npx prisma format
```

### Krok 3: Testowanie Lokalnie (Supabase Local)

```bash
# 3.1 Uruchom Supabase locally (jeśli używasz)
supabase start

# 3.2 Push migracji na lokalne Supabase
supabase db push

# 3.3 Zweryfikuj nowe tabele
supabase db pull

# 3.4 Sprawdź czy schema.prisma został zaktualizowany
# (powinny być nowe tabele widoczne)
```

### Krok 4: Tworzenie Seed Scripts (Opcjonalnie)

```bash
# 4.1 Stwórz seed data dla testowania
cat > scripts/seed-audit-logs.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed example audit logs for testing
  console.log('Seeding audit logs...')
  // ... implementation ...
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
EOF
```

### Krok 5: Deployment na Staging (Vercel Preview)

```bash
# 5.1 Push do feature branch
git add supabase/migrations/ prisma/schema.prisma
git commit -m "feat: add admin panel database schema (audit logs, user management)"
git push origin feature/admin-panel-migrations

# 5.2 Vercel automatycznie uruchomi preview
# - Pull Request zostanie stworzony
# - Vercel będzie śledzić migracje

# 5.3 Na Vercel - uruchom Prisma migrate
# (zazwyczaj automatycznie przez build hook)
```

### Krok 6: Deployment na Production

```bash
# 6.1 Code review + approval
# - Przejrzyj SQL
# - Przejrzyj Prisma schema
# - Sprawdź backward compatibility

# 6.2 Merge PR do main
git checkout main
git pull
git merge feature/admin-panel-migrations
git push

# 6.3 Vercel automatycznie deployuje
# - Migracje będą uruchomione przed build
# - Rollback jest dostępny z Supabase backup

# 6.4 Verify na produkcji
```

---

## ⏮️ Rollback Strategy

### Scenariusz 1: Błąd przed Merge'em

```sql
-- Anuluj migracje lokalnie
supabase db reset

-- Lub ręcznie dropnij tabele
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS login_logs CASCADE;
DROP TABLE IF EXISTS ai_suggestions_log CASCADE;
DROP TYPE IF EXISTS audit_action_type;
DROP TYPE IF EXISTS audit_resource_type;

-- Cofnij zmiany w istniejących tabelach
ALTER TABLE categories DROP COLUMN IF EXISTS ai_description;
ALTER TABLE categories DROP COLUMN IF EXISTS ai_context;
ALTER TABLE tickets DROP COLUMN IF EXISTS reopened_count;
ALTER TABLE tickets DROP COLUMN IF EXISTS reopened_at;
ALTER TABLE tickets DROP COLUMN IF EXISTS transferred_from_id;
```

### Scenariusz 2: Błąd na Produkcji (Wczesna Faza)

```bash
# Na Vercel:
# 1. Wejdź do Deployment Settings
# 2. Wybierz ostatnie working deployment
# 3. Kliknij "Redeploy"

# Na Supabase:
# 1. Wejdź do Settings > Backups
# 2. Restoruj backup sprzed wdrażania
# 3. RLS policies będą przywrócone
```

### Scenariusz 3: Błąd w Aplikacji (Po Deployment)

```bash
# Jeśli aplikacja się wyłamała:
# 1. Revert Prisma Client
npm install --save-exact @prisma/client@<prev-version>
git revert HEAD~1
git push

# 2. Supabase - data jest bezpieczna
# (rollback nie potrzebny jeśli to jest kod, nie DB)

# 3. Po naprawie:
npm install @prisma/client@latest
git push (fixed version)
```

---

## 🧪 Walidacja i Testy

### Testy Bazy Danych

```typescript
// tests/integration/database.test.ts

describe('Database Migrations', () => {
  describe('Audit Logs', () => {
    it('should create audit log with all fields', async () => {
      const log = await prisma.auditLog.create({
        data: {
          userId: 'test-user-id',
          action: 'CREATE',
          resource: 'TICKET',
          resourceId: 'ticket-123',
          changes: { status: { old: 'OPEN', new: 'IN_PROGRESS' } },
          ipAddress: '127.0.0.1'
        }
      })
      
      expect(log.id).toBeDefined()
      expect(log.createdAt).toBeInstanceOf(Date)
    })

    it('should prevent audit log deletion via RLS', async () => {
      // RLS policy should prevent this
      expect(() => prisma.auditLog.delete({ where: { id: '...' } }))
        .rejects.toThrow()
    })
  })

  describe('Login Logs', () => {
    it('should log successful login', async () => {
      const log = await prisma.loginLog.create({
        data: {
          email: 'test@example.com',
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        }
      })
      
      expect(log.success).toBe(true)
    })

    it('should log failed login attempt', async () => {
      const log = await prisma.loginLog.create({
        data: {
          email: 'test@example.com',
          success: false,
          failureReason: 'invalid_credentials',
          ipAddress: '192.168.1.2'
        }
      })
      
      expect(log.success).toBe(false)
      expect(log.failureReason).toBe('invalid_credentials')
    })
  })

  describe('Categories AI Fields', () => {
    it('should support ai_description and ai_context', async () => {
      const category = await prisma.category.update({
        where: { id: 'hardware-id' },
        data: {
          aiDescription: 'Hardware issues including computers, printers, monitors',
          aiContext: {
            keywords: ['hardware', 'computer', 'printer'],
            examples: ['My mouse is not working'],
            sla_hours: 4
          }
        }
      })
      
      expect(category.aiDescription).toBeDefined()
      expect(category.aiContext).toBeDefined()
    })
  })

  describe('Tickets Tracking Fields', () => {
    it('should track ticket reopens', async () => {
      const ticket = await prisma.ticket.update({
        where: { id: 'ticket-123' },
        data: {
          reopenedCount: 1,
          reopenedAt: new Date(),
          status: 'OPEN'
        }
      })
      
      expect(ticket.reopenedCount).toBe(1)
      expect(ticket.reopenedAt).toBeInstanceOf(Date)
    })

    it('should track ticket transfers', async () => {
      const ticket = await prisma.ticket.update({
        where: { id: 'ticket-123' },
        data: {
          transferredFromId: 'agent-1-id',
          assignedToId: 'agent-2-id'
        }
      })
      
      expect(ticket.transferredFromId).toBe('agent-1-id')
    })
  })
})
```

### Testy Integracyjne API

```typescript
// tests/integration/api/admin-audit.test.ts

describe('Admin Audit Logs API', () => {
  it('POST /api/admin/audit-logs should log action', async () => {
    const response = await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE',
        resource: 'CATEGORY',
        resourceId: 'cat-123',
        changes: { description: { old: 'Old', new: 'New' } }
      })
    })
    
    expect(response.status).toBe(201)
  })

  it('GET /api/admin/audit-logs should return filtered logs', async () => {
    const response = await fetch(
      '/api/admin/audit-logs?resource=CATEGORY&action=UPDATE'
    )
    
    const logs = await response.json()
    expect(logs).toBeInstanceOf(Array)
  })
})
```

### Performance Tests

```typescript
// tests/performance/database.perf.ts

describe('Database Performance', () => {
  it('should query 1000 audit logs in <500ms', async () => {
    const start = performance.now()
    
    await prisma.auditLog.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' }
    })
    
    const duration = performance.now() - start
    expect(duration).toBeLessThan(500)
  })

  it('should query login logs with multiple filters in <200ms', async () => {
    const start = performance.now()
    
    await prisma.loginLog.findMany({
      where: {
        success: false,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    const duration = performance.now() - start
    expect(duration).toBeLessThan(200)
  })
})
```

---

## ✅ Checklist Pre-Deployment

- [ ] Wszystkie SQL migracje są syntaktycznie poprawne
- [ ] Prisma schema została zaktualizowana
- [ ] Testy bazy danych przechodzą lokalnie
- [ ] `npx prisma generate` wyprodukował poprawny Client
- [ ] RLS policies są testowane i działają
- [ ] Indexes są na odpowiednich kolumnach
- [ ] Comentarze w SQL są jasne
- [ ] Enum types mają sensowne wartości
- [ ] Relacje Foreign Key są poprawne
- [ ] Backup został wykonany na produkcji
- [ ] Rollback strategy jest udokumentowana
- [ ] Code review został zatwierdzony
- [ ] E2E testy przechodzą na staging

---

## 📊 Monitoring Post-Deployment

### Metryki do Monitorowania

```bash
# 1. Tabela sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# 2. Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

# 3. Query performance
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%audit%'
ORDER BY mean_exec_time DESC;
```

### Alerting

- 🔴 If query time > 1000ms
- 🟡 If table size > 1GB
- 🟡 If RLS policy denies >5% of queries

---

**Dokument Zaktualizowany:** 2025-10-21
**Wersja:** 1.0 - Initial Plan
**Status:** ✅ Ready for Implementation
