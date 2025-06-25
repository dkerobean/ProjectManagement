import type { Session } from 'next-auth'

export type UserRole = 'admin' | 'project_manager' | 'member' | 'viewer'

export const ROLES: Record<string, UserRole> = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  member: 2,
  project_manager: 3,
  admin: 4,
}

// Role permissions
export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_projects',
    'manage_system',
    'view_all_projects',
    'edit_all_projects',
    'delete_projects',
    'assign_roles',
    'view_analytics',
  ],
  project_manager: [
    'manage_projects',
    'view_assigned_projects',
    'edit_assigned_projects',
    'manage_project_members',
    'view_project_analytics',
    'create_tasks',
    'assign_tasks',
  ],
  member: [
    'view_assigned_projects',
    'edit_assigned_tasks',
    'comment_on_tasks',
    'upload_files',
    'view_team_members',
  ],
  viewer: [
    'view_assigned_projects',
    'view_tasks',
    'view_comments',
    'view_team_members',
  ],
} as const

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole | undefined, permission: string): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): UserRole | undefined {
  return session?.user?.role as UserRole
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(session: Session | null): boolean {
  const role = getUserRole(session)
  return hasRole(role, ROLES.ADMIN)
}

/**
 * Check if user can manage projects
 */
export function canManageProjects(session: Session | null): boolean {
  const role = getUserRole(session)
  return hasRole(role, ROLES.PROJECT_MANAGER)
}

/**
 * Check if user can edit content
 */
export function canEditContent(session: Session | null): boolean {
  const role = getUserRole(session)
  return hasRole(role, ROLES.MEMBER)
}

/**
 * Get allowed routes based on user role
 */
export function getAllowedRoutes(userRole: UserRole | undefined): string[] {
  if (!userRole) return []

  const baseRoutes = [
    '/dashboards/project',
    '/profile',
    '/settings',
  ]

  if (hasRole(userRole, ROLES.MEMBER)) {
    baseRoutes.push(
      '/projects',
      '/tasks',
      '/files',
    )
  }

  if (hasRole(userRole, ROLES.PROJECT_MANAGER)) {
    baseRoutes.push(
      '/project-management',
      '/team-management',
      '/analytics',
    )
  }

  if (hasRole(userRole, ROLES.ADMIN)) {
    baseRoutes.push(
      '/admin',
      '/user-management',
      '/system-settings',
      '/audit-logs',
    )
  }

  return baseRoutes
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    member: 'Member',
    viewer: 'Viewer',
  }
  return displayNames[role] || role
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Full system access with user and system management capabilities',
    project_manager: 'Can manage projects, assign tasks, and oversee team members',
    member: 'Can contribute to projects, complete tasks, and collaborate with team',
    viewer: 'Read-only access to assigned projects and tasks',
  }
  return descriptions[role] || ''
}

/**
 * Get available roles for assignment (excluding roles higher than current user)
 */
export function getAssignableRoles(currentUserRole: UserRole | undefined): UserRole[] {
  if (!currentUserRole) return []

  const allRoles: UserRole[] = ['viewer', 'member', 'project_manager', 'admin']
  const currentLevel = ROLE_HIERARCHY[currentUserRole]

  return allRoles.filter(role => ROLE_HIERARCHY[role] <= currentLevel)
}

/**
 * Check if user can assign a specific role
 */
export function canAssignRole(currentUserRole: UserRole | undefined, targetRole: UserRole): boolean {
  if (!currentUserRole) return false
  return ROLE_HIERARCHY[currentUserRole] >= ROLE_HIERARCHY[targetRole]
}
