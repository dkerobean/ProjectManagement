/**
 * Seed Test User Script
 * Creates a test user in Supabase for GoldTrader Pro testing
 * 
 * Run: npx ts-node scripts/seed-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedTestUser() {
  console.log('🌱 Creating test user for GoldTrader Pro...\n');

  const testUser = {
    email: 'goldtrader@test.com',
    password: 'GoldTrader123!',
    name: 'Gold Trader',
    role: 'admin',
  };

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        name: testUser.name,
      },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('⚠️ User already exists. Trying to get existing user...');
        
        // List users to find existing one
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === testUser.email);
        
        if (existingUser) {
          console.log('✅ Found existing user:', existingUser.id);
          console.log('\n📝 Test Credentials:');
          console.log(`   Email: ${testUser.email}`);
          console.log(`   Password: ${testUser.password}`);
          return;
        }
      }
      throw authError;
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user?.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        timezone: 'UTC',
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn('⚠️ Profile creation warning:', profileError.message);
    } else {
      console.log('✅ User profile created');
    }

    console.log('\n🎉 Test user created successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('   ──────────────────────────');
    console.log(`   Email:    ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log('   ──────────────────────────\n');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

seedTestUser();
