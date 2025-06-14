'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'

type Task = {
    id?: string
    title: string
    due_date?: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    checked: boolean
}

type NewTaskFieldProps = {
    projectId?: string
    onAddNewTask: (taskCount: {
        completedTask: number
        totalTask: number
        tasks: Task[]
    }) => void
}

const NewTaskField = ({ projectId, onAddNewTask }: NewTaskFieldProps) => {
    const [newTaskEdit, setNewTaskEdit] = useState(false)
    const [taskList, setTaskList] = useState<Task[]>([])
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskDueDate, setNewTaskDueDate] = useState('')

    const inputRef = useRef<HTMLInputElement>(null)
    const dueDateRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (newTaskEdit) {
            inputRef?.current?.focus()
        }
    }, [newTaskEdit])

    const taskCount = useMemo(() => {
        let completedTask = 0
        const totalTask = taskList.length

        taskList.forEach((task) => {
            if (task.checked) {
                completedTask = completedTask + 1
            }
        })

        return {
            completedTask,
            totalTask,
            tasks: taskList,
        }
    }, [taskList])

    useEffect(() => {
        onAddNewTask(taskCount)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskList])

    const onNewTaskEdit = () => {
        setNewTaskEdit(true)
    }

    const onNewTaskAdd = async () => {
        const title = newTaskTitle.trim() || inputRef?.current?.value?.trim()
        const due_date = newTaskDueDate || dueDateRef?.current?.value

        if (!title) return

        const newTask: Task = {
            title,
            due_date: due_date || undefined,
            status: 'todo',
            checked: false,
        }

        // If projectId is provided, save to database
        if (projectId) {
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...newTask,
                        project_id: projectId,
                    }),
                })

                if (response.ok) {
                    const savedTask = await response.json()
                    newTask.id = savedTask.id
                }
            } catch (error) {
                console.error('Error saving task:', error)
            }
        }        setTaskList((prevTask) => [...prevTask, newTask])
        setNewTaskEdit(false)
        setNewTaskTitle('')
        setNewTaskDueDate('')
    }

    const onTaskCheckChange = async (checked: boolean, index: number) => {
        const task = taskList[index]
        const updatedStatus: Task['status'] = checked ? 'done' : 'todo'

        // Update in database if task has an ID
        if (task.id) {
            try {
                await fetch(`/api/tasks/${task.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: updatedStatus }),
                })
            } catch (error) {
                console.error('Error updating task:', error)
            }
        }

        setTaskList((prevTask) => {
            const mutatedPrevTask = prevTask.map((task, taskIndex) => {
                if (index === taskIndex) {
                    return { ...task, checked, status: updatedStatus }
                }
                return task
            })
            return [...mutatedPrevTask]        })
    }

    return (
        <div className="mb-7">
            {taskList.length > 0 && (
                <div className="flex flex-col mb-5 gap-4">
                    {taskList.map((task, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Checkbox
                                defaultChecked={task.checked}
                                onChange={(checked) =>
                                    onTaskCheckChange(checked as boolean, index)
                                }
                            >
                                {task.title}
                            </Checkbox>
                            {task.due_date && (
                                <span className="text-sm text-gray-500 ml-auto">
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {newTaskEdit ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Input
                            ref={inputRef}
                            placeholder="Add new task"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <Input
                            ref={dueDateRef}
                            type="date"
                            placeholder="Due date"
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="w-48"
                        />
                        <Button type="button" onClick={onNewTaskAdd}>
                            Add
                        </Button>
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => {
                                setNewTaskEdit(false)
                                setNewTaskTitle('')
                                setNewTaskDueDate('')
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <Button block className="border-dashed" onClick={onNewTaskEdit}>
                    Create new task
                </Button>
            )}
        </div>
    )
}

export default NewTaskField
