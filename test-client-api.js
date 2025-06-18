// Test script to verify client creation API
const testClientCreation = async () => {
    const testClient = {
        name: "API Test Client",
        email: "apitest@example.com",
        phone: "+1-555-9999",
        company: "API Test Company",
        address: "123 API Test St",
        city: "Test City",
        state: "TX",
        country: "USA",
        postal_code: "12345",
        status: "active"
    };

    try {
        const response = await fetch('/api/clients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testClient)
        });

        const result = await response.json();
        console.log('API Response:', result);
        
        if (response.ok) {
            console.log('✅ Client created successfully:', result.data);
        } else {
            console.error('❌ Failed to create client:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
};

// Also test fetching clients
const testClientFetching = async () => {
    try {
        const response = await fetch('/api/clients');
        const result = await response.json();
        console.log('Fetch API Response:', result);
        
        if (response.ok) {
            console.log('✅ Clients fetched successfully. Total:', result.data.total);
            console.log('📋 Clients:', result.data.list);
        } else {
            console.error('❌ Failed to fetch clients:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
};

// Run tests
console.log('🧪 Testing client creation and fetching...');
testClientFetching().then(() => {
    return testClientCreation();
}).then(() => {
    return testClientFetching();
});
