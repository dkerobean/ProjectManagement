import { ViewMode, Gantt } from 'gantt-task-react'
import TaskListTable from './TaskListTable'
import TaskListHeader from './TaskListHeader'
import TooltipContent from './TooltipContent'
import tasksPreProcess from './tasksPreProcess'
import { PatternLines } from '@visx/pattern'
import type { ExtraCell } from './TaskListTable'
import type { ExtraHeader } from './TaskListHeader'
import type { Task, GanttProps } from 'gantt-task-react'

type ExtendedTask<T extends Record<string, unknown> = NonNullable<unknown>> =
    Task & {
        barVariant?: string
    } & T

type GanttChartProps<T extends Record<string, unknown>> = GanttProps & {
    extraColumns?: Array<{
        header: ExtraHeader
        cell: ExtraCell
    }>
    tasks: ExtendedTask<T>[]
    colorsMap?: Record<string, string>
    showArrow?: boolean
}

const GanttChart = <T extends Record<string, unknown>>(
    props: GanttChartProps<T>,
) => {
    const {
        tasks,
        viewMode = ViewMode.Day,
        extraColumns,
        colorsMap = {},
        showArrow,
        ...rest
    } = props

    // Guard against empty or undefined tasks
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return (
            <>
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                        <div className="text-gray-400 dark:text-gray-500 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No tasks to display</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add some tasks to see them in the Gantt chart</p>
                    </div>
                </div>
                <svg className="h-0 w-0">
                    <PatternLines
                        id="horzLines"
                        height={10}
                        width={10}
                        className="stroke-gray-200 dark:stroke-gray-700"
                        strokeWidth={1.5}
                        background="transparent"
                        orientation={['diagonal']}
                    />
                </svg>
            </>
        )
    }

    return (
        <>
            <Gantt
                tasks={tasksPreProcess(tasks, colorsMap)}
                viewMode={viewMode}
                listCellWidth={'200px'}
                columnWidth={65}
                barProgressColor={'#3380fa'}
                barProgressSelectedColor={'#3380fa'}
                barBackgroundColor={'#e2e8f0'}
                barBackgroundSelectedColor={'#e2e8f0'}
                projectProgressColor={'#6299f1'}
                projectProgressSelectedColor={'#6299f1'}
                projectBackgroundColor="#3380fa"
                projectBackgroundSelectedColor="#3380fa"
                milestoneBackgroundColor="#3380fa"
                milestoneBackgroundSelectedColor="#3380fa"
                todayColor="url(#horzLines)"
                rowHeight={50}
                TaskListHeader={(props) => (
                    <TaskListHeader
                        {...props}
                        extraHeaders={extraColumns?.map((col) => col.header)}
                    />
                )}
                TaskListTable={(props) => (
                    <TaskListTable
                        {...props}
                        extraCells={extraColumns?.map((col) => col.cell)}
                    />
                )}
                TooltipContent={TooltipContent}
                barCornerRadius={6}
                {...(!showArrow ? { arrowColor: 'transparent' } : {})}
                {...rest}
            />
            <svg className="h-0 w-0">
                <PatternLines
                    id="horzLines"
                    height={10}
                    width={10}
                    className="stroke-gray-200 dark:stroke-gray-700"
                    strokeWidth={1.5}
                    background="transparent"
                    orientation={['diagonal']}
                />
            </svg>
        </>
    )
}

export type { Task, ExtendedTask }

export default GanttChart
