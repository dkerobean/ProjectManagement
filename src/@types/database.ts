export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          timezone: string
          role: 'admin' | 'project_manager' | 'member' | 'viewer'
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          timezone?: string
          role?: 'admin' | 'project_manager' | 'member' | 'viewer'
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          timezone?: string
          role?: 'admin' | 'project_manager' | 'member' | 'viewer'
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
          priority: 'low' | 'medium' | 'high' | 'critical'
          owner_id: string
          start_date: string | null
          end_date: string | null
          budget: number | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          owner_id: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          owner_id?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          permissions: Json | null
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          permissions?: Json | null
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          permissions?: Json | null
          joined_at?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          parent_id: string | null
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assignee_id: string | null
          reporter_id: string
          due_date: string | null
          estimated_hours: number | null
          actual_hours: number | null
          completion_percentage: number
          tags: string[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          parent_id?: string | null
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assignee_id?: string | null
          reporter_id: string
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          completion_percentage?: number
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          parent_id?: string | null
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assignee_id?: string | null
          reporter_id?: string
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          completion_percentage?: number
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          content: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          content: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          content?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      file_attachments: {
        Row: {
          id: string
          task_id: string
          filename: string
          file_size: number
          file_type: string
          storage_path: string
          uploaded_by: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          filename: string
          file_size: number
          file_type: string
          storage_path: string
          uploaded_by: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          filename?: string
          file_size?: number
          file_type?: string
          storage_path?: string
          uploaded_by?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      task_dependencies: {
        Row: {
          id: string
          task_id: string
          depends_on_task_id: string
          dependency_type: 'blocks' | 'relates_to' | 'duplicates'
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          depends_on_task_id: string
          dependency_type?: 'blocks' | 'relates_to' | 'duplicates'
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          depends_on_task_id?: string
          dependency_type?: 'blocks' | 'relates_to' | 'duplicates'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_tasks_hierarchy: {
        Args: {
          project_id: string
        }
        Returns: {
          id: string
          title: string
          parent_id: string | null
          level: number
          path: string[]
        }[]
      }
      get_user_project_role: {
        Args: {
          user_id: string
          project_id: string
        }
        Returns: string
      }
      calculate_project_progress: {
        Args: {
          project_id: string
        }
        Returns: number
      }
    }
    Enums: {
      user_role: 'admin' | 'project_manager' | 'member' | 'viewer'
      project_status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
      task_status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
      priority_level: 'low' | 'medium' | 'high' | 'critical'
      project_member_role: 'owner' | 'admin' | 'member' | 'viewer'
    }
  }
}
