// Alternative approach to fix policies using direct SQL execution
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixPoliciesDirectly() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase environment variables');
    return;
  }

  console.log('🔧 Trying direct SQL execution approach...');
  const supabase = createClient(supabaseUrl, serviceKey);

  // Try to execute a simple query first to test connection
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Cannot connect to database:', error.message);
      console.log('💡 You need to manually run the SQL in Supabase dashboard');
      return;
    }

    console.log('✅ Database connection successful');
  } catch (err) {
    console.log('❌ Connection test failed:', err.message);
    console.log('💡 You need to manually run the SQL in Supabase dashboard');
    return;
  }

  console.log('');
  console.log('🚨 MANUAL ACTION REQUIRED 🚨');
  console.log('');
  console.log('Since the automated script failed, you need to:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste this SQL:');
  console.log('');
  console.log('-- DROP EXISTING POLICIES');
  console.log('DROP POLICY IF EXISTS "Projects are viewable by members" ON projects;');
  console.log('DROP POLICY IF EXISTS "Projects can be inserted by authenticated users" ON projects;');
  console.log('DROP POLICY IF EXISTS "Projects can be updated by owners and admins" ON projects;');
  console.log('DROP POLICY IF EXISTS "Projects can be deleted by owners" ON projects;');
  console.log('');
  console.log('-- CREATE NEW POLICIES');
  console.log('CREATE POLICY "Projects viewable by members" ON projects');
  console.log('    FOR SELECT USING (');
  console.log('        auth.uid() = owner_id OR');
  console.log('        auth.role() = \'service_role\' OR');
  console.log('        EXISTS (');
  console.log('            SELECT 1 FROM project_members');
  console.log('            WHERE project_members.project_id = projects.id');
  console.log('            AND project_members.user_id = auth.uid()');
  console.log('        )');
  console.log('    );');
  console.log('');
  console.log('CREATE POLICY "Projects insertable by authenticated users" ON projects');
  console.log('    FOR INSERT WITH CHECK (');
  console.log('        auth.uid() IS NOT NULL AND');
  console.log('        auth.uid() = owner_id');
  console.log('    );');
  console.log('');
  console.log('CREATE POLICY "Projects updatable by owners and admins" ON projects');
  console.log('    FOR UPDATE USING (');
  console.log('        auth.uid() = owner_id OR');
  console.log('        auth.role() = \'service_role\' OR');
  console.log('        EXISTS (');
  console.log('            SELECT 1 FROM project_members');
  console.log('            WHERE project_members.project_id = projects.id');
  console.log('            AND project_members.user_id = auth.uid()');
  console.log('            AND project_members.role IN (\'owner\', \'admin\')');
  console.log('        )');
  console.log('    );');
  console.log('');
  console.log('CREATE POLICY "Projects deletable by owners" ON projects');
  console.log('    FOR DELETE USING (');
  console.log('        auth.uid() = owner_id OR');
  console.log('        auth.role() = \'service_role\'');
  console.log('    );');
  console.log('');
  console.log('5. Click "Run" to execute');
  console.log('6. Test your API again');
  console.log('');
  console.log('✅ After running this SQL, the infinite recursion error should be fixed!');
}

fixPoliciesDirectly();
