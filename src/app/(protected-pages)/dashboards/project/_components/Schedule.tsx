'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import GanttChart from '@/components/shared/GanttChart'
import getStartEndDateForProject from '@/components/shared/GanttChart/getStartEndDateForProject'
import type { ExtendedTask } from '@/components/shared/GanttChart'

type ScheduleProps = {
    data: ExtendedTask[]
}

const colorsMap = {
    overallDesign: '#fbbf24',
    design: '#fdba74',
    overallDevelopment: '#6ee7b7',
    development: '#7dd3fc',
}

const Schedule = ({ data = [] }: ScheduleProps) => {
    // Ensure data is always an array and has valid items
    const validData = Array.isArray(data) ? data : []
    const [tasks, setTasks] = useState<ExtendedTask[]>(validData)

    const handleTaskChange = (task: ExtendedTask) => {
        if (!tasks || tasks.length === 0) return

        let newTasks = tasks.map((t) => (t.id === task.id ? task : t))
        if (task.project) {
            const [start, end] = getStartEndDateForProject(
                newTasks,
                task.project,
            )
            const projectIndex = newTasks.findIndex((t) => t.id === task.project)
            if (projectIndex >= 0) {
                const project = newTasks[projectIndex]
                if (
                    project.start.getTime() !== start.getTime() ||
                    project.end.getTime() !== end.getTime()
                ) {
                    const changedProject = { ...project, start, end }
                    newTasks = newTasks.map((t) =>
                        t.id === task.project ? changedProject : t,
                    )
                }
            }
        }
        setTasks(newTasks)
    }

    const handleProgressChange = async (task: ExtendedTask) => {
        if (!tasks || tasks.length === 0) return
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
    }

    const handleExpanderClick = (task: ExtendedTask) => {
        if (!tasks || tasks.length === 0) return
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
    }

    return (
        <Card>
            <div>
                <h4>Schedule</h4>
            </div>
            <div className="mt-4 lg:min-h-[470px]">
                <GanttChart
                    tasks={tasks}
                    colorsMap={colorsMap}
                    onDateChange={handleTaskChange}
                    onProgressChange={handleProgressChange}
                    onExpanderClick={handleExpanderClick}
                />
            </div>
        </Card>
    )
}

export default Schedule
