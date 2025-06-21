/**
 * Environment Variables Checker for Debugging Vercel Deployment
 * This helps identify which environment variables are missing or misconfigured
 */

export function checkEnvironmentVariables() {
    const required = {
        'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
        'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
    }

    const optional = {
        'GITHUB_AUTH_CLIENT_ID': process.env.GITHUB_AUTH_CLIENT_ID,
        'GITHUB_AUTH_CLIENT_SECRET': process.env.GITHUB_AUTH_CLIENT_SECRET,
        'GOOGLE_AUTH_CLIENT_ID': process.env.GOOGLE_AUTH_CLIENT_ID,
        'GOOGLE_AUTH_CLIENT_SECRET': process.env.GOOGLE_AUTH_CLIENT_SECRET,
    }

    console.log('🔍 Environment Variables Check:')
    console.log('Environment:', process.env.NODE_ENV)
    console.log('==================================')

    // Check required variables
    console.log('📋 Required Variables:')
    let hasErrors = false

    Object.entries(required).forEach(([key, value]) => {
        if (!value) {
            console.log(`❌ ${key}: MISSING`)
            hasErrors = true
        } else if (value.includes('REPLACE_WITH') || value.includes('your_') || value === 'http://localhost:3000' && process.env.NODE_ENV === 'production') {
            console.log(`⚠️ ${key}: PLACEHOLDER or INCORRECT (${value.substring(0, 30)}...)`)
            hasErrors = true
        } else {
            console.log(`✅ ${key}: SET (${value.substring(0, 30)}...)`)
        }
    })

    // Check optional variables
    console.log('\n📋 Optional Variables (OAuth):')
    Object.entries(optional).forEach(([key, value]) => {
        if (!value) {
            console.log(`ℹ️ ${key}: NOT SET (OAuth provider disabled)`)
        } else {
            console.log(`✅ ${key}: SET`)
        }
    })

    if (hasErrors) {
        console.log('\n❌ CONFIGURATION ERRORS DETECTED!')
        console.log('Please fix the missing/incorrect environment variables.')
        console.log('See: https://vercel.com/docs/concepts/projects/environment-variables')
    } else {
        console.log('\n✅ All required environment variables are properly configured!')
    }

    return !hasErrors
}

// Export for use in server components/actions
export default checkEnvironmentVariables
