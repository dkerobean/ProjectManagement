import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(255, 'Project name too long'),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional().default('active'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    metadata: z.record(z.any()).optional().default({})
})

// GET /api/projects - List projects with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 GET /api/projects - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const search = searchParams.get('search')
        const sortBy = searchParams.get('sortBy') || 'created_at'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        console.log('📊 Query parameters:', { page, limit, status, priority, search, sortBy, sortOrder })

        const supabase = await createSupabaseServerClient()

        // Build the query
        let query = supabase
            .from('projects')
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url),
                project_members(
                    id,
                    role,
                    user:users!project_members_user_id_fkey(id, name, email, avatar_url)
                ),
                tasks(
                    id,
                    status,
                    priority
                )
            `)

        // Apply filters
        if (status) {
            query = query.eq('status', status)
        }

        if (priority) {
            query = query.eq('priority', priority)
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Apply pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data: projects, error, count } = await query

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch projects' },
                { status: 500 }
            )
        }

        // Calculate project metrics
        const projectsWithMetrics = projects?.map(project => {
            const tasks = project.tasks || []
            const completedTasksCount = tasks.filter((task: { status: string }) => task.status === 'done').length

            return {
                ...project,
                taskCount: tasks.length,
                completedTasks: completedTasksCount,
                memberCount: project.project_members?.length || 0,
                progress: tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0
            }
        })

        console.log(`✅ Successfully fetched ${projectsWithMetrics?.length || 0} projects`)

        return NextResponse.json({
            data: projectsWithMetrics,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    try {
        console.log('🔍 POST /api/projects - Starting request')

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            console.log('❌ No session or user ID found')
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        console.log('📝 Request body:', body)

        // Remove budget field if present (it doesn't exist in our database)
        const { budget, team_members, ...bodyWithoutBudget } = body
        if (budget !== undefined) {
            console.log('⚠️  Budget field detected and removed:', budget)
        }

        console.log('👥 Team members from request:', team_members)

        // Validate the request body
        const validationResult = createProjectSchema.safeParse(bodyWithoutBudget)
        if (!validationResult.success) {
            console.log('❌ Validation failed:', validationResult.error.errors)
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            )
        }

        const projectData = validationResult.data
        console.log('✅ Validated project data:', projectData)

        const supabase = await createSupabaseServerClient()
        console.log('✅ Supabase client created, user ID:', session.user.id)

        // Prepare data for database insert
        const insertData = {
            ...projectData,
            owner_id: session.user.id,
            start_date: projectData.start_date ? new Date(projectData.start_date).toISOString().split('T')[0] : null,
            end_date: projectData.end_date ? new Date(projectData.end_date).toISOString().split('T')[0] : null,
        }
        console.log('📤 Data to insert:', insertData)

        // Create the project
        console.log('🔄 Attempting to insert project...')
        const { data: project, error: createError } = await supabase
            .from('projects')
            .insert(insertData)
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url)
            `)
            .single()

        if (createError) {
            console.error('❌ Database error details:', {
                code: createError.code,
                message: createError.message,
                details: createError.details,
                hint: createError.hint
            })
            console.error('❌ Insert data that failed:', insertData)
            return NextResponse.json(
                {
                    error: 'Database error',
                    code: createError.code,
                    message: createError.message,
                    details: createError.details,
                    hint: createError.hint
                },
                { status: 500 }
            )
        }

        console.log('✅ Project created successfully:', project.id)

        // Add the owner as a project member with owner role
        const { error: memberError } = await supabase
            .from('project_members')
            .insert({
                project_id: project.id,
                user_id: session.user.id,
                role: 'owner'
            })

        if (memberError) {
            console.error('❌ Failed to add owner as member:', memberError)
            // This is not critical, we can continue
        }

        // Add team members if provided
        if (team_members && Array.isArray(team_members) && team_members.length > 0) {
            console.log('👥 Adding team members:', team_members)

            const memberInserts = team_members
                .filter(memberId => memberId !== session.user.id) // Don't add owner twice
                .map(memberId => ({
                    project_id: project.id,
                    user_id: memberId,
                    role: 'member'
                }))

            if (memberInserts.length > 0) {
                const { error: teamMemberError } = await supabase
                    .from('project_members')
                    .insert(memberInserts)

                if (teamMemberError) {
                    console.error('❌ Failed to add team members:', teamMemberError)
                    // This is not critical, continue with project creation
                } else {
                    console.log('✅ Team members added successfully')
                }
            }
        }

        // Fetch the complete project data with all relationships
        const { data: completeProject, error: fetchError } = await supabase
            .from('projects')
            .select(`
                *,
                owner:users!projects_owner_id_fkey(id, name, email, avatar_url),
                project_members(
                    id,
                    role,
                    user:users!project_members_user_id_fkey(id, name, email, avatar_url)
                ),
                tasks(id, status, priority)
            `)
            .eq('id', project.id)
            .single()

        if (fetchError) {
            console.error('❌ Failed to fetch complete project data:', fetchError)
            // Return basic project data if fetch fails
            return NextResponse.json({
                data: project,
                message: 'Project created successfully'
            }, { status: 201 })
        }

        // Calculate project metrics
        const tasks = completeProject.tasks || []
        const completedTasksCount = tasks.filter((task: { status: string }) => task.status === 'done').length
        const projectWithMetrics = {
            ...completeProject,
            taskCount: tasks.length,
            completedTasks: completedTasksCount,
            memberCount: completeProject.project_members?.length || 0,
            progress: tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0
        }

        console.log('✅ Successfully created project with complete data:', project.id)

        return NextResponse.json({
            data: projectWithMetrics,
            message: 'Project created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
