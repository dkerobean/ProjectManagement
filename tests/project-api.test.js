/**
 * Project API Endpoints Test Suite
 * Tests the project CRUD API endpoints
 */

// Mock Next.js and dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200
    }))
  }
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}))

// Mock validation
jest.mock('zod', () => ({
  z: {
    object: jest.fn(() => ({
      parse: jest.fn()
    })),
    string: jest.fn(() => ({
      min: jest.fn(() => ({ max: jest.fn(() => ({ optional: jest.fn() })) })),
      max: jest.fn(() => ({ optional: jest.fn() })),
      datetime: jest.fn(() => ({ optional: jest.fn() })),
      regex: jest.fn(() => ({ default: jest.fn(() => ({ optional: jest.fn() })) }))
    })),
    enum: jest.fn(() => ({
      default: jest.fn(() => ({ optional: jest.fn() }))
    })),
    record: jest.fn(() => ({ optional: jest.fn() })),
    array: jest.fn(() => ({ optional: jest.fn() }))
  }
}))

// Mock ProjectService
const mockProjectService = {
  createProject: jest.fn(),
  getProjectById: jest.fn(),
  getUserProjects: jest.fn(),
  updateProject: jest.fn(),
  addProjectMember: jest.fn()
}

jest.mock('@/services/ProjectService', () => ({
  ProjectService: mockProjectService
}))

const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

// Test data
const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  name: 'Test User'
}

const mockProject = {
  id: 'project123',
  name: 'Test Project',
  description: 'Test Description',
  status: 'active',
  priority: 'medium',
  owner_id: mockUser.id,
  project_members: [
    {
      user: mockUser,
      role: 'owner'
    }
  ]
}

describe('Project API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup Supabase auth mock
    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    })
  })

  describe('POST /api/projects', () => {
    test('should create a new project successfully', async () => {
      // Setup mocks
      mockProjectService.createProject.mockResolvedValue(mockProject)
      mockProjectService.getProjectById.mockResolvedValue(mockProject)

      // Import the route handler after mocks are set up
      const { POST } = require('../src/app/api/projects/route.js')

      // Create mock request
      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']]),
        json: async () => ({
          name: 'Test Project',
          description: 'Test Description',
          status: 'active',
          priority: 'medium'
        })
      }

      // Call the handler
      const response = await POST(request)

      // Verify the response
      expect(response.status).toBe(201)
      expect(mockProjectService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Project',
          description: 'Test Description'
        }),
        mockUser.id
      )
    })

    test('should return 401 for missing authorization', async () => {
      const { POST } = require('../src/app/api/projects/route.js')

      const request = {
        headers: new Map(),
        json: async () => ({
          name: 'Test Project'
        })
      }

      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/projects', () => {
    test('should list user projects with pagination', async () => {
      mockProjectService.getUserProjects.mockResolvedValue([mockProject])

      const { GET } = require('../src/app/api/projects/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']]),
        url: 'http://localhost/api/projects?page=1&limit=10'
      }

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockProjectService.getUserProjects).toHaveBeenCalledWith(
        mockUser.id,
        undefined
      )
    })

    test('should filter projects by status', async () => {
      mockProjectService.getUserProjects.mockResolvedValue([mockProject])

      const { GET } = require('../src/app/api/projects/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']]),
        url: 'http://localhost/api/projects?status=active'
      }

      const response = await GET(request)

      expect(mockProjectService.getUserProjects).toHaveBeenCalledWith(
        mockUser.id,
        'active'
      )
    })
  })

  describe('GET /api/projects/[id]', () => {
    test('should get single project by ID', async () => {
      mockProjectService.getProjectById.mockResolvedValue(mockProject)

      const { GET } = require('../src/app/api/projects/[id]/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']])
      }

      const params = { id: 'project123' }

      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(
        'project123',
        mockUser.id
      )
    })

    test('should return 400 for invalid project ID', async () => {
      const { GET } = require('../src/app/api/projects/[id]/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']])
      }

      const params = { id: null }

      const response = await GET(request, { params })
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/projects/[id]', () => {
    test('should update project successfully', async () => {
      const updatedProject = { ...mockProject, name: 'Updated Project' }
      mockProjectService.updateProject.mockResolvedValue(updatedProject)

      const { PUT } = require('../src/app/api/projects/[id]/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']]),
        json: async () => ({
          name: 'Updated Project'
        })
      }

      const params = { id: 'project123' }

      const response = await PUT(request, { params })

      expect(response.status).toBe(200)
      expect(mockProjectService.updateProject).toHaveBeenCalledWith(
        'project123',
        expect.objectContaining({ name: 'Updated Project' }),
        mockUser.id
      )
    })

    test('should return 400 for empty update data', async () => {
      const { PUT } = require('../src/app/api/projects/[id]/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']]),
        json: async () => ({})
      }

      const params = { id: 'project123' }

      const response = await PUT(request, { params })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/projects/[id]', () => {
    test('should soft delete project successfully', async () => {
      mockProjectService.getProjectById.mockResolvedValue(mockProject)
      mockProjectService.updateProject.mockResolvedValue({
        ...mockProject,
        status: 'inactive'
      })

      const { DELETE } = require('../src/app/api/projects/[id]/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']])
      }

      const params = { id: 'project123' }

      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      expect(mockProjectService.getProjectById).toHaveBeenCalledWith(
        'project123',
        mockUser.id
      )
      expect(mockProjectService.updateProject).toHaveBeenCalledWith(
        'project123',
        expect.objectContaining({
          status: 'inactive'
        }),
        mockUser.id
      )
    })

    test('should return 403 for insufficient permissions', async () => {
      const projectWithoutOwnership = {
        ...mockProject,
        project_members: [
          {
            user: mockUser,
            role: 'viewer'
          }
        ]
      }

      mockProjectService.getProjectById.mockResolvedValue(projectWithoutOwnership)

      const { DELETE } = require('../src/app/api/projects/[id]/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']])
      }

      const params = { id: 'project123' }

      const response = await DELETE(request, { params })
      expect(response.status).toBe(403)
    })
  })

  describe('Error Handling', () => {
    test('should handle authentication errors', async () => {
      createClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token')
          })
        }
      })

      const { GET } = require('../src/app/api/projects/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer invalid-token']]),
        url: 'http://localhost/api/projects'
      }

      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    test('should handle project service errors', async () => {
      mockProjectService.getUserProjects.mockRejectedValue(
        new Error('Database connection failed')
      )

      const { GET } = require('../src/app/api/projects/route.js')

      const request = {
        headers: new Map([['authorization', 'Bearer valid-token']]),
        url: 'http://localhost/api/projects'
      }

      const response = await GET(request)
      expect(response.status).toBe(500)
    })
  })
})
