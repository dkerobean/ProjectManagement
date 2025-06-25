import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        message: 'Test API route with nested dynamic params working',
        timestamp: new Date().toISOString(),
        route: '/api/test-projects/[id]/test-tasks'
    })
}
