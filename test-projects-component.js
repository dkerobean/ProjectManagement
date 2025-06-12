// Test to verify ProjectsContent component loads without errors
const React = require('react');

// Mock the imports that are causing issues
jest.mock('../_store/projectsStore', () => ({
    useProjectsStore: () => ({
        projects: [],
        searchQuery: '',
        statusFilter: '',
        priorityFilter: '',
        sortBy: 'name',
        sortOrder: 'asc',
        toggleProjectFavorite: jest.fn()
    })
}));

describe('ProjectsContent Component', () => {
    test('should import without errors', async () => {
        // This test ensures the component can be imported without build errors
        expect(() => {
            require('../src/app/(protected-pages)/concepts/projects/_components/ProjectsContent.tsx');
        }).not.toThrow();
    });
});
