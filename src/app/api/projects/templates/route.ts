import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { METADATA_CONSTANTS, MetadataUtils } from '@/utils/metadata'

// GET /api/projects/templates - Get available project templates
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 GET /api/projects/templates - Starting request')

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - No valid session' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const templateType = searchParams.get('type')

        // Template definitions
        const templates = [
            {
                id: 'software',
                name: 'Software Development',
                description: 'For software development projects with code repositories, tech stacks, and development workflows',
                category: 'Technology',
                icon: '💻',
                features: [
                    'Repository integration',
                    'Technology stack tracking',
                    'Sprint planning',
                    'Code review workflows'
                ],
                defaultMetadata: MetadataUtils.getTemplateDefaults('software')
            },
            {
                id: 'marketing',
                name: 'Marketing Campaign',
                description: 'For marketing campaigns with audience targeting, budget tracking, and campaign analytics',
                category: 'Marketing',
                icon: '📢',
                features: [
                    'Campaign type classification',
                    'Target audience definition',
                    'Budget allocation',
                    'ROI tracking'
                ],
                defaultMetadata: MetadataUtils.getTemplateDefaults('marketing')
            },
            {
                id: 'research',
                name: 'Research Project',
                description: 'For research projects with methodology tracking, data collection, and analysis phases',
                category: 'Academic',
                icon: '🔬',
                features: [
                    'Research methodology',
                    'Sample size tracking',
                    'Data collection phases',
                    'Publication timeline'
                ],
                defaultMetadata: MetadataUtils.getTemplateDefaults('research')
            },
            {
                id: 'construction',
                name: 'Construction Project',
                description: 'For construction projects with permits, contractors, and milestone tracking',
                category: 'Construction',
                icon: '🏗️',
                features: [
                    'Permit tracking',
                    'Contractor management',
                    'Material procurement',
                    'Safety compliance'
                ],
                defaultMetadata: {
                    customFields: [
                        {
                            id: 'permit_status',
                            name: 'Permit Status',
                            type: 'select' as const,
                            options: ['Pending', 'Approved', 'Denied', 'Under Review'],
                            required: true,
                            order: 0
                        },
                        {
                            id: 'contractor',
                            name: 'Primary Contractor',
                            type: 'text' as const,
                            required: false,
                            order: 1
                        }
                    ]
                }
            },
            {
                id: 'event',
                name: 'Event Planning',
                description: 'For event planning with venue management, vendor coordination, and attendee tracking',
                category: 'Events',
                icon: '🎉',
                features: [
                    'Venue booking',
                    'Vendor management',
                    'Attendee registration',
                    'Budget allocation'
                ],
                defaultMetadata: {
                    customFields: [
                        {
                            id: 'venue',
                            name: 'Venue',
                            type: 'text' as const,
                            required: false,
                            order: 0
                        },
                        {
                            id: 'expected_attendees',
                            name: 'Expected Attendees',
                            type: 'number' as const,
                            required: false,
                            order: 1
                        },
                        {
                            id: 'event_type',
                            name: 'Event Type',
                            type: 'select' as const,
                            options: ['Conference', 'Workshop', 'Meeting', 'Party', 'Training', 'Other'],
                            required: true,
                            order: 2
                        }
                    ]
                }
            },
            {
                id: 'consulting',
                name: 'Consulting Project',
                description: 'For consulting projects with client deliverables, hourly tracking, and milestone billing',
                category: 'Business',
                icon: '💼',
                features: [
                    'Client management',
                    'Hourly rate tracking',
                    'Deliverable timeline',
                    'Billing milestones'
                ],
                defaultMetadata: {
                    customFields: [
                        {
                            id: 'hourly_rate',
                            name: 'Hourly Rate',
                            type: 'number' as const,
                            required: false,
                            description: 'Rate per hour in project currency',
                            order: 0
                        },
                        {
                            id: 'deliverable_type',
                            name: 'Primary Deliverable',
                            type: 'select' as const,
                            options: ['Report', 'Strategy', 'Implementation', 'Training', 'Audit', 'Other'],
                            required: false,
                            order: 1
                        }
                    ]
                }
            },
            {
                id: 'other',
                name: 'Custom Project',
                description: 'A blank template for projects that don\'t fit standard categories',
                category: 'General',
                icon: '📁',
                features: [
                    'Flexible structure',
                    'Custom fields',
                    'Milestone tracking',
                    'Basic collaboration'
                ],
                defaultMetadata: MetadataUtils.getMetadataDefaults()
            }
        ]

        // Filter by type if specified
        const filteredTemplates = templateType
            ? templates.filter(t => t.id === templateType)
            : templates

        // Group templates by category
        const categorizedTemplates = filteredTemplates.reduce((acc, template) => {
            if (!acc[template.category]) {
                acc[template.category] = []
            }
            acc[template.category].push(template)
            return acc
        }, {} as Record<string, typeof templates>)

        const response = {
            templates: filteredTemplates,
            categorized: categorizedTemplates,
            categories: [...new Set(templates.map(t => t.category))],
            constants: {
                availableTypes: METADATA_CONSTANTS.TEMPLATES,
                currencies: METADATA_CONSTANTS.CURRENCIES,
                customFieldTypes: METADATA_CONSTANTS.CUSTOM_FIELD_TYPES,
                notificationLevels: METADATA_CONSTANTS.NOTIFICATION_LEVELS
            }
        }

        console.log('✅ Successfully retrieved project templates')
        return NextResponse.json(response)

    } catch (error) {
        console.error('❌ Error in GET /api/projects/templates:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
