import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Create test user in MongoDB for GoldTrader Pro
 * POST /api/auth/create-test-user
 */
export async function POST() {
  try {
    await connectToDatabase();

    const testUser = {
      email: 'goldtrader@test.com',
      password: 'GoldTrader123!',
      name: 'Gold Trader Admin',
      role: 'admin' as const,
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists!',
        credentials: {
          email: testUser.email,
          password: testUser.password,
        },
      });
    }

    // Create new user (password will be hashed by pre-save hook)
    await User.create({
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
      role: testUser.role,
      timezone: 'UTC',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully!',
      credentials: {
        email: testUser.email,
        password: testUser.password,
      },
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to create a test user',
    testCredentials: {
      email: 'goldtrader@test.com',
      password: 'GoldTrader123!',
    },
  });
}
