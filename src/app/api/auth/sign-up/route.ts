import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json()

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: { message: 'Email, password, and name are required' } },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: { message: 'Invalid email format' } },
                { status: 400 }
            )
        }

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json(
                { error: { message: 'Password must be at least 6 characters' } },
                { status: 400 }
            )
        }

        console.log('🔐 Creating new user account for:', email)

        // Connect to MongoDB
        await connectToDatabase()

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            console.log('❌ User already exists:', email)
            return NextResponse.json(
                { error: { message: 'An account with this email already exists' } },
                { status: 409 }
            )
        }

        // Create new user (password will be hashed by pre-save hook)
        const newUser = await User.create({
            email: email.toLowerCase(),
            password,
            name,
            role: 'member',
            timezone: 'UTC',
            isActive: true,
        })

        console.log('✅ User created successfully:', newUser._id)

        return NextResponse.json({
            message: 'Account created successfully',
            user: {
                id: newUser._id.toString(),
                email: newUser.email,
                name: newUser.name,
            }
        })

    } catch (error) {
        console.error('❌ Sign up API error:', error)
        
        // Handle mongoose validation errors
        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json(
                { error: { message: 'Invalid data provided' } },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: { message: 'An unexpected error occurred. Please try again.' } },
            { status: 500 }
        )
    }
}
