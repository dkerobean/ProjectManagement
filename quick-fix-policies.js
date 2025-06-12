// Quick fix for the infinite recursion issue
// Make sure to have your .env.local file with SUPABASE credentials

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixPolicies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase environment variables');
    console.log('Please check your .env.local file');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const policies = [
    'DROP POLICY IF EXISTS "Projects are viewable by members" ON projects',
    'DROP POLICY IF EXISTS "Projects can be inserted by authenticated users" ON projects',
    'DROP POLICY IF EXISTS "Projects can be updated by owners and admins" ON projects',
    'DROP POLICY IF EXISTS "Projects can be deleted by owners" ON projects',

    `CREATE POLICY "Projects viewable by members" ON projects
      FOR SELECT USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role' OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )`,

    `CREATE POLICY "Projects insertable by authenticated users" ON projects
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = owner_id
      )`,

    `CREATE POLICY "Projects updatable by owners and admins" ON projects
      FOR UPDATE USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role' OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.role IN ('owner', 'admin')
        )
      )`,

    `CREATE POLICY "Projects deletable by owners" ON projects
      FOR DELETE USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role'
      )`
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec', { sql: policy });
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`SQL: ${policy.substring(0, 50)}...`);
      } else {
        console.log(`✅ Executed: ${policy.substring(0, 50)}...`);
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
}

fixPolicies().then(() => {
  console.log('🎉 Policy fix attempt completed');
}).catch(err => {
  console.error('❌ Failed:', err);
});
