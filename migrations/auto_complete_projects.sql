-- Auto-complete projects when all tasks are done
-- This migration creates a function and trigger to automatically set project status to 'completed'
-- when all tasks in the project have status 'done'

-- First, let's add the 'completed' status to projects if it doesn't exist
-- We'll also add other useful project statuses
DO $$
BEGIN
    -- Add check constraint for project status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_status_check' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects ADD CONSTRAINT projects_status_check 
        CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled', 'draft'));
    END IF;
END $$;

-- Function to check if all tasks in a project are completed
CREATE OR REPLACE FUNCTION check_project_completion()
RETURNS TRIGGER AS $$
DECLARE
    project_uuid UUID;
    total_tasks INT;
    completed_tasks INT;
    current_project_status VARCHAR;
BEGIN
    -- Get the project_id from the task that was updated
    IF TG_OP = 'UPDATE' THEN
        project_uuid := NEW.project_id;
    ELSIF TG_OP = 'DELETE' THEN
        project_uuid := OLD.project_id;
    ELSIF TG_OP = 'INSERT' THEN
        project_uuid := NEW.project_id;
    END IF;

    -- Skip if no project_id (orphaned task)
    IF project_uuid IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Get current project status
    SELECT status INTO current_project_status 
    FROM projects 
    WHERE id = project_uuid;

    -- Skip if project doesn't exist or is already completed/cancelled
    IF current_project_status IS NULL OR current_project_status IN ('completed', 'cancelled') THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Count total tasks for this project (excluding subtasks - those without parent_task_id)
    SELECT COUNT(*) INTO total_tasks
    FROM tasks 
    WHERE project_id = project_uuid 
    AND parent_task_id IS NULL;  -- Only count main tasks, not subtasks

    -- If no tasks exist, don't mark project as completed
    IF total_tasks = 0 THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Count completed tasks (status = 'done')
    SELECT COUNT(*) INTO completed_tasks
    FROM tasks 
    WHERE project_id = project_uuid 
    AND parent_task_id IS NULL  -- Only count main tasks, not subtasks
    AND status = 'done';

    -- Update project status based on task completion
    IF completed_tasks = total_tasks THEN
        -- All tasks are completed - mark project as completed
        UPDATE projects 
        SET 
            status = 'completed',
            updated_at = NOW()
        WHERE id = project_uuid 
        AND status != 'completed';  -- Only update if not already completed

        -- Create an activity record for project completion
        INSERT INTO activities (user_id, type, title, description, entity_type, entity_id, metadata)
        VALUES (
            COALESCE(NEW.created_by, OLD.created_by, (SELECT owner_id FROM projects WHERE id = project_uuid)),
            'PROJECT-COMPLETED',
            'Project Completed',
            'Project automatically marked as completed - all tasks finished',
            'project',
            project_uuid,
            jsonb_build_object(
                'total_tasks', total_tasks,
                'completion_trigger', 'auto',
                'completion_date', NOW()
            )
        );

    ELSIF completed_tasks < total_tasks AND current_project_status = 'completed' THEN
        -- Some tasks are not completed but project was marked as completed - revert to active
        UPDATE projects 
        SET 
            status = 'active',
            updated_at = NOW()
        WHERE id = project_uuid;

        -- Create an activity record for project reactivation
        INSERT INTO activities (user_id, type, title, description, entity_type, entity_id, metadata)
        VALUES (
            COALESCE(NEW.created_by, OLD.created_by, (SELECT owner_id FROM projects WHERE id = project_uuid)),
            'PROJECT-REACTIVATED',
            'Project Reactivated',
            'Project automatically reactivated - not all tasks are completed',
            'project',
            project_uuid,
            jsonb_build_object(
                'total_tasks', total_tasks,
                'completed_tasks', completed_tasks,
                'reactivation_trigger', 'auto',
                'reactivation_date', NOW()
            )
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after task status changes
DROP TRIGGER IF EXISTS trigger_check_project_completion ON tasks;
CREATE TRIGGER trigger_check_project_completion
    AFTER INSERT OR UPDATE OF status OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION check_project_completion();

-- Function to manually check and update all project statuses (useful for existing data)
CREATE OR REPLACE FUNCTION update_all_project_statuses()
RETURNS TABLE(project_id UUID, old_status VARCHAR, new_status VARCHAR, task_count INT, completed_count INT) AS $$
DECLARE
    project_record RECORD;
    total_tasks INT;
    completed_tasks INT;
    new_project_status VARCHAR;
BEGIN
    -- Loop through all active projects
    FOR project_record IN 
        SELECT p.id, p.status, p.name 
        FROM projects p 
        WHERE p.status IN ('active', 'completed')
    LOOP
        -- Count tasks for this project
        SELECT COUNT(*) INTO total_tasks
        FROM tasks t
        WHERE t.project_id = project_record.id 
        AND t.parent_task_id IS NULL;  -- Only main tasks
        
        -- Count completed tasks
        SELECT COUNT(*) INTO completed_tasks
        FROM tasks t
        WHERE t.project_id = project_record.id 
        AND t.parent_task_id IS NULL  -- Only main tasks
        AND t.status = 'done';
        
        -- Determine new status
        IF total_tasks > 0 AND completed_tasks = total_tasks THEN
            new_project_status := 'completed';
        ELSIF total_tasks > 0 THEN
            new_project_status := 'active';
        ELSE
            new_project_status := project_record.status; -- Keep current status if no tasks
        END IF;
        
        -- Update if status changed
        IF new_project_status != project_record.status THEN
            UPDATE projects 
            SET status = new_project_status, updated_at = NOW()
            WHERE id = project_record.id;
            
            -- Return the change
            project_id := project_record.id;
            old_status := project_record.status;
            new_status := new_project_status;
            task_count := total_tasks;
            completed_count := completed_tasks;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION check_project_completion() IS 'Automatically updates project status to completed when all tasks are done, and reactivates if tasks become incomplete';
COMMENT ON FUNCTION update_all_project_statuses() IS 'Manually updates all project statuses based on task completion - useful for existing data';
COMMENT ON TRIGGER trigger_check_project_completion ON tasks IS 'Triggers project status update when task status changes';

-- Run initial update for existing projects
SELECT * FROM update_all_project_statuses();
