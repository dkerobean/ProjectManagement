## 🚨 URGENT: Fix Infinite Recursion Error

**You're seeing the infinite recursion error because the database policies have circular references.**

### Quick Fix Steps:

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Copy and paste this SQL** (all at once):

```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "Projects are viewable by members" ON projects;
DROP POLICY IF EXISTS "Projects can be inserted by authenticated users" ON projects;
DROP POLICY IF EXISTS "Projects can be updated by owners and admins" ON projects;
DROP POLICY IF EXISTS "Projects can be deleted by owners" ON projects;

-- Create fixed policies
CREATE POLICY "Projects viewable by members" ON projects
    FOR SELECT USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = projects.id
            AND project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Projects insertable by authenticated users" ON projects
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = owner_id
    );

CREATE POLICY "Projects updatable by owners and admins" ON projects
    FOR UPDATE USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = projects.id
            AND project_members.user_id = auth.uid()
            AND project_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Projects deletable by owners" ON projects
    FOR DELETE USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role'
    );
```

3. **Click "Run"**

4. **Try your API again** - the error should be gone!

### ✅ What's Fixed:
- **Budget field** is now optional/removed from API
- **Infinite recursion** will be resolved after running the SQL above

### Test Request (without budget):
```json
{
  "name": "Test Project",
  "description": "Testing without budget",
  "status": "active",
  "priority": "medium",
  "start_date": "2025-06-12",
  "end_date": "2025-06-16",
  "metadata": { "color": "#3B82F6" }
}
```
