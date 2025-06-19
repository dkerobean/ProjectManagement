-- Create activities table for tracking user actions and system events
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'UPDATE-TICKET', 'COMMENT', 'ADD-TAGS-TO-TICKET', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50), -- 'task', 'project', 'calendar_event', etc.
    entity_id UUID, -- ID of the related entity
    metadata JSONB, -- Additional data like tags, files, old/new values, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Create RLS (Row Level Security) policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own activities
CREATE POLICY "Users can view own activities" ON activities
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own activities
CREATE POLICY "Users can update own activities" ON activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own activities
CREATE POLICY "Users can delete own activities" ON activities
    FOR DELETE USING (auth.uid() = user_id);

-- Insert some sample activities for testing
INSERT INTO activities (user_id, type, title, description, entity_type, entity_id, metadata) 
VALUES 
(
    (SELECT id FROM users LIMIT 1),
    'UPDATE-TICKET',
    'Task Status Changed',
    'Changed task status from "todo" to "in_progress"',
    'task',
    (SELECT id FROM tasks LIMIT 1),
    '{"ticket": "TSK-123456", "status": 1, "old_status": "todo", "new_status": "in_progress"}'::jsonb
),
(
    (SELECT id FROM users LIMIT 1),
    'COMMENT',
    'Added Comment',
    'Added a comment to the task discussion',
    'task',
    (SELECT id FROM tasks LIMIT 1),
    '{"comment": "This task is progressing well. Expected completion by end of week."}'::jsonb
),
(
    (SELECT id FROM users LIMIT 1),
    'CREATE-PROJECT',
    'Project Created',
    'Created a new project',
    'project',
    (SELECT id FROM projects LIMIT 1),
    '{"project_name": "New Website Redesign"}'::jsonb
);

COMMENT ON TABLE activities IS 'Stores user activities and system events for audit trail and recent activity feeds';
COMMENT ON COLUMN activities.type IS 'Type of activity: UPDATE-TICKET, COMMENT, ADD-TAGS-TO-TICKET, ADD-FILES-TO-TICKET, CREATE-TICKET, COMMENT-MENTION, ASSIGN-TICKET, etc.';
COMMENT ON COLUMN activities.entity_type IS 'Type of entity the activity relates to: task, project, calendar_event, etc.';
COMMENT ON COLUMN activities.metadata IS 'Additional structured data about the activity in JSON format';
