import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('🔍 Test API route hit:', request.url)
    return NextResponse.json({ 
        message: 'Test API route working',
        timestamp: new Date().toISOString(),
        url: request.url
    })
}
