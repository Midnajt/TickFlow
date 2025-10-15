import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';
import type { Database } from '../../app/lib/database.types';
import { execSync } from 'child_process';

/**
 * Global setup for E2E tests
 * This runs ONCE before all tests
 * 
 * Purpose:
 * - Seed test users into the database
 * - Seed categories into the database
 * - Ensure database is in a known state
 */

export default async function globalSetup() {
  console.log('\n🔧 Running global E2E setup...\n');

  // Load environment variables
  config({ path: resolve(process.cwd(), '.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      '❌ Missing environment variables! Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const BCRYPT_ROUNDS = 10;

  // Test users matching tests/e2e/helpers/auth-helpers.ts
  const testUsers = [
    {
      email: 'newuser@tickflow.com',
      password: 'Agent123!@#',
      name: 'New User',
      role: 'USER' as const,
      force_password_change: true,
    },
    {
      email: 'user@tickflow.com',
      password: 'User123!@#',
      name: 'Jane User',
      role: 'USER' as const,
      force_password_change: false,
    },
    {
      email: 'agent@tickflow.com',
      password: 'Agent123!@#',
      name: 'John Agent',
      role: 'AGENT' as const,
      force_password_change: false,
    },
  ];

  console.log('👥 Seeding test users...\n');

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email, force_password_change')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        // Update existing user to ensure correct password and force_password_change
        const hashedPassword = await hash(user.password, BCRYPT_ROUNDS);
        const { error: updateError } = await supabase
          .from('users')
          .update({
            password: hashedPassword,
            force_password_change: user.force_password_change,
            name: user.name,
            role: user.role,
          })
          .eq('email', user.email);

        if (updateError) {
          console.error(`❌ Error updating user ${user.email}:`, updateError.message);
          continue;
        }

        console.log(`✅ Updated user: ${user.email}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Force password change: ${user.force_password_change}\n`);
        continue;
      }

      // Create new user
      const hashedPassword = await hash(user.password, BCRYPT_ROUNDS);
      const { error } = await supabase.from('users').insert({
        email: user.email,
        password: hashedPassword,
        name: user.name,
        role: user.role,
        force_password_change: user.force_password_change,
      });

      if (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
        continue;
      }

      console.log(`✅ Created user: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Force password change: ${user.force_password_change}\n`);
    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error);
    }
  }

  // Seed categories using the seed script
  console.log('📁 Seeding categories...\n');
  try {
    execSync('npm run seed:categories', { stdio: 'inherit' });
    console.log('\n✅ Categories seeded successfully\n');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    // Don't fail if categories already exist
  }

  console.log('✨ Global E2E setup completed!\n');
}

