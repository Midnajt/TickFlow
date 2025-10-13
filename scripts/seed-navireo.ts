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

// Kategoria Navireo z podkategorią Inne
const navireoCategory = {
  name: 'Navireo',
  description: 'Zagadnienia związane z systemem Navireo',
  subcategories: ['Inne'],
};

// Agenci, którzy mają mieć dostęp do kategorii Navireo
const navireoAgentEmails = ['agent@tickflow.com', 'agent2@tickflow.com'];

async function seedNavireo() {
  console.log('🌱 Starting Navireo category seeding...\n');

  let categoryId: string;

  // Krok 1: Utworzenie/sprawdzenie kategorii Navireo
  try {
    // Sprawdź czy kategoria już istnieje
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', navireoCategory.name)
      .single();

    if (existingCategory) {
      console.log(`⏭️  Category "${navireoCategory.name}" already exists (${existingCategory.id})`);
      categoryId = existingCategory.id;
    } else {
      // Utwórz kategorię
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
          name: navireoCategory.name,
          description: navireoCategory.description,
        })
        .select('id, name')
        .single();

      if (error) {
        console.error(`❌ Error creating category "${navireoCategory.name}":`, error.message);
        process.exit(1);
      }

      categoryId = newCategory!.id;
      console.log(`✅ Created category: ${navireoCategory.name} (${categoryId})`);
    }
  } catch (error) {
    console.error(`❌ Unexpected error for category "${navireoCategory.name}":`, error);
    process.exit(1);
  }

  // Krok 2: Utworzenie podkategorii "Inne"
  for (const subcategoryName of navireoCategory.subcategories) {
    try {
      // Sprawdź czy podkategoria już istnieje
      const { data: existingSubcategory } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('category_id', categoryId)
        .eq('name', subcategoryName)
        .single();

      if (existingSubcategory) {
        console.log(`   ⏭️  Subcategory "${subcategoryName}" already exists (${existingSubcategory.id})`);
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

      console.log(`   ✅ Created subcategory: ${subcategoryName} (${newSubcategory!.id})`);
    } catch (error) {
      console.error(`   ❌ Unexpected error for subcategory "${subcategoryName}":`, error);
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Krok 3: Przypisanie agentów do kategorii Navireo
  console.log('🔗 Assigning agents to Navireo category...\n');

  for (const agentEmail of navireoAgentEmails) {
    try {
      // Znajdź użytkownika (agenta)
      const { data: agent, error: agentError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', agentEmail)
        .eq('role', 'AGENT')
        .single();

      if (agentError || !agent) {
        console.error(`❌ Agent "${agentEmail}" not found or is not an AGENT. Skipping...`);
        console.log(`   💡 Make sure the agent exists and has AGENT role!\n`);
        continue;
      }

      console.log(`👤 Agent: ${agent.email} (${agent.id})`);

      // Sprawdź czy przypisanie już istnieje
      const { data: existingAssignment } = await supabase
        .from('agent_categories')
        .select('id')
        .eq('agent_id', agent.id)
        .eq('category_id', categoryId)
        .single();

      if (existingAssignment) {
        console.log(`   ⏭️  Already assigned to "${navireoCategory.name}"`);
        console.log('');
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
        console.error(`   ❌ Error assigning to "${navireoCategory.name}":`, assignError.message);
        console.log('');
        continue;
      }

      console.log(`   ✅ Assigned to category: ${navireoCategory.name}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Unexpected error for agent "${agentEmail}":`, error);
    }
  }

  console.log('✨ Navireo category and agent assignments seeded successfully!\n');

  // Podsumowanie
  console.log('📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Category: ${navireoCategory.name} (${categoryId})`);

  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('name')
    .eq('category_id', categoryId);

  console.log(`Subcategories: ${subcategories?.length || 0} (${subcategories?.map(s => s.name).join(', ')})`);

  const { data: assignments } = await supabase
    .from('agent_categories')
    .select('agent_id, users(email)')
    .eq('category_id', categoryId);

  const assignedAgents = assignments?.map((a: any) => a.users?.email || 'unknown') || [];
  console.log(`Assigned agents: ${assignedAgents.length} (${assignedAgents.join(', ')})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Uruchom seeding
seedNavireo()
  .then(() => {
    console.log('👍 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

