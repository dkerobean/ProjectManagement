'use client'

import { useState } from 'react'
import Tag from '@/components/ui/Tag'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import { TbCircle, TbCircleCheck } from 'react-icons/tb'

type Task = {
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'review' | 'done'
    priority?: 'low' | 'medium' | 'high'
    dueDate?: string
    assignees?: Array<{
        id: string
        name: string
        img: string
    }>
    labels?: string[]
}

const taskLabelColors: Record<string, string> = {
    'Live issue': 'bg-red-100 text-red-700 border-red-200',
    'Task': 'bg-blue-100 text-blue-700 border-blue-200',
    'Bug': 'bg-amber-100 text-amber-700 border-amber-200',
    'Low priority': 'bg-purple-100 text-purple-700 border-purple-200',
}

const priorityColors: Record<string, string> = {
    'low': 'bg-purple-100 text-purple-700 border-purple-200',
    'medium': 'bg-amber-100 text-amber-700 border-amber-200',
    'high': 'bg-red-100 text-red-700 border-red-200',
}

// Sample data - in real app this would come from API
const sampleTasks: Task[] = [
    {
        id: '1',
        title: 'Unable to upload file',
        status: 'todo',
        labels: ['Task', 'Live issue'],
        dueDate: 'August 05',
        assignees: [
            { id: '1', name: 'John Doe', img: '/img/avatars/thumb-1.jpg' },
            { id: '2', name: 'Jane Smith', img: '/img/avatars/thumb-2.jpg' },
            { id: '3', name: 'Mike Johnson', img: '/img/avatars/thumb-3.jpg' }
        ]
    },
    {
        id: '2',
        title: 'Table data incorrect',
        status: 'todo',
        labels: ['Bug'],
        dueDate: 'July 11',
        assignees: [
            { id: '4', name: 'Sarah Wilson', img: '/img/avatars/thumb-4.jpg' }
        ]
    },
    {
        id: '3',
        title: 'Fix broken UI',
        status: 'todo',
        priority: 'low',
        dueDate: 'August 05',
        assignees: [
            { id: '5', name: 'Alex Chen', img: '/img/avatars/thumb-5.jpg' },
            { id: '6', name: 'Emma Davis', img: '/img/avatars/thumb-6.jpg' }
        ]
    },
    {
        id: '4',
        title: 'Fix dashboard layout',
        status: 'in_progress',
        labels: ['Bug'],
        dueDate: 'April 17',
        assignees: [
            { id: '7', name: 'David Brown', img: '/img/avatars/thumb-7.jpg' },
            { id: '8', name: 'Lisa Parker', img: '/img/avatars/thumb-1.jpg' }
        ]
    },
    {
        id: '5',
        title: 'New design',
        status: 'in_progress',
        labels: ['Task'],
        assignees: [
            { id: '9', name: 'Tom Wilson', img: '/img/avatars/thumb-2.jpg' }
        ]
    },
    {
        id: '6',
        title: 'Improve user experiences',
        status: 'in_progress',
        priority: 'low',
        labels: ['Task'],
        dueDate: 'May 20',
        assignees: [
            { id: '10', name: 'Rachel Green', img: '/img/avatars/thumb-3.jpg' }
        ]
    },
    {
        id: '7',
        title: 'Update node environment',
        status: 'review',
        priority: 'low',
        assignees: [
            { id: '11', name: 'Michael Scott', img: '/img/avatars/thumb-4.jpg' }
        ]
    },
    {
        id: '8',
        title: 'Remove user data',
        status: 'review',
        labels: ['Live issue'],
        assignees: [
            { id: '12', name: 'Pam Beesly', img: '/img/avatars/thumb-5.jpg' },
            { id: '13', name: 'Jim Halpert', img: '/img/avatars/thumb-6.jpg' }
        ]
    },
    {
        id: '9',
        title: 'Ready to test',
        status: 'done',
        labels: ['Task'],
        dueDate: 'April 04',
        assignees: [
            { id: '14', name: 'Dwight Schrute', img: '/img/avatars/thumb-7.jpg' },
            { id: '15', name: 'Angela Martin', img: '/img/avatars/thumb-1.jpg' }
        ]
    },
    {
        id: '10',
        title: 'Slow API connection',
        status: 'done',
        labels: ['Bug'],
        dueDate: 'August 19',
        assignees: [
            { id: '16', name: 'Kevin Malone', img: '/img/avatars/thumb-2.jpg' },
            { id: '17', name: 'Oscar Martinez', img: '/img/avatars/thumb-3.jpg' },
            { id: '18', name: 'Stanley Hudson', img: '/img/avatars/thumb-4.jpg' }
        ]
    },
    {
        id: '11',
        title: 'Login failed',
        status: 'done',
        labels: ['Live issue'],
        dueDate: 'May 06',
        assignees: [
            { id: '19', name: 'Phyllis Vance', img: '/img/avatars/thumb-5.jpg' }
        ]
    },
    {
        id: '12',
        title: 'Locale incorrect',
        status: 'done',
        priority: 'low',
        dueDate: 'August 13',
        assignees: [
            { id: '20', name: 'Creed Bratton', img: '/img/avatars/thumb-6.jpg' },
            { id: '21', name: 'Meredith Palmer', img: '/img/avatars/thumb-7.jpg' }
        ]
    }
]

const ProjectDetailsTask = () => {
    const [tasks, setTasks] = useState<Task[]>(sampleTasks)

    const statusSections = [
        { key: 'todo', title: 'To Do', icon: TbCircle },
        { key: 'in_progress', title: 'In Progress', icon: TbCircle },
        { key: 'review', title: 'To Review', icon: TbCircle },
        { key: 'done', title: 'Completed', icon: TbCircleCheck }
    ]

    const getTasksByStatus = (status: string) => {
        return tasks.filter(task => task.status === status)
    }

    const handleTaskStatusChange = (taskId: string, newStatus: string) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
            )
        )
    }

    const TaskCard = ({ task }: { task: Task }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {task.status === 'done' ? (
                        <TbCircleCheck className="text-blue-600 text-lg" />
                    ) : (
                        <TbCircle className="text-gray-400 text-lg cursor-pointer hover:text-blue-600"
                               onClick={() => handleTaskStatusChange(task.id, 'done')} />
                    )}
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                {task.labels?.map((label, index) => (
                    <Tag
                        key={index}
                        className={`px-2 py-1 text-xs rounded-full border ${taskLabelColors[label] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                        {label}
                    </Tag>
                ))}
                {task.priority && (
                    <Tag
                        className={`px-2 py-1 text-xs rounded-full border ${priorityColors[task.priority]}`}
                    >
                        {task.priority === 'low' ? 'Low priority' : task.priority}
                    </Tag>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {task.assignees && task.assignees.length > 0 && (
                        <UsersAvatarGroup users={task.assignees} />
                    )}
                </div>
                {task.dueDate && (
                    <span className="text-sm text-gray-500">{task.dueDate}</span>
                )}
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {statusSections.map((section) => {
                const sectionTasks = getTasksByStatus(section.key)
                const IconComponent = section.icon

                return (
                    <div key={section.key} className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <IconComponent className="text-lg text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                {section.title}
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {sectionTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>

                        {sectionTasks.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No tasks in this section
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default ProjectDetailsTask
