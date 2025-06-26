import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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

        // Get projects the user owns
        const { data: ownedProjects } = await supabase
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
            .eq('owner_id', session.user.id)

        // Get projects where user is a member
        const { data: memberProjectIds } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', session.user.id)

        let memberProjects: any[] = []
        if (memberProjectIds && memberProjectIds.length > 0) {
            const projectIds = memberProjectIds.map(m => m.project_id)
            const { data } = await supabase
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
                .in('id', projectIds)
                .neq('owner_id', session.user.id) // Avoid duplicates

            memberProjects = data || []
        }

        // Combine owned and member projects
        let allProjects = [...(ownedProjects || []), ...memberProjects]

        // Apply filters to the combined results
        if (status) {
            allProjects = allProjects.filter(p => p.status === status)
        }

        if (priority) {
            allProjects = allProjects.filter(p => p.priority === priority)
        }

        if (search) {
            const searchLower = search.toLowerCase()
            allProjects = allProjects.filter(p => 
                p.name?.toLowerCase().includes(searchLower) || 
                p.description?.toLowerCase().includes(searchLower)
            )
        }

        // Apply sorting
        allProjects.sort((a, b) => {
            const aValue = a[sortBy] || ''
            const bValue = b[sortBy] || ''
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
            }
        })

        // Apply pagination
        const totalCount = allProjects.length
        const from = (page - 1) * limit
        const to = from + limit
        const paginatedProjects = allProjects.slice(from, to)

        const projects = paginatedProjects
        const error = null
        const count = totalCount

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
            success: true,
            data: projectsWithMetrics,
            message: 'Projects fetched successfully',
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
