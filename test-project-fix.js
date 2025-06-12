// Test project creation after fixing policies and removing budget
const testProjectCreation = async () => {
  try {
    console.log('🧪 Testing project creation after policy fix...');

    const testData = {
      name: 'Test Project After Fix',
      description: 'Testing after fixing infinite recursion and removing budget',
      status: 'active',
      priority: 'medium',
      start_date: '2025-06-12',
      end_date: '2025-06-15',
      metadata: { color: '#3B82F6' }
    };

    console.log('📤 Sending request:', testData);

    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', result);

    if (response.ok) {
      console.log('✅ SUCCESS: Project creation worked!');
      return result;
    } else {
      console.log('❌ FAILED: Project creation failed');
      return null;
    }
  } catch (error) {
    console.error('❌ REQUEST ERROR:', error);
    return null;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testProjectCreation };
}

// Run if this is the main script
if (require.main === module) {
  testProjectCreation();
}
