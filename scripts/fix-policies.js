const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runSQLScript() {
  try {
    console.log('🔧 Fixing projects table policies...');

    // Read and execute each policy statement individually
    const sqlStatements = [
      `DROP POLICY IF EXISTS "Projects are viewable by members" ON projects;`,
      `DROP POLICY IF EXISTS "Projects can be inserted by authenticated users" ON projects;`,
      `DROP POLICY IF EXISTS "Projects can be updated by owners and admins" ON projects;`,
      `DROP POLICY IF EXISTS "Projects can be deleted by owners" ON projects;`,

      `CREATE POLICY "Projects viewable by members" ON projects
        FOR SELECT USING (
          auth.uid() = owner_id OR
          auth.role() = 'service_role' OR
          EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = projects.id
            AND project_members.user_id = auth.uid()
          )
        );`,

      `CREATE POLICY "Projects insertable by authenticated users" ON projects
        FOR INSERT WITH CHECK (
          auth.uid() IS NOT NULL AND
          auth.uid() = owner_id
        );`,

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
        );`,

      `CREATE POLICY "Projects deletable by owners" ON projects
        FOR DELETE USING (
          auth.uid() = owner_id OR
          auth.role() = 'service_role'
        );`
    ];

    for (const sql of sqlStatements) {
      const { error } = await supabase.rpc('exec', { sql });
      if (error) {
        console.error('❌ Error executing SQL:', error);
        console.error('SQL statement:', sql);
      } else {
        console.log('✅ Executed SQL statement successfully');
      }
    }

    console.log('🎉 Projects table policies fixed!');
  } catch (err) {
    console.error('❌ Script execution failed:', err.message);
  }
}

runSQLScript();
