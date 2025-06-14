// Test file to verify ProjectService exports
import { apiGetProject, apiGetProjectMembers } from '@/services/ProjectService'

console.log('Testing ProjectService exports...')
console.log('apiGetProject:', typeof apiGetProject)
console.log('apiGetProjectMembers:', typeof apiGetProjectMembers)

export function testProjectServiceExports() {
    return {
        hasApiGetProject: typeof apiGetProject === 'function',
        hasApiGetProjectMembers: typeof apiGetProjectMembers === 'function'
    }
}
