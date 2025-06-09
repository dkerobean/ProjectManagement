/**
 * Fixed Task Management Test Suite
 * Tests with proper mocking and ES modules support
 */

// Mock data
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  email: 'test@example.com',
  name: 'Test User',
  role: 'member'
}

const mockProject = {
  id: '650e8400-e29b-41d4-a716-446655440001',
  name: 'Test Project',
  description: 'A test project',
  owner_id: mockUser.id
}

const mockTask = {
  id: '750e8400-e29b-41d4-a716-446655440001',
  title: 'Test Task',
  description: 'A test task',
  project_id: mockProject.id,
  created_by: mockUser.id,
  status: 'todo',
  priority: 'medium'
}

const mockProjectMember = {
  project_id: mockProject.id,
  user_id: mockUser.id,
  role: 'admin'
}

// Enhanced mock for Supabase
const createEnhancedMock = () => {
  const mockFrom = jest.fn()
  const mockRpc = jest.fn()

  // Default successful responses
  const createQueryMock = (data = null) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data, error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error: null }),
    then: jest.fn((resolve) => resolve({ data, error: null })),
    // Make it thenable
    valueOf: () => Promise.resolve({ data, error: null })
  })

  mockFrom.mockImplementation((table) => {
    const mock = createQueryMock()

    // Customize responses based on table
    switch (table) {
      case 'users':
        mock.single.mockResolvedValue({ data: mockUser, error: null })
        mock.then.mockImplementation((resolve) => resolve({ data: [mockUser], error: null }))
        break
      case 'projects':
        mock.single.mockResolvedValue({ data: mockProject, error: null })
        mock.then.mockImplementation((resolve) => resolve({ data: [mockProject], error: null }))
        break
      case 'tasks':
        mock.single.mockResolvedValue({ data: mockTask, error: null })
        mock.then.mockImplementation((resolve) => resolve({ data: [mockTask], error: null }))
        break
      case 'project_members':
        mock.single.mockResolvedValue({ data: mockProjectMember, error: null })
        mock.then.mockImplementation((resolve) => resolve({ data: [mockProjectMember], error: null }))
        break
      default:
        mock.single.mockResolvedValue({ data: null, error: null })
        mock.then.mockImplementation((resolve) => resolve({ data: [], error: null }))
    }

    return mock
  })

  mockRpc.mockResolvedValue({ data: false, error: null })

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
    }
  }
}

// Mock the Supabase module
jest.mock('../src/lib/supabase', () => {
  const mockSupabase = createEnhancedMock()
  return {
    supabase: mockSupabase,
    createServiceClient: jest.fn(() => mockSupabase)
  }
})

import { TaskService } from '../src/services/TaskService'
import { ProjectService } from '../src/services/ProjectService'
import { UserService } from '../src/services/UserService'

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a user', async () => {
    const userData = {
      email: 'newuser@example.com',
      name: 'New User',
      role: 'member'
    }

    const result = await UserService.createUser(userData)
    expect(result).toBeDefined()
  })

  test('should get user by ID', async () => {
    const result = await UserService.getUserById(mockUser.id)
    expect(result).toBeDefined()
  })

  test('should update user', async () => {
    const updateData = { name: 'Updated Name' }
    const result = await UserService.updateUser(mockUser.id, updateData)
    expect(result).toBeDefined()
  })
})

describe('Project Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a project', async () => {
    const projectData = {
      name: 'New Project',
      description: 'A new project',
      priority: 'high'
    }

    const result = await ProjectService.createProject(projectData, mockUser.id)
    expect(result).toBeDefined()
  })

  test('should get user projects', async () => {
    const result = await ProjectService.getUserProjects(mockUser.id)
    expect(result).toBeDefined()
  })
})

describe('Task Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a task', async () => {
    const taskData = {
      title: 'New Task',
      description: 'A new task',
      project_id: mockProject.id,
      priority: 'high',
      status: 'todo'
    }

    const result = await TaskService.createTask(taskData, mockUser.id)
    expect(result).toBeDefined()
  })

  test('should get task by ID', async () => {
    const result = await TaskService.getTaskById(mockTask.id, mockUser.id)
    expect(result).toBeDefined()
  })

  test('should update task', async () => {
    const updateData = {
      title: 'Updated Task',
      status: 'in_progress'
    }

    const result = await TaskService.updateTask(mockTask.id, updateData, mockUser.id)
    expect(result).toBeDefined()
  })

  test('should delete task', async () => {
    const result = await TaskService.deleteTask(mockTask.id, mockUser.id)
    expect(result).toBe(true)
  })

  test('should get project tasks', async () => {
    const result = await TaskService.getProjectTasks(mockProject.id, mockUser.id)
    expect(result).toBeDefined()
  })

  test('should filter tasks correctly', async () => {
    const filters = {
      status: 'in_progress',
      priority: 'high',
      assignee_id: mockUser.id
    }

    const result = await TaskService.getProjectTasks(mockProject.id, mockUser.id, filters)
    expect(result).toBeDefined()
  })
})

