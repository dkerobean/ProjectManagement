import { NextResponse } from 'next/server'

export async function GET() {
    console.log('🧪 Test route hit: /api/debug/routes')
    
    const tests = {
        '/api/debug/routes': 'This route - working ✅',
        '/api/projects': 'Projects list route',
        '/api/projects/[id]': 'Single project route',
        '/api/projects/[id]/tasks': 'Project tasks route (THE FAILING ONE)',
        '/api/clients': 'Clients list route', 
        '/api/clients/[id]': 'Single client route (ALSO FAILING)',
        '/api/tasks': 'Tasks list route'
    }

    return NextResponse.json({
        message: 'Debug Routes Test',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        routes_to_test: tests,
        next_steps: [
            '1. Test each route individually',
            '2. Check Vercel function logs',
            '3. Verify environment variables',
            '4. Check for build issues'
        ]
    })
}
