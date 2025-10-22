/**
 * Script do weryfikacji foreign key names w Supabase
 * 
 * Użycie:
 * 1. Upewnij się, że masz skonfigurowane w .env.local:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 2. Uruchom: npm run verify:foreign-keys
 * 
 * Ten script sprawdzi, czy nazwy foreign keys użyte w kodzie są poprawne.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Załaduj zmienne środowiskowe z .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Brak zmiennych środowiskowych w .env.local");
  console.error("   Wymagane:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Foreign keys używane w kodzie aplikacji
 * Format: { table: "nazwa_tabeli", fkey: "nazwa_foreign_key" }
 */
const EXPECTED_FOREIGN_KEYS = [
  {
    table: "agent_categories",
    fkey: "agent_categories_agent_id_fkey",
    column: "agent_id",
    referencedTable: "users",
  },
  {
    table: "audit_logs",
    fkey: "audit_logs_user_id_fkey",
    column: "user_id",
    referencedTable: "users",
  },
  {
    table: "tickets",
    fkey: "tickets_created_by_id_fkey",
    column: "created_by_id",
    referencedTable: "users",
  },
  {
    table: "tickets",
    fkey: "tickets_assigned_to_id_fkey",
    column: "assigned_to_id",
    referencedTable: "users",
  },
];

async function verifyForeignKeys() {
  console.log("🔍 Weryfikacja foreign key names w Supabase...\n");

  let allCorrect = true;

  for (const expected of EXPECTED_FOREIGN_KEYS) {
    console.log(`Sprawdzam: ${expected.table}.${expected.column} -> ${expected.referencedTable}`);

    // Query to sprawdza foreign keys w Supabase
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT 
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = '${expected.table}'
          AND kcu.column_name = '${expected.column}';
      `,
    });

    if (error) {
      console.error(`  ❌ Błąd zapytania: ${error.message}`);
      allCorrect = false;
      continue;
    }

    if (!data || data.length === 0) {
      console.warn(`  ⚠️  Nie znaleziono foreign key dla ${expected.table}.${expected.column}`);
      allCorrect = false;
      continue;
    }

    const actualFkeyName = data[0].constraint_name;

    if (actualFkeyName === expected.fkey) {
      console.log(`  ✅ Poprawna nazwa: ${actualFkeyName}`);
    } else {
      console.error(`  ❌ NIEPOPRAWNA nazwa!`);
      console.error(`     Oczekiwano: ${expected.fkey}`);
      console.error(`     Znaleziono: ${actualFkeyName}`);
      console.error(`     Zaktualizuj kod w następujących lokalizacjach:`);
      
      // Znajdź pliki, które używają tej foreign key
      if (expected.fkey.includes("agent_categories")) {
        console.error(`       - app/lib/services/categories/category-admin.service.ts`);
        console.error(`       - app/admin/categories/page.tsx`);
      } else if (expected.fkey.includes("audit_logs")) {
        console.error(`       - app/admin/logs/page.tsx`);
      } else if (expected.fkey.includes("tickets")) {
        console.error(`       - app/lib/services/users/user-admin.service.ts`);
        console.error(`       - app/admin/users/page.tsx`);
      }

      allCorrect = false;
    }

    console.log();
  }

  if (allCorrect) {
    console.log("✅ Wszystkie foreign key names są poprawne!");
  } else {
    console.log("❌ Znaleziono niepoprawne foreign key names. Zaktualizuj kod.");
    process.exit(1);
  }
}

// Alternatywna metoda - bez rpc
async function verifyForeignKeysAlternative() {
  console.log("🔍 Weryfikacja foreign key names przez testowanie queries...\n");

  let allCorrect = true;

  // Test 1: agent_categories
  console.log("Test 1: agent_categories_agent_id_fkey");
  try {
    const { error } = await supabase
      .from("agent_categories")
      .select("agent:users!agent_categories_agent_id_fkey(id)")
      .limit(1);

    if (error) {
      console.error(`  ❌ Błąd: ${error.message}`);
      console.error(`     Foreign key name prawdopodobnie niepoprawny!`);
      allCorrect = false;
    } else {
      console.log(`  ✅ Nazwa poprawna`);
    }
  } catch (err) {
    console.error(`  ❌ Wyjątek: ${err}`);
    allCorrect = false;
  }

  // Test 2: audit_logs
  console.log("\nTest 2: audit_logs_user_id_fkey");
  try {
    const { error } = await supabase
      .from("audit_logs")
      .select("user:users!audit_logs_user_id_fkey(id)")
      .limit(1);

    if (error) {
      console.error(`  ❌ Błąd: ${error.message}`);
      console.error(`     Foreign key name prawdopodobnie niepoprawny!`);
      allCorrect = false;
    } else {
      console.log(`  ✅ Nazwa poprawna`);
    }
  } catch (err) {
    console.error(`  ❌ Wyjątek: ${err}`);
    allCorrect = false;
  }

  // Test 3: tickets created_by
  console.log("\nTest 3: tickets_created_by_id_fkey");
  try {
    const { error } = await supabase
      .from("tickets")
      .select("creator:users!tickets_created_by_id_fkey(id)")
      .limit(1);

    if (error) {
      console.error(`  ❌ Błąd: ${error.message}`);
      console.error(`     Foreign key name prawdopodobnie niepoprawny!`);
      allCorrect = false;
    } else {
      console.log(`  ✅ Nazwa poprawna`);
    }
  } catch (err) {
    console.error(`  ❌ Wyjątek: ${err}`);
    allCorrect = false;
  }

  // Test 4: tickets assigned_to
  console.log("\nTest 4: tickets_assigned_to_id_fkey");
  try {
    const { error } = await supabase
      .from("tickets")
      .select("assignee:users!tickets_assigned_to_id_fkey(id)")
      .limit(1);

    if (error) {
      console.error(`  ❌ Błąd: ${error.message}`);
      console.error(`     Foreign key name prawdopodobnie niepoprawny!`);
      allCorrect = false;
    } else {
      console.log(`  ✅ Nazwa poprawna`);
    }
  } catch (err) {
    console.error(`  ❌ Wyjątek: ${err}`);
    allCorrect = false;
  }

  console.log();

  if (allCorrect) {
    console.log("✅ Wszystkie foreign key names działają poprawnie!");
  } else {
    console.log("❌ Znaleziono problemy z foreign key names. Sprawdź logi powyżej.");
    process.exit(1);
  }
}

// Uruchom weryfikację
console.log("================================");
console.log("Foreign Key Verification Script");
console.log("================================\n");

verifyForeignKeysAlternative()
  .then(() => {
    console.log("\n✅ Weryfikacja zakończona.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Błąd weryfikacji:", err);
    process.exit(1);
  });

