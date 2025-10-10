import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../app/lib/database.types';

// Załaduj zmienne środowiskowe z .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Kategorie z podkategoriami (zgodnie z PRD)
const categoriesWithSubcategories = [
  {
    name: 'Hardware',
    description: 'Problemy sprzętowe - komputery, drukarki, monitory',
    subcategories: [
      'Komputer/Laptop',
      'Drukarka',
      'Monitor',
      'Akcesoria (mysz, klawiatura)',
      'Inne',
    ],
  },
  {
    name: 'Software',
    description: 'Problemy z oprogramowaniem - instalacja, aktualizacje, licencje',
    subcategories: [
      'Instalacja programu',
      'Problem z aplikacją',
      'Licencje',
      'Aktualizacje',
      'Inne',
    ],
  },
  {
    name: 'Network',
    description: 'Problemy z siecią - internet, VPN, WiFi',
    subcategories: [
      'Brak internetu',
      'Wolne WiFi',
      'VPN',
      'Dostęp do serwera',
      'Inne',
    ],
  },
  {
    name: 'Account & Access',
    description: 'Dostępy i konta - hasła, uprawnienia, email',
    subcategories: [
      'Reset hasła',
      'Dostęp do systemu',
      'Uprawnienia',
      'Konto email',
      'Inne',
    ],
  },
  {
    name: 'Other',
    description: 'Pozostałe problemy IT',
    subcategories: ['Inne problemy'],
  },
];

// Przypisania agentów do kategorii (zgodnie z PRD i endpoints-plan.md)
const agentCategoryAssignments = [
  {
    agentEmail: 'admin@tickflow.com',
    categories: ['Hardware', 'Software', 'Network', 'Account & Access', 'Other'], // Admin ma dostęp do wszystkich
  },
  {
    agentEmail: 'agent@tickflow.com',
    categories: ['Hardware', 'Software'], // Agent tylko do Hardware i Software
  },
];

async function seedCategories() {
  console.log('🌱 Starting categories and subcategories seeding...\n');

  const createdCategories: Record<string, string> = {}; // Map: categoryName -> categoryId

  // Krok 1: Utworzenie kategorii
  for (const category of categoriesWithSubcategories) {
    try {
      // Sprawdź czy kategoria już istnieje
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id, name')
        .eq('name', category.name)
        .single();

      let categoryId: string;

      if (existingCategory) {
        console.log(`⏭️  Category "${category.name}" already exists, skipping creation...`);
        categoryId = existingCategory.id;
      } else {
        // Utwórz kategorię
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            description: category.description,
          })
          .select('id, name')
          .single();

        if (error) {
          console.error(`❌ Error creating category "${category.name}":`, error.message);
          continue;
        }

        categoryId = newCategory!.id;
        console.log(`✅ Created category: ${category.name} (${categoryId})`);
      }

      createdCategories[category.name] = categoryId;

      // Krok 2: Utworzenie podkategorii dla tej kategorii
      for (const subcategoryName of category.subcategories) {
        try {
          // Sprawdź czy podkategoria już istnieje
          const { data: existingSubcategory } = await supabase
            .from('subcategories')
            .select('id, name')
            .eq('category_id', categoryId)
            .eq('name', subcategoryName)
            .single();

          if (existingSubcategory) {
            console.log(`   ⏭️  Subcategory "${subcategoryName}" already exists`);
            continue;
          }

          // Utwórz podkategorię
          const { data: newSubcategory, error: subError } = await supabase
            .from('subcategories')
            .insert({
              name: subcategoryName,
              category_id: categoryId,
            })
            .select('id, name')
            .single();

          if (subError) {
            console.error(`   ❌ Error creating subcategory "${subcategoryName}":`, subError.message);
            continue;
          }

          console.log(`   ✅ Created subcategory: ${subcategoryName}`);
        } catch (error) {
          console.error(`   ❌ Unexpected error for subcategory "${subcategoryName}":`, error);
        }
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Unexpected error for category "${category.name}":`, error);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Krok 3: Przypisanie agentów do kategorii
  console.log('🔗 Assigning agents to categories...\n');

  for (const assignment of agentCategoryAssignments) {
    try {
      // Znajdź użytkownika (agenta)
      const { data: agent, error: agentError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', assignment.agentEmail)
        .eq('role', 'AGENT')
        .single();

      if (agentError || !agent) {
        console.error(`❌ Agent "${assignment.agentEmail}" not found or is not an AGENT. Skipping...`);
        console.log(`   💡 Make sure to run "npm run seed:users" first!\n`);
        continue;
      }

      console.log(`👤 Agent: ${agent.email} (${agent.id})`);

      // Przypisz agenta do każdej kategorii
      for (const categoryName of assignment.categories) {
        const categoryId = createdCategories[categoryName];

        if (!categoryId) {
          console.error(`   ❌ Category "${categoryName}" not found, skipping...`);
          continue;
        }

        // Sprawdź czy przypisanie już istnieje
        const { data: existingAssignment } = await supabase
          .from('agent_categories')
          .select('id')
          .eq('agent_id', agent.id)
          .eq('category_id', categoryId)
          .single();

        if (existingAssignment) {
          console.log(`   ⏭️  Already assigned to "${categoryName}"`);
          continue;
        }

        // Utwórz przypisanie
        const { error: assignError } = await supabase
          .from('agent_categories')
          .insert({
            agent_id: agent.id,
            category_id: categoryId,
          });

        if (assignError) {
          console.error(`   ❌ Error assigning to "${categoryName}":`, assignError.message);
          continue;
        }

        console.log(`   ✅ Assigned to category: ${categoryName}`);
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Unexpected error for agent "${assignment.agentEmail}":`, error);
    }
  }

  console.log('✨ Categories, subcategories, and agent assignments seeded successfully!\n');

  // Podsumowanie
  console.log('📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Categories: ${Object.keys(createdCategories).length}`);

  const { count: subcategoriesCount } = await supabase
    .from('subcategories')
    .select('*', { count: 'exact', head: true });

  const { count: assignmentsCount } = await supabase
    .from('agent_categories')
    .select('*', { count: 'exact', head: true });

  console.log(`Subcategories: ${subcategoriesCount || 0}`);
  console.log(`Agent assignments: ${assignmentsCount || 0}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Uruchom seeding
seedCategories()
  .then(() => {
    console.log('👍 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

