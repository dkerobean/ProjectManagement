import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { ProjectCustomField } from '@/services/ProjectService'

// Custom field validation schema
const customFieldSchema = z.object({
    id: z.string().optional(), // For updates
    name: z.string().min(1, 'Field name is required'),
    type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'multiselect']),
    value: z.any().optional(),
    options: z.array(z.string()).optional(), // For select/multiselect types
    required: z.boolean().default(false),
    description: z.string().optional(),
    order: z.number().optional()
})

const customFieldsArraySchema = z.array(customFieldSchema)

// Validation for custom field values based on type
const validateCustomFieldValue = (field: ProjectCustomField, value: string | number | boolean | string[]): string | number | boolean | string[] => {
    if (field.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Field '${field.name}' is required`)
    }

    if (value === undefined || value === null || value === '') {
        return value // Allow empty values for non-required fields
    }

    switch (field.type) {
        case 'text':
            return typeof value === 'string' ? value : String(value)
        case 'number':
            const num = Number(value)
            if (isNaN(num)) throw new Error(`Field '${field.name}' must be a number`)
            return num
        case 'date':
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return value
            }
            throw new Error(`Field '${field.name}' must be a valid date (YYYY-MM-DD)`)
        case 'boolean':
            return Boolean(value)
        case 'select':
            if (!field.options?.includes(value)) {
                throw new Error(`Field '${field.name}' must be one of: ${field.options?.join(', ')}`)
            }
            return value
        case 'multiselect':
            if (!Array.isArray(value)) {
                throw new Error(`Field '${field.name}' must be an array`)
            }
            const invalid = value.filter(v => !field.options?.includes(v))
            if (invalid.length > 0) {
                throw new Error(`Field '${field.name}' contains invalid options: ${invalid.join(', ')}`)
            }
            return value
        default:
            return value
    }
}

// GET /api/projects/[id]/metadata/custom-fields - Get custom field definitions and values
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔍 GET /api/projects/[id]/metadata/custom-fields - Starting request for project:', params.id)

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

        const metadata = project.metadata as any || {}
        const customFields = metadata.customFields || []

        // Sort by order field
        customFields.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

        console.log('✅ Successfully retrieved custom fields')
        return NextResponse.json({
            projectId: project.id,
            projectName: project.name,
            customFields,
            availableTypes: ['text', 'number', 'date', 'boolean', 'select', 'multiselect']
        })

    } catch (error) {
        console.error('❌ Error in GET /api/projects/[id]/metadata/custom-fields:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/projects/[id]/metadata/custom-fields - Update custom field definitions
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔄 PUT /api/projects/[id]/metadata/custom-fields - Starting request for project:', params.id)

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validatedFields = customFieldsArraySchema.parse(body.customFields || body)

        // Validate field options for select/multiselect types
        for (const field of validatedFields) {
            if (['select', 'multiselect'].includes(field.type) && (!field.options || field.options.length === 0)) {
                throw new Error(`Field '${field.name}' of type '${field.type}' must have options`)
            }
        }

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
                { error: 'Insufficient permissions to edit custom fields' },
                { status: 403 }
            )
        }

        // Assign IDs and order to fields
        const fieldsWithMeta = validatedFields.map((field, index) => ({
            ...field,
            id: field.id || `field_${Date.now()}_${index}`,
            order: field.order ?? index
        }))

        // Update metadata with new custom fields
        const currentMetadata = project.metadata as any || {}
        const updatedMetadata = {
            ...currentMetadata,
            customFields: fieldsWithMeta,
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
            console.error('❌ Error updating custom fields:', updateError)
            return NextResponse.json(
                { error: 'Failed to update custom fields' },
                { status: 500 }
            )
        }

        const customFields = (updatedProject.metadata as any)?.customFields || []

        console.log('✅ Successfully updated custom fields')
        return NextResponse.json({
            projectId: updatedProject.id,
            projectName: updatedProject.name,
            customFields,
            message: 'Custom fields updated successfully'
        })

    } catch (error) {
        console.error('❌ Error in PUT /api/projects/[id]/metadata/custom-fields:', error)

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

// PATCH /api/projects/[id]/metadata/custom-fields - Update custom field values
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔄 PATCH /api/projects/[id]/metadata/custom-fields - Starting request for project:', params.id)

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { fieldValues } = body

        if (!fieldValues || typeof fieldValues !== 'object') {
            return NextResponse.json(
                { error: 'Field values must be provided as an object' },
                { status: 400 }
            )
        }

        const supabase = await createSupabaseServerClient()

        // Get project and custom field definitions
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
                           m.user_id === session.user.id && ['admin', 'member'].includes(m.role)
                       )

        if (!canEdit) {
            return NextResponse.json(
                { error: 'Insufficient permissions to edit field values' },
                { status: 403 }
            )
        }

        const currentMetadata = project.metadata as any || {}
        const customFields = currentMetadata.customFields || []

        // Validate field values against field definitions
        const validatedValues: any = {}
        for (const [fieldId, value] of Object.entries(fieldValues)) {
            const fieldDef = customFields.find((f: any) => f.id === fieldId)
            if (!fieldDef) {
                return NextResponse.json(
                    { error: `Custom field '${fieldId}' not found` },
                    { status: 400 }
                )
            }

            try {
                validatedValues[fieldId] = validateCustomFieldValue(fieldDef, value)
            } catch (error: any) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                )
            }
        }

        // Update field values in custom fields
        const updatedCustomFields = customFields.map((field: any) => ({
            ...field,
            value: validatedValues[field.id] !== undefined ? validatedValues[field.id] : field.value
        }))

        // Update metadata
        const updatedMetadata = {
            ...currentMetadata,
            customFields: updatedCustomFields,
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
            console.error('❌ Error updating field values:', updateError)
            return NextResponse.json(
                { error: 'Failed to update field values' },
                { status: 500 }
            )
        }

        console.log('✅ Successfully updated custom field values')
        return NextResponse.json({
            projectId: updatedProject.id,
            projectName: updatedProject.name,
            customFields: (updatedProject.metadata as any)?.customFields || [],
            message: 'Custom field values updated successfully'
        })

    } catch (error) {
        console.error('❌ Error in PATCH /api/projects/[id]/metadata/custom-fields:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
