'use client'

import { useState } from 'react'
import { FormItem, Form } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import NewTaskField from './NewTaskField'
import { useProjectListStore } from '../_store/projectListStore'
import { useForm, Controller } from 'react-hook-form'
import { TbChecks } from 'react-icons/tb'
import { components } from 'react-select'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MemberListOption } from '../types'
import type { ZodType } from 'zod'
import type { MultiValueGenericProps, OptionProps } from 'react-select'
import { apiCreateProject } from '@/services/ProjectService'

type FormSchema = {
    title: string
    content: string
    assignees: {
        img: string
        value: string
        label: string
    }[]
}

const { MultiValueLabel } = components

const CustomSelectOption = ({
    innerProps,
    label,
    data,
    isSelected,
}: OptionProps<MemberListOption>) => {
    return (
        <div
            className={`flex items-center justify-between p-2 ${
                isSelected
                    ? 'bg-gray-100 dark:bg-gray-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            {...innerProps}
        >
            <div className="flex items-center gap-2">
                <Avatar shape="circle" size={20} src={data.img} />
                <span className="font-semibold heading-text">{label}</span>
            </div>
            {isSelected && <TbChecks className="text-emerald-500 text-xl" />}
        </div>
    )
}

const CustomControlMulti = ({ children, ...props }: MultiValueGenericProps) => {
    const { img } = props.data

    return (
        <MultiValueLabel {...props}>
            <div className="inline-flex items-center">
                <Avatar
                    className="mr-2 rtl:ml-2"
                    shape="circle"
                    size={15}
                    src={img}
                />
                {children}
            </div>
        </MultiValueLabel>
    )
}

const validationSchema: ZodType<FormSchema> = z.object({
    title: z.string().min(1, { message: 'Title required' }),
    content: z.string().min(1, { message: 'Content required' }),
    assignees: z.array(
        z.object({ value: z.string(), label: z.string(), img: z.string() }),
    ),
})

const NewProjectForm = ({ onClose }: { onClose: () => void }) => {
    const { memberList } = useProjectListStore()

    const [isSubmiting, setSubmiting] = useState(false)

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<FormSchema>({
        defaultValues: {
            title: '',
            content: '',
            assignees: [],
        },
        resolver: zodResolver(validationSchema),
    })

    const handleAddNewTask = (count: {
        completedTask: number
        totalTask: number
        tasks: Array<{
            id?: string
            title: string
            due_date?: string
            status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
            checked: boolean        }>
    }) => {
        // Task count handled locally in NewTaskField component
        console.log('Task count updated:', count)
    }

    const onSubmit = async (formValue: FormSchema) => {
        setSubmiting(true)
        const { title, content } = formValue

        // Prepare the payload for Supabase
        const payload = {
            name: title,
            description: content,
            // You can add more fields as needed
        }

        try {
            const response = await apiCreateProject(payload)
            
            if (response.success) {
                // Optionally update the local store with the response
                // updateProjectList(response.data)
                setSubmiting(false)
                onClose()
                
                // You can add a success notification here
                console.log('Project created successfully:', response.data)
            } else {
                throw new Error(response.error || 'Failed to create project')
            }
        } catch (error) {
            // Handle error (show notification, etc.)
            console.error('Error creating project:', error)
            setSubmiting(false)
        }
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <FormItem
                label="Title"
                invalid={Boolean(errors.title)}
                errorMessage={errors.title?.message}
            >
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <Input type="text" autoComplete="off" {...field} />
                    )}
                />
            </FormItem>
            <FormItem
                label="Assignees"
                invalid={Boolean(errors.assignees)}
                errorMessage={errors.assignees?.message}
            >
                <Controller
                    name="assignees"
                    control={control}
                    render={({ field }) => (
                        <Select<MemberListOption, true>
                            isMulti
                            instanceId="assignees"
                            className="min-w-[120px]"
                            components={{
                                Option: CustomSelectOption,
                                MultiValueLabel: CustomControlMulti,
                            }}
                            value={field.value}
                            options={memberList as MemberListOption[]}
                            onChange={field.onChange}
                        />
                    )}
                />
            </FormItem>
            <FormItem
                label="Content"
                invalid={Boolean(errors.content)}
                errorMessage={errors.content?.message}
            >
                <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                        <Input textArea autoComplete="off" {...field} />
                    )}
                />
            </FormItem>
            <NewTaskField onAddNewTask={handleAddNewTask} />
            <Button block variant="solid" type="submit" loading={isSubmiting}>
                Submit
            </Button>
        </Form>
    )
}

export default NewProjectForm
