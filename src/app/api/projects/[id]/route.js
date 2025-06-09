import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ProjectService } from '@/services/ProjectService'
import { createClient } from '@supabase/supabase-js'

// Validation schema for project updates
const updateProjectSchema = z.object({
  name: z.string()
    .min(1, { message: 'Project name is required' })
    .max(100, { message: 'Project name must be less than 100 characters' })
    .optional(),
  description: z.string()
    .max(1000, { message: 'Description must be less than 1000 characters' })
    .optional(),
  start_date: z.string()
    .datetime({ message: 'Invalid start date format' })
    .optional(),
  end_date: z.string()
    .datetime({ message: 'Invalid end date format' })
    .optional(),
  due_date: z.string()
    .datetime({ message: 'Invalid due date format' })
    .optional(),
  status: z.enum(['active', 'inactive', 'completed', 'on-hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, { message: 'Invalid color format. Use hex format like #FF5733' })
    .optional(),
  metadata: z.record(z.any()).optional()
})

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  const token = authHeader.substring(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    throw new Error('Invalid authentication token')
  }

  return user
}

// Helper function to handle errors
function handleError(error) {
  console.error('API Error:', error)

  if (error.message === 'Authentication required' || error.message === 'Invalid authentication token') {
    return NextResponse.json(
      { error: 'Authentication required', details: error.message },
      { status: 401 }
    )
  }

  if (error.message.includes('Access denied')) {
    return NextResponse.json(
      { error: 'Access denied', details: error.message },
      { status: 403 }
    )
  }

  if (error.message.includes('not found') || error.message.includes('does not exist')) {
    return NextResponse.json(
      { error: 'Project not found', details: error.message },
      { status: 404 }
    )
  }

  if (error.issues) {
    // Zod validation error
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error', details: error.message },
    { status: 500 }
  )
}

/**
 * GET /api/projects/[id] - Get single project by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Authentication
    const user = await getAuthenticatedUser(request)

    // Validate project ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Get project with access check
    const project = await ProjectService.getProjectById(id, user.id)

    return NextResponse.json({
      success: true,
      data: project
    })

  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/projects/[id] - Update project
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params

    // Authentication
    const user = await getAuthenticatedUser(request)

    // Validate project ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Check if there's actually data to update
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    // Validate date relationships
    if (validatedData.start_date && validatedData.end_date) {
      const startDate = new Date(validatedData.start_date)
      const endDate = new Date(validatedData.end_date)
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    if (validatedData.start_date && validatedData.due_date) {
      const startDate = new Date(validatedData.start_date)
      const dueDate = new Date(validatedData.due_date)
      if (startDate > dueDate) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'Due date must be after start date' },
          { status: 400 }
        )
      }
    }

    // Update project with permission check
    const updatedProject = await ProjectService.updateProject(id, validatedData, user.id)

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    })

  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/projects/[id] - Soft delete project
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Authentication
    const user = await getAuthenticatedUser(request)

    // Validate project ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Check if user has permission to delete (owner or admin)
    const project = await ProjectService.getProjectById(id, user.id)

    const userMembership = project.project_members.find(member => member.user.id === user.id)
    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return NextResponse.json(
        { error: 'Access denied', details: 'Insufficient permissions to delete project' },
        { status: 403 }
      )
    }

    // Perform soft delete by updating status and setting deleted_at timestamp
    const deletedProject = await ProjectService.updateProject(id, {
      status: 'inactive',
      deleted_at: new Date().toISOString(),
      metadata: {
        ...project.metadata,
        deleted_by: user.id,
        deleted_reason: 'User requested deletion'
      }
    }, user.id)

    return NextResponse.json({
      success: true,
      data: {
        id: deletedProject.id,
        deleted_at: deletedProject.metadata?.deleted_at || new Date().toISOString(),
        status: deletedProject.status
      },
      message: 'Project deleted successfully'
    })

  } catch (error) {
    return handleError(error)
  }
}