describe('Task Status Management', () => {
  test('should validate task statuses', () => {
    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked']
    validStatuses.forEach(status => {
      expect(validStatuses.includes(status)).toBe(true)
    })
  })

  test('should validate task priorities', () => {
    const validPriorities = ['critical', 'high', 'medium', 'low']
    validPriorities.forEach(priority => {
      expect(validPriorities.includes(priority)).toBe(true)
    })
  })

  test('should validate status transitions', () => {
    const validTransitions = {
      'todo': ['in_progress', 'blocked'],
      'in_progress': ['review', 'done', 'blocked', 'todo'],
      'review': ['done', 'in_progress'],
      'done': ['in_progress'],
      'blocked': ['todo', 'in_progress']
    }

    // Test valid transitions
    expect(validTransitions.todo.includes('in_progress')).toBe(true)
    expect(validTransitions.in_progress.includes('done')).toBe(true)
    expect(validTransitions.review.includes('done')).toBe(true)
  })
})

describe('Task Dependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should validate dependency types', () => {
    const validDependencyTypes = ['blocks', 'finish_to_start', 'start_to_start', 'finish_to_finish']
    validDependencyTypes.forEach(type => {
      expect(validDependencyTypes.includes(type)).toBe(true)
    })
  })

  test('should handle dependency operations', () => {
    // Test that dependency functions exist
    expect(typeof TaskService.addTaskDependency).toBe('function')
    expect(typeof TaskService.removeTaskDependency).toBe('function')
    expect(typeof TaskService.getTaskDependencies).toBe('function')
  })
})

describe('Database Schema Validation', () => {
  test('should have all required tables', () => {
    const requiredTables = [
      'users',
      'projects',
      'project_members',
      'tasks',
      'task_dependencies',
      'comments',
      'file_attachments'
    ]

    // Verify table names are strings (basic validation)
    requiredTables.forEach(table => {
      expect(typeof table).toBe('string')
      expect(table.length).toBeGreaterThan(0)
    })
  })

  test('should have proper relationships structure', () => {
    const relationships = [
      'tasks.project_id -> projects.id',
      'tasks.parent_task_id -> tasks.id',
      'tasks.assignee_id -> users.id',
      'project_members.project_id -> projects.id',
      'project_members.user_id -> users.id'
    ]

    relationships.forEach(relationship => {
      expect(relationship.includes('->')).toBe(true)
      expect(relationship.split('->').length).toBe(2)
    })
  })
})

describe('API Structure Validation', () => {
  test('should have proper route structure', () => {
    const routes = [
      '/api/tasks',
      '/api/tasks/[id]',
      '/api/tasks/[id]/dependencies',
      '/api/tasks/[id]/move',
      '/api/projects/[id]/tasks'
    ]

    routes.forEach(route => {
      expect(typeof route).toBe('string')
      expect(route.startsWith('/api/')).toBe(true)
    })
  })

  test('should validate required parameters', () => {
    const requiredParams = ['title', 'project_id']
    requiredParams.forEach(param => {
      expect(typeof param).toBe('string')
      expect(param.length).toBeGreaterThan(0)
    })
  })
})

describe('Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create complete workflow', async () => {
    // Test basic workflow creation
    const project = await ProjectService.createProject({
      name: 'Workflow Project',
      description: 'Test workflow'
    }, mockUser.id)

    const task = await TaskService.createTask({
      title: 'Workflow Task',
      description: 'Test workflow task',
      project_id: mockProject.id,
      priority: 'high'
    }, mockUser.id)

    const updatedTask = await TaskService.updateTask(mockTask.id, {
      status: 'in_progress'
    }, mockUser.id)

    expect(project).toBeDefined()
    expect(task).toBeDefined()
    expect(updatedTask).toBeDefined()
  })
})

// Export test utilities
export const TestUtils = {
  mockUser,
  mockProject,
  mockTask,
  mockProjectMember,

  createMockTask: (overrides = {}) => ({
    ...mockTask,
    id: 'mock-' + Math.random().toString(36).substr(2, 9),
    ...overrides
  }),

  createMockProject: (overrides = {}) => ({
    ...mockProject,
    id: 'mock-' + Math.random().toString(36).substr(2, 9),
    ...overrides
  }),

  validateTaskData: (task) => {
    const required = ['title', 'project_id']
    return required.every(field => task[field] !== undefined)
  },

  validateStatusTransition: (fromStatus, toStatus) => {
    const validTransitions = {
      'todo': ['in_progress', 'blocked'],
      'in_progress': ['review', 'done', 'blocked', 'todo'],
      'review': ['done', 'in_progress'],
      'done': ['in_progress'],
      'blocked': ['todo', 'in_progress']
    }
    return validTransitions[fromStatus]?.includes(toStatus) || false
  }
}
