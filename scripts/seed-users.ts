import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';
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

const BCRYPT_ROUNDS = 10;

// Testowi użytkownicy
const testUsers = [
  {
    email: 'admin@tickflow.com',
    password: 'Admin123!@#',
    name: 'Admin User',
    role: 'AGENT' as const,
    force_password_change: false,
  },
  {
    email: 'agent@tickflow.com',
    password: 'Agent123!@#',
    name: 'John Agent',
    role: 'AGENT' as const,
    force_password_change: false,
  },
  {
    email: 'agent2@tickflow.com',
    password: 'Agent2123!@#',
    name: 'Sarah Agent',
    role: 'AGENT' as const,
    force_password_change: false,
  },
  {
    email: 'user@tickflow.com',
    password: 'User123!@#',
    name: 'Jane User',
    role: 'USER' as const,
    force_password_change: false,
  },
  {
    email: 'user2@tickflow.com',
    password: 'User2123!@#',
    name: 'Bob User',
    role: 'USER' as const,
    force_password_change: false,
  },
  {
    email: 'newuser@tickflow.com',
    password: 'Agent123!@#',
    name: 'New User',
    role: 'USER' as const,
    force_password_change: true, // Wymaga zmiany hasła przy pierwszym logowaniu
  },
];

async function seedUsers() {
  console.log('🌱 Starting user seeding...\n');

  for (const user of testUsers) {
    try {
      // Sprawdź czy użytkownik już istnieje
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        console.log(`⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hashowanie hasła
      const hashedPassword = await hash(user.password, BCRYPT_ROUNDS);

      // Utworzenie użytkownika
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: user.email,
          password: hashedPassword,
          name: user.name,
          role: user.role,
          force_password_change: user.force_password_change,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
        continue;
      }

      console.log(`✅ Created user: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Force password change: ${user.force_password_change}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error);
    }
  }

  console.log('✨ Seeding completed!\n');
  console.log('📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testUsers.forEach((user) => {
    console.log(`${user.role.padEnd(6)} | ${user.email.padEnd(25)} | ${user.password}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Uruchom seeding
seedUsers()
  .then(() => {
    console.log('👍 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

