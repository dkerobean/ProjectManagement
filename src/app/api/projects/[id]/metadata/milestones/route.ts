import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { ProjectMilestone } from '@/services/ProjectService'

// Milestone validation schema
const milestoneSchema = z.object({
    name: z.string().min(1, 'Milestone name is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    completed: z.boolean().default(false),
    description: z.string().optional()
})

const milestonesArraySchema = z.array(milestoneSchema)

// GET /api/projects/[id]/metadata/milestones - Get project milestones
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔍 GET /api/projects/[id]/metadata/milestones - Starting request for project:', params.id)

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const supabase = await createSupabaseServerClient()

        // Check if user has access to this project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                metadata,
                owner_id,
                project_members!inner(user_id, role)
            `)
            .eq('id', params.id)
            .or(`owner_id.eq.${session.user.id},project_members.user_id.eq.${session.user.id}`)
            .single()

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found or access denied' },
                { status: 404 }
            )
        }

        const metadata = project.metadata as Record<string, unknown> || {}
        const milestones = (metadata.milestones as ProjectMilestone[]) || []

        // Calculate milestone statistics
        const stats = {
            total: milestones.length,
            completed: milestones.filter(m => m.completed).length,
            upcoming: milestones.filter(m => !m.completed && new Date(m.date) > new Date()).length,
            overdue: milestones.filter(m => !m.completed && new Date(m.date) < new Date()).length
        }

        console.log('✅ Successfully retrieved project milestones')
        return NextResponse.json({
            projectId: project.id,
            projectName: project.name,
            milestones,
            stats
        })

    } catch (error) {
        console.error('❌ Error in GET /api/projects/[id]/metadata/milestones:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/projects/[id]/metadata/milestones - Update project milestones
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔄 PUT /api/projects/[id]/metadata/milestones - Starting request for project:', params.id)

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validatedMilestones = milestonesArraySchema.parse(body.milestones || body)

        const supabase = await createSupabaseServerClient()

        // Check if user has permission to edit this project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
                id,
                metadata,
                owner_id,
                project_members!inner(user_id, role)
            `)
            .eq('id', params.id)
            .single()

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Check permissions
        const canEdit = project.owner_id === session.user.id ||
                       project.project_members?.some(m =>
                           m.user_id === session.user.id && ['admin', 'owner'].includes(m.role)
                       )

        if (!canEdit) {
            return NextResponse.json(
                { error: 'Insufficient permissions to edit project milestones' },
                { status: 403 }
            )
        }

        // Update metadata with new milestones
        const currentMetadata = project.metadata as Record<string, unknown> || {}
        const updatedMetadata = {
            ...currentMetadata,
            milestones: validatedMilestones,
            lastModified: new Date().toISOString(),
            lastModifiedBy: session.user.id
        }

        // Update the project
        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .select('id, name, metadata')
            .single()

        if (updateError) {
            console.error('❌ Error updating project milestones:', updateError)
            return NextResponse.json(
                { error: 'Failed to update project milestones' },
                { status: 500 }
            )
        }

        const milestones = ((updatedProject.metadata as Record<string, unknown>)?.milestones as ProjectMilestone[]) || []
        const stats = {
            total: milestones.length,
            completed: milestones.filter(m => m.completed).length,
            upcoming: milestones.filter(m => !m.completed && new Date(m.date) > new Date()).length,
            overdue: milestones.filter(m => !m.completed && new Date(m.date) < new Date()).length
        }

        console.log('✅ Successfully updated project milestones')
        return NextResponse.json({
            projectId: updatedProject.id,
            projectName: updatedProject.name,
            milestones,
            stats,
            message: 'Project milestones updated successfully'
        })

    } catch (error) {
        console.error('❌ Error in PUT /api/projects/[id]/metadata/milestones:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
