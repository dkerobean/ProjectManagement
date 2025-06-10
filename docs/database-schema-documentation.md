# Database Schema Documentation

## Overview
This document describes the complete database schema for the Project Management System implemented in Supabase PostgreSQL.

## Core Tables

### 1. Users Table
Stores user account information and preferences.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  avatar_url TEXT,
  role VARCHAR DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  timezone VARCHAR DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
```

**Key Features:**
- UUID primary key for security
- Role-based access control
- JSONB preferences for flexible user settings
- Automatic timestamp management

### 2. Projects Table
Stores project information and metadata.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed', 'on_hold')),
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  start_date DATE,
  end_date DATE,
  due_date DATE,
  color VARCHAR DEFAULT '#3B82F6',
  owner_id UUID NOT NULL REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- Project lifecycle management
- Flexible metadata storage
- Visual customization (color)
- Date range management

### 3. Project Members Table
Manages team membership and roles within projects.

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),
  UNIQUE(project_id, user_id)
);
```

**Key Features:**
- Hierarchical role system
- Granular permission control
- Invitation tracking
- Unique membership constraint

### 4. Tasks Table
Core task management with hierarchy support.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id),
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- Task hierarchy (parent-child relationships)
- Comprehensive status tracking
- Time estimation and tracking
- Flexible tagging system
- Position management for ordering

### 5. Task Dependencies Table
Manages task dependencies and relationships.

```sql
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'finish_to_start', 'start_to_start', 'finish_to_finish')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);
```

**Key Features:**
- Multiple dependency types
- Circular dependency prevention
- Automatic cleanup on task deletion

### 6. Comments Table
Threaded commenting system for tasks and projects.

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  thread_depth INTEGER DEFAULT 0,
  author_id UUID NOT NULL REFERENCES users(id),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- Threaded conversations
- Edit tracking
- Flexible attachment to tasks or projects
- Depth control for nested threads

### 7. File Attachments Table
File management with versioning support.

