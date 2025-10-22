/**
 * Script do wyświetlania migracji SQL dla Supabase
 * 
 * Użycie:
 * npm run migrate:audit-logs
 * 
 * lub pokaż wszystkie:
 * npm run migrate -- all
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Załaduj zmienne środowiskowe
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Wyświetla migrację SQL do skopiowania
 */
function showMigration(filename: string): void {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', filename);
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Plik migracji nie istnieje: ${migrationPath}`);
  }

  console.log(`\n📄 Migracja: ${filename}`);
  console.log('━'.repeat(80));
  
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('\n📋 INSTRUKCJA:');
  console.log('1. Otwórz: https://app.supabase.com → Twój projekt → SQL Editor');
  console.log('2. Kliknij "+ New query"');
  console.log('3. Skopiuj i wklej poniższy kod SQL:');
  console.log('4. Kliknij "Run" (lub Ctrl+Enter)');
  console.log('5. Zweryfikuj w "Table Editor" czy tabela została utworzona');
  
  console.log('\n📝 KOD SQL DO SKOPIOWANIA:');
  console.log('━'.repeat(80));
  console.log(sqlContent);
  console.log('━'.repeat(80));
  
  console.log('\n✅ Po wykonaniu SQL powyżej, migracja będzie zakończona!');
}

/**
 * Pobiera listę wszystkich migracji z folderu
 */
function getAllMigrations(): string[] {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Folder migracji nie istnieje: ${migrationsDir}`);
  }

  return fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sortuj chronologicznie po nazwie
}

/**
 * Główna funkcja
 */
function main() {
  const args = process.argv.slice(2);
  
  console.log('🚀 TickFlow Migration Helper');
  console.log('━'.repeat(80));
  if (SUPABASE_URL) {
    console.log(`📡 Projekt Supabase: ${SUPABASE_URL}`);
  }
  
  try {
    if (args.length === 0) {
      // Brak argumentów - pokaż pomoc
      console.log('\n📖 Użycie:');
      console.log('  npm run migrate:audit-logs   (migracja audit_logs)');
      console.log('  npm run migrate -- all       (pokaż wszystkie migracje)');
      console.log('  npm run migrate -- <nazwa>   (konkretna migracja)');
      console.log('\n📋 Dostępne migracje:');
      getAllMigrations().forEach(file => {
        console.log(`  - ${file}`);
      });
      return;
    }

    if (args[0] === 'all' || args[0] === '--all') {
      // Pokaż wszystkie migracje
      const migrations = getAllMigrations();
      console.log(`\n📋 Znaleziono ${migrations.length} migracji`);
      
      for (const migration of migrations) {
        showMigration(migration);
        console.log('\n' + '═'.repeat(80) + '\n');
      }
      
      console.log('✨ To wszystkie dostępne migracje!');
    } else {
      // Pokaż konkretną migrację
      let filename = args[0];
      if (!filename.endsWith('.sql')) {
        filename += '.sql';
      }
      
      showMigration(filename);
    }
  } catch (error) {
    console.error('\n💥 Wystąpił błąd:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

