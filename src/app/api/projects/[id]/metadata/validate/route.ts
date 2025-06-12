import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { MetadataValidator } from '@/utils/metadata'

// Validation schema for metadata validation request
const validationRequestSchema = z.object({
    metadata: z.record(z.any()).optional(),
    milestones: z.array(z.any()).optional(),
    customFields: z.array(z.any()).optional(),
    budget: z.object({
        allocated: z.number(),
        spent: z.number(),
        currency: z.string()
    }).optional()
})

// POST /api/projects/[id]/metadata/validate - Validate metadata without saving
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('🔍 POST /api/projects/[id]/metadata/validate - Starting validation for project:', params.id)

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validationRequest = validationRequestSchema.parse(body)

        const supabase = await createSupabaseServerClient()

        // Check if user has access to this project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
                id,
                name,
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

        const validationResults = {
            isValid: true,
            errors: [] as string[],
            warnings: [] as string[],
            fieldValidation: {} as Record<string, { isValid: boolean; errors: string[] }>
        }

        // Validate full metadata if provided
        if (validationRequest.metadata) {
            const metadataErrors = MetadataValidator.validateMetadata(validationRequest.metadata as any)
            validationResults.errors.push(...metadataErrors)
        }

        // Validate milestones if provided
        if (validationRequest.milestones) {
            validationRequest.milestones.forEach((milestone: any, index: number) => {
                const milestoneErrors = MetadataValidator.validateMilestone(milestone)
                if (milestoneErrors.length > 0) {
                    validationResults.fieldValidation[`milestone_${index}`] = {
                        isValid: false,
                        errors: milestoneErrors
                    }
                    validationResults.errors.push(...milestoneErrors.map(e => `Milestone ${index + 1}: ${e}`))
                } else {
                    validationResults.fieldValidation[`milestone_${index}`] = {
                        isValid: true,
                        errors: []
                    }
                }
            })
        }

        // Validate custom fields if provided
        if (validationRequest.customFields) {
            validationRequest.customFields.forEach((field: any, index: number) => {
                const fieldErrors = MetadataValidator.validateCustomField(field)
                if (fieldErrors.length > 0) {
                    validationResults.fieldValidation[`customField_${index}`] = {
                        isValid: false,
                        errors: fieldErrors
                    }
                    validationResults.errors.push(...fieldErrors.map(e => `Custom field ${index + 1}: ${e}`))
                } else {
                    validationResults.fieldValidation[`customField_${index}`] = {
                        isValid: true,
                        errors: []
                    }
                }
            })
        }

        // Validate budget if provided
        if (validationRequest.budget) {
            const budgetErrors = MetadataValidator.validateBudget(validationRequest.budget as any)
            if (budgetErrors.length > 0) {
                validationResults.fieldValidation['budget'] = {
                    isValid: false,
                    errors: budgetErrors
                }
                validationResults.errors.push(...budgetErrors.map(e => `Budget: ${e}`))
            } else {
                validationResults.fieldValidation['budget'] = {
                    isValid: true,
                    errors: []
                }
            }
        }

        // Add warnings for potential issues
        if (validationRequest.milestones && validationRequest.milestones.length > 20) {
            validationResults.warnings.push('Large number of milestones may impact performance')
        }

        if (validationRequest.customFields && validationRequest.customFields.length > 15) {
            validationResults.warnings.push('Large number of custom fields may affect user experience')
        }

        validationResults.isValid = validationResults.errors.length === 0

        console.log('✅ Validation completed:', {
            isValid: validationResults.isValid,
            errorCount: validationResults.errors.length,
            warningCount: validationResults.warnings.length
        })

        return NextResponse.json({
            projectId: project.id,
            projectName: project.name,
            validation: validationResults,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('❌ Error in POST /api/projects/[id]/metadata/validate:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Invalid validation request',
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
