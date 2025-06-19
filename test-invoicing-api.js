// Test script for Invoicing Backend API
// This script tests all the API endpoints we've created

const BASE_URL = 'http://localhost:3000/api/invoicing'

async function testAPI(endpoint, options = {}) {
    try {
        console.log(`\n🔄 Testing ${options.method || 'GET'} ${endpoint}`)
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        })

        const data = await response.json()

        if (response.ok) {
            console.log(`✅ Success:`, data)
            return data
        } else {
            console.log(`❌ Error:`, data)
            return null
        }
    } catch (error) {
        console.log(`💥 Request failed:`, error.message)
        return null
    }
}

async function runTests() {
    console.log('🚀 Starting Invoicing Backend API Tests\n')

    // Test 1: Generate Invoice Number
    console.log('📋 Test 1: Generate Invoice Number')
    await testAPI('/generate-invoice-number')

    // Test 2: Company Profile
    console.log('\n📋 Test 2: Company Profile Management')

    // Get profile (should be empty initially)
    await testAPI('/company-profile')

    // Create profile
    const profileData = {
        company_name: 'Test Company Inc',
        company_address: '123 Test Street, Test City, TC 12345',
        phone_number: '+1 (555) 123-4567',
        contact_email: 'contact@testcompany.com',
        logo_url: 'https://example.com/logo.png'
    }
    await testAPI('/company-profile', {
        method: 'POST',
        body: JSON.stringify(profileData)
    })

    // Get profile again (should have data)
    await testAPI('/company-profile')

    // Test 3: Payment Methods
    console.log('\n📋 Test 3: Payment Methods Management')

    // Get payment methods (should be empty initially)
    await testAPI('/payment-methods')

    // Create payment method
    const paymentMethodData = {
        method_name: 'Primary Bank Account',
        payment_instructions: 'Bank Name: Test Bank\\nAccount Number: 1234567890\\nRouting Number: 123456789\\nAccount Name: Test Company Inc'
    }
    const paymentMethodResult = await testAPI('/payment-methods', {
        method: 'POST',
        body: JSON.stringify(paymentMethodData)
    })

    // Get payment methods again (should have data)
    await testAPI('/payment-methods')

    // Test 4: Invoice Creation
    console.log('\n📋 Test 4: Invoice Management')

    // Get invoices (should be empty initially)
    await testAPI('/invoices')

    // Create invoice
    const invoiceData = {
        client_name: 'Acme Corporation',
        client_email: 'billing@acme.com',
        client_address: '456 Client Street, Client City, CC 67890',
        issue_date: '2025-06-19',
        due_date: '2025-07-19',
        items: [
            {
                description: 'Web Development Services',
                quantity: 40,
                rate: 100.00
            },
            {
                description: 'Project Management',
                quantity: 10,
                rate: 150.00
            }
        ],
        tax_rate: 8.5,
        notes: 'Thank you for your business!',
        payment_method_id: paymentMethodResult?.data?.id || null,
        payment_instructions: paymentMethodData.payment_instructions,
        status: 'Draft'
    }

    const invoiceResult = await testAPI('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
    })

    // Get invoices again (should have data)
    await testAPI('/invoices')

    if (invoiceResult?.data?.id) {
        // Test invoice update (status change)
        await testAPI(`/invoices/${invoiceResult.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Sent' })
        })

        // Get specific invoice
        await testAPI(`/invoices/${invoiceResult.data.id}`)
    }

    console.log('\n🎉 All tests completed!')
    console.log('\n💡 To run these tests:')
    console.log('1. Make sure your Next.js development server is running on port 3000')
    console.log('2. Run: node test-invoicing-api.js')
    console.log('\n📝 Note: This is a test script for development purposes.')
}

// Export for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testAPI, runTests }
}

// Auto-run if executed directly
if (typeof window === 'undefined' && require.main === module) {
    runTests()
}
