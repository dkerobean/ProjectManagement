import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Project metadata validation schemas
const milestoneSchema = z.object({
    name: z.string().min(1, 'Milestone name is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    completed: z.boolean().default(false),
    description: z.string().optional()
})

const budgetSchema = z.object({
    allocated: z.number().min(0, 'Allocated budget must be non-negative'),
    spent: z.number().min(0, 'Spent amount must be non-negative').default(0),
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']).default('USD')
})

const clientSchema = z.object({
    name: z.string().min(1, 'Client name is required'),
    contact: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional()
})

const customFieldSchema = z.object({
    name: z.string().min(1, 'Field name is required'),
    type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'multiselect']),
    value: z.any(),
    options: z.array(z.string()).optional(), // For select/multiselect types
    required: z.boolean().default(false),
    description: z.string().optional()
})

const projectMetadataSchema = z.object({
    template: z.enum(['software', 'marketing', 'research', 'construction', 'event', 'consulting', 'other']).optional(),
    budget: budgetSchema.optional(),
    client: clientSchema.optional(),
    milestones: z.array(milestoneSchema).default([]),
    customFields: z.array(customFieldSchema).default([]),
    tags: z.array(z.string()).default([]),
    settings: z.object({
        allowPublicAccess: z.boolean().default(false),
        requireApproval: z.boolean().default(false),
        autoArchive: z.boolean().default(false),
        notificationLevel: z.enum(['all', 'important', 'none']).default('important')
    }).optional(),
    integration: z.object({
        githubRepo: z.string().optional(),
        slackChannel: z.string().optional(),
        jiraProject: z.string().optional(),
        externalId: z.string().optional()
    }).optional()
})

// GET /api/projects/[id]/metadata - Get project metadata
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔍 GET /api/projects/[id]/metadata - Starting request for project:', params.id)

        // Get the current session
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

        // Return the metadata with additional structure information
        const response = {
            projectId: project.id,
            projectName: project.name,
            metadata: project.metadata || {},
            schema: {
                templates: ['software', 'marketing', 'research', 'construction', 'event', 'consulting', 'other'],
                currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
                customFieldTypes: ['text', 'number', 'date', 'boolean', 'select', 'multiselect'],
                notificationLevels: ['all', 'important', 'none']
            },
            permissions: {
                canEdit: project.owner_id === session.user.id ||
                        project.project_members?.some(m =>
                            m.user_id === session.user.id && ['admin', 'owner'].includes(m.role)
                        )
            }
        }

        console.log('✅ Successfully retrieved project metadata')
        return NextResponse.json(response)

    } catch (error) {
        console.error('❌ Error in GET /api/projects/[id]/metadata:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/projects/[id]/metadata - Update project metadata
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔄 PATCH /api/projects/[id]/metadata - Starting request for project:', params.id)

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate the metadata
        const validatedMetadata = projectMetadataSchema.parse(body)

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
                { error: 'Insufficient permissions to edit project metadata' },
                { status: 403 }
            )
        }

        // Merge with existing metadata
        const currentMetadata = project.metadata || {}
        const updatedMetadata = {
            ...currentMetadata,
            ...validatedMetadata,
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
            console.error('❌ Error updating project metadata:', updateError)
            return NextResponse.json(
                { error: 'Failed to update project metadata' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully updated project metadata')
        return NextResponse.json({
            projectId: updatedProject.id,
            projectName: updatedProject.name,
            metadata: updatedProject.metadata,
            message: 'Project metadata updated successfully'
        })

    } catch (error) {
        console.error('❌ Error in PATCH /api/projects/[id]/metadata:', error)

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

// PUT /api/projects/[id]/metadata - Replace project metadata entirely
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔄 PUT /api/projects/[id]/metadata - Starting request for project:', params.id)

        // Get the current session
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate the metadata
        const validatedMetadata = projectMetadataSchema.parse(body)

        const supabase = await createSupabaseServerClient()

        // Check if user has permission to edit this project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
                id,
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
                { error: 'Insufficient permissions to edit project metadata' },
                { status: 403 }
            )
        }

        // Replace metadata entirely
        const newMetadata = {
            ...validatedMetadata,
            lastModified: new Date().toISOString(),
            lastModifiedBy: session.user.id
        }

        // Update the project
        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({
                metadata: newMetadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .select('id, name, metadata')
            .single()

        if (updateError) {
            console.error('❌ Error replacing project metadata:', updateError)
            return NextResponse.json(
                { error: 'Failed to replace project metadata' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully replaced project metadata')
        return NextResponse.json({
            projectId: updatedProject.id,
            projectName: updatedProject.name,
            metadata: updatedProject.metadata,
            message: 'Project metadata replaced successfully'
        })

    } catch (error) {
        console.error('❌ Error in PUT /api/projects/[id]/metadata:', error)

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
