// Simple test script to test project creation without budget field
const testProjectCreation = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Project Without Budget',
        description: 'Testing project creation after removing budget field',
        status: 'active',
        priority: 'medium',
        start_date: '2025-06-12',
        end_date: '2025-06-15',
        metadata: { color: '#3B82F6' }
      })
    });

    const result = await response.json();
    console.log('Response:', result);
    console.log('Status:', response.status);

    if (response.ok) {
      console.log('✅ Project creation successful');
    } else {
      console.log('❌ Project creation failed');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
};

// Only run if this is the main module
if (require.main === module) {
  testProjectCreation();
}

module.exports = { testProjectCreation };
