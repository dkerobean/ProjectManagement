import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ProjectService } from '@/services/ProjectService'
import { createClient } from '@supabase/supabase-js'

// Validation schemas
const createProjectSchema = z.object({
  name: z.string()
    .min(1, { message: 'Project name is required' })
    .max(100, { message: 'Project name must be less than 100 characters' }),
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
  status: z.enum(['active', 'inactive', 'completed', 'on-hold'])
    .default('active'),
  priority: z.enum(['low', 'medium', 'high', 'critical'])
    .default('medium'),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, { message: 'Invalid color format. Use hex format like #FF5733' })
    .default('#3B82F6'),
  metadata: z.record(z.any()).optional(),
  team_members: z.array(z.object({
    user_id: z.string().uuid({ message: 'Invalid user ID format' }),
    role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
    permissions: z.record(z.any()).optional()
  })).optional()
})

const listProjectsSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  status: z.enum(['active', 'inactive', 'completed', 'on-hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  search: z.string().max(100).optional(),
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'start_date', 'end_date']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  owner_id: z.string().uuid().optional(),
  start_date_from: z.string().datetime().optional(),
  start_date_to: z.string().datetime().optional(),
  end_date_from: z.string().datetime().optional(),
  end_date_to: z.string().datetime().optional()
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
 * POST /api/projects - Create a new project
 */
export async function POST(request) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(request)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

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

    // Create project
    const project = await ProjectService.createProject(validatedData, user.id)

    // Add additional team members if specified
    if (validatedData.team_members && validatedData.team_members.length > 0) {
      for (const member of validatedData.team_members) {
        try {
          await ProjectService.addProjectMember(
            project.id,
            user.id,
            member,
            user.id
          )
        } catch (memberError) {
          console.warn(`Failed to add team member ${member.user_id}:`, memberError.message)
          // Continue with other members
        }
      }
    }

    // Fetch the complete project with members
    const completeProject = await ProjectService.getProjectById(project.id, user.id)

    return NextResponse.json({
      success: true,
      data: completeProject,
      message: 'Project created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/projects - List projects with pagination and filtering
 */
export async function GET(request) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(request)

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedParams = listProjectsSchema.parse(queryParams)

    // Get user's projects with filtering
    let projects = await ProjectService.getUserProjects(user.id, validatedParams.status)

    // Apply search filter
    if (validatedParams.search) {
      const searchTerm = validatedParams.search.toLowerCase()
      projects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
      )
    }

    // Apply priority filter
    if (validatedParams.priority) {
      projects = projects.filter(project => project.priority === validatedParams.priority)
    }

    // Apply owner filter
    if (validatedParams.owner_id) {
      projects = projects.filter(project => project.owner_id === validatedParams.owner_id)
    }

    // Apply date range filters
    if (validatedParams.start_date_from || validatedParams.start_date_to) {
      projects = projects.filter(project => {
        if (!project.start_date) return false
        const projectStartDate = new Date(project.start_date)

        if (validatedParams.start_date_from) {
          const fromDate = new Date(validatedParams.start_date_from)
          if (projectStartDate < fromDate) return false
        }

        if (validatedParams.start_date_to) {
          const toDate = new Date(validatedParams.start_date_to)
          if (projectStartDate > toDate) return false
        }

        return true
      })
    }

    if (validatedParams.end_date_from || validatedParams.end_date_to) {
      projects = projects.filter(project => {
        if (!project.end_date) return false
        const projectEndDate = new Date(project.end_date)

        if (validatedParams.end_date_from) {
          const fromDate = new Date(validatedParams.end_date_from)
          if (projectEndDate < fromDate) return false
        }

        if (validatedParams.end_date_to) {
          const toDate = new Date(validatedParams.end_date_to)
          if (projectEndDate > toDate) return false
        }

        return true
      })
    }

    // Apply sorting
    projects.sort((a, b) => {
      let aValue = a[validatedParams.sort_by]
      let bValue = b[validatedParams.sort_by]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      // Handle date sorting
      if (['created_at', 'updated_at', 'start_date', 'end_date'].includes(validatedParams.sort_by)) {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (validatedParams.sort_order === 'desc') {
        return aValue < bValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })

    // Apply pagination
    const totalProjects = projects.length
    const startIndex = (validatedParams.page - 1) * validatedParams.limit
    const endIndex = startIndex + validatedParams.limit
    const paginatedProjects = projects.slice(startIndex, endIndex)

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProjects / validatedParams.limit)
    const hasNextPage = validatedParams.page < totalPages
    const hasPrevPage = validatedParams.page > 1

    return NextResponse.json({
      success: true,
      data: paginatedProjects,
      pagination: {
        current_page: validatedParams.page,
        per_page: validatedParams.limit,
        total_items: totalProjects,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      },
      filters: {
        status: validatedParams.status,
        priority: validatedParams.priority,
        search: validatedParams.search,
        sort_by: validatedParams.sort_by,
        sort_order: validatedParams.sort_order
      }
    })

  } catch (error) {
    return handleError(error)
  }
}
