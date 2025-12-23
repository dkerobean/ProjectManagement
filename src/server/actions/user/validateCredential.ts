'use server'
import type { SignInCredential } from '@/@types/auth'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'

/**
 * Validate user credentials against MongoDB
 * Migrated from Supabase to MongoDB
 */
const validateCredential = async (values: SignInCredential) => {
    const { email, password } = values

    try {
        console.log('🔐 Validating credentials for:', email)

        // Connect to MongoDB
        await connectToDatabase()

        // Find user by email
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            isActive: true 
        })

        if (!user) {
            console.error('❌ User not found:', email)
            return null
        }

        // Verify password
        const isValid = await user.comparePassword(password)

        if (!isValid) {
            console.error('❌ Invalid password for:', email)
            return null
        }

        // Update last login
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })

        console.log('✅ Login successful for:', email, `(${user.role})`)

        return {
            id: user._id.toString(),
            userName: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            timezone: user.timezone,
            preferences: user.preferences,
        }
    } catch (error) {
        console.error('💥 Error validating credentials:', error)
        return null
    }
}

export default validateCredential