```sql
CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR NOT NULL,
  original_filename VARCHAR NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES file_attachments(id),
  is_current_version BOOLEAN DEFAULT TRUE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  description TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- File versioning system
- Multiple attachment points
- Comprehensive metadata
- Size and type tracking

## Database Functions

### 1. Task Hierarchy Functions

#### `get_task_hierarchy(task_uuid UUID)`
Returns the complete task hierarchy starting from a given task.

```sql
SELECT * FROM get_task_hierarchy('task-uuid-here');
```

Returns: id, title, status, priority, level, path

#### `get_task_depth(task_uuid UUID)`
Returns the depth level of a task in the hierarchy.

#### `check_circular_dependency(task_uuid UUID, depends_on_uuid UUID)`
Prevents circular dependencies when creating task relationships.

### 2. Project Statistics Functions

#### `get_project_statistics(project_uuid UUID)`
Returns comprehensive project statistics including task counts, completion percentage, team size, and activity metrics.

```sql
SELECT * FROM get_project_statistics('project-uuid-here');
```

Returns: total_tasks, todo_tasks, in_progress_tasks, review_tasks, done_tasks, blocked_tasks, completion_percentage, team_members, total_comments, total_attachments

#### `get_project_completion_percentage(project_uuid UUID)`
Returns the completion percentage for a specific project.

#### `get_project_member_count(project_uuid UUID)`
Returns the number of team members in a project.

### 3. User Assignment Functions

#### `get_user_assignments(user_uuid UUID, active_only BOOLEAN DEFAULT TRUE)`
Returns all tasks assigned to a specific user with project context and priority ordering.

```sql
SELECT * FROM get_user_assignments('user-uuid-here', true);
```

Returns: task_id, task_title, task_description, task_status, task_priority, project_id, project_name, due_date, created_at, overdue

### 4. Access Control Functions

#### `check_project_access(project_uuid UUID, user_uuid UUID, required_role TEXT DEFAULT 'member')`
Checks if a user has the required access level to a project.

## Row-Level Security (RLS) Policies

All tables have comprehensive RLS policies implemented:

### Users Table
- Users can view and edit their own data
- Users can view basic info of other users in shared projects

### Projects Table
- Users can view projects they're members of
- Only owners and admins can update projects
- Only owners can delete projects

### Tasks Table
- Users can view all tasks in projects they're members of
- Users can edit tasks they created, are assigned to, or have admin rights
- Only creators and admins can delete tasks

### Comments Table
- Users can view comments on accessible tasks/projects
- Users can edit/delete their own comments
- Admins can delete any comments in their projects

### File Attachments Table
- Users can view files in accessible tasks/projects/comments
- Users can edit/delete files they uploaded or have admin access

## Database Triggers

### Automatic Timestamp Updates
All tables with `updated_at` columns have triggers that automatically update the timestamp on record modification:

- `update_users_updated_at`
- `update_projects_updated_at`
- `update_tasks_updated_at`
- `update_comments_updated_at`
- `update_project_members_updated_at`
- `update_file_attachments_updated_at`

## Performance Indexes

Strategic indexes have been created for optimal query performance:

### Primary Indexes
- Email lookups: `idx_users_email`
- Project ownership: `idx_projects_owner_id`
- Task assignments: `idx_tasks_assignee_id`
- Project membership: `idx_project_members_composite`

### Status and Priority Indexes
- Task status filtering: `idx_tasks_status`
- Task priority sorting: `idx_tasks_priority`
- Project status filtering: `idx_projects_status`

### Date-based Indexes
- Due date queries: `idx_tasks_due_date`, `idx_projects_due_date`
- Creation date sorting: `idx_tasks_created_at`, `idx_projects_created_at`

### Composite Indexes
- Project task filtering: `idx_tasks_project_status`
- User task filtering: `idx_tasks_assignee_status`

## JSONB Schema Documentation

### Users Preferences Schema
```json
{
  "theme": "light|dark|system",
  "language": "en|es|fr|...",
  "notifications": {
    "email": boolean,
    "push": boolean,
    "mentions": boolean,
    "deadlines": boolean
  },
  "dashboard": {
    "defaultView": "kanban|list|calendar",
    "showCompleted": boolean,
    "groupBy": "status|priority|assignee"
  }
}
```

### Projects Metadata Schema
```json
{
  "template": "software|marketing|research|...",
  "budget": {
    "allocated": number,
    "spent": number,
    "currency": "USD|EUR|..."
  },
  "client": {
    "name": string,
    "contact": string
  },
  "milestones": [
    {
      "name": string,
      "date": "YYYY-MM-DD",
      "completed": boolean
    }
  ]
}
```

### Tasks Metadata Schema
```json
{
  "labels": ["bug", "feature", "urgent"],
  "customFields": {
    "severity": "low|medium|high|critical",
    "effort": number,
    "storyPoints": number
  },
  "links": [
    {
      "type": "blocks|depends|relates",
      "taskId": "uuid"
    }
  ]
}
```

## Security Considerations

1. **UUID Primary Keys**: All tables use UUID primary keys to prevent enumeration attacks
2. **Row-Level Security**: Comprehensive RLS policies ensure data isolation
3. **Role-Based Access**: Hierarchical permission system with clear role definitions
4. **Input Validation**: Check constraints prevent invalid data states
5. **Cascade Deletion**: Proper foreign key constraints maintain referential integrity

## Migration Strategy

The database schema supports incremental migrations through:
1. Versioned migration files
2. IF NOT EXISTS clauses for safe re-execution
3. Backwards-compatible column additions
4. Staged rollout of new features

## Performance Recommendations

1. **Query Optimization**: Use provided functions for complex operations
2. **Index Usage**: Leverage composite indexes for multi-column filtering
3. **JSONB Queries**: Use GIN indexes for frequently queried JSONB fields
4. **Pagination**: Always use LIMIT/OFFSET for large result sets
5. **Connection Pooling**: Use connection pooling for production deployments

---

**Last Updated**: June 10, 2025
**Schema Version**: 1.0.0
**Database**: Supabase PostgreSQL 17.4.1
