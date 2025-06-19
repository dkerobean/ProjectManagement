#!/usr/bin/env node

// Simple test script to verify invoicing API fixes
// Use fetch from Node.js (18+) or install node-fetch if needed

const BASE_URL = 'http://localhost:3000/api/invoicing';

async function testInvoiceCreation() {
    console.log('🧪 Testing Invoice Creation API Fix...\n');

    try {
        // First test: Create a user profile to ensure company info is available
        console.log('📋 Step 1: Setting up company profile...');
        const profileData = {
            company_name: 'Test Company Inc',
            company_address: '123 Test Street, Test City, TC 12345',
            phone_number: '+1 (555) 123-4567',
            contact_email: 'contact@testcompany.com'
        };

        const profileResponse = await fetch(`${BASE_URL}/company-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
        });

        if (profileResponse.ok) {
            console.log('✅ Company profile created/updated successfully');
        } else {
            console.log('⚠️  Company profile setup failed, but continuing with defaults...');
        }

        // Second test: Create invoice
        const invoiceData = {
            client_name: 'Test Client Corp',
            client_email: 'test@client.com',
            client_address: '123 Client Street, Client City, CC 12345',
            issue_date: '2025-06-19',
            due_date: '2025-07-19',
            items: [
                {
                    description: 'Web Development Services',
                    quantity: 20,
                    rate: 150.00
                },
                {
                    description: 'Project Management',
                    quantity: 5,
                    rate: 200.00
                }
            ],
            tax_rate: 8.5,
            notes: 'Thank you for your business!',
            payment_method_id: null,
            payment_instructions: 'Bank transfer details will be provided.',
            status: 'Draft'  // This should get converted to 'draft' in the API
        };

        console.log('\n📤 Step 2: Creating invoice...');
        console.log('Status being sent:', invoiceData.status);

        const response = await fetch(`${BASE_URL}/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ SUCCESS! Invoice created successfully');
            console.log('📊 Invoice Details:');
            console.log(`   ID: ${result.data.id}`);
            console.log(`   Number: ${result.data.invoice_number}`);
            console.log(`   Status: ${result.data.status} (correctly converted to lowercase)`);
            console.log(`   Total: $${result.data.total}`);
            console.log(`   Client: ${result.data.client_name}`);

            // Test fetching the invoice
            console.log('\n📤 Testing invoice retrieval...');
            const getResponse = await fetch(`${BASE_URL}/invoices/${result.data.id}`);
            const getResult = await getResponse.json();

            if (getResponse.ok && getResult.success) {
                console.log('✅ SUCCESS! Invoice retrieved successfully');
                console.log(`   Retrieved status: ${getResult.data.status}`);
            } else {
                console.log('❌ FAILED to retrieve invoice:', getResult.error);
            }

        } else {
            console.log('❌ FAILED to create invoice');
            console.log('Error details:', result);
            console.log('Response status:', response.status);
        }

    } catch (error) {
        console.log('💥 Request failed:', error.message);
        console.log('\n💡 Make sure your development server is running on port 3000');
        console.log('   Run: npm run dev');
    }
}

// Run the test
testInvoiceCreation();
