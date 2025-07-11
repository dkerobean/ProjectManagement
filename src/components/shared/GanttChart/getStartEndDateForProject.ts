import type { ExtendedTask } from './GanttChart'

function getStartEndDateForProject(tasks: ExtendedTask[], projectId: string) {
    const projectTasks = tasks.filter((t) => t.project === projectId)

    // Guard against empty project tasks
    if (!projectTasks || projectTasks.length === 0) {
        const now = new Date()
        return [now, now]
    }

    let start = projectTasks[0].start
    let end = projectTasks[0].end

    for (let i = 0; i < projectTasks.length; i++) {
        const task = projectTasks[i]
        if (start.getTime() > task.start.getTime()) {
            start = task.start
        }
        if (end.getTime() < task.end.getTime()) {
            end = task.end
        }
    }
    return [start, end]
}

export default getStartEndDateForProject
