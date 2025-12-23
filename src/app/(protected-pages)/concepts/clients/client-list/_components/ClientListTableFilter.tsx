'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { useClientListStore } from '../_store/clientListStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { TbFilter } from 'react-icons/tb'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'

type FormSchema = {
    company: string
    status: Array<string>
}

const statusList = [
    'active',
    'inactive',
]

const validationSchema: ZodType<FormSchema> = z.object({
    company: z.string(),
    status: z.array(z.string()),
})

const ClientListTableFilter = () => {
    const [dialogIsOpen, setIsOpen] = useState(false)

    const filterData = useClientListStore((state) => state.filterData)
    const setFilterData = useClientListStore((state) => state.setFilterData)

    const { onAppendQueryParams } = useAppendQueryParams()

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        setIsOpen(false)
    }

    const { handleSubmit, reset, control } = useForm<FormSchema>({
        defaultValues: filterData,
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = (values: FormSchema) => {
        onAppendQueryParams({
            company: values.company,
            status: values.status.join(','),
        })

        setFilterData(values)
        setIsOpen(false)
    }

    return (
        <>
            <Button icon={<TbFilter />} onClick={() => openDialog()}>
                Filter
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Company">
                        <Controller
                            name="company"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Search by company"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    className="flex mt-4"
                                    {...field}
                                >
                                    {statusList.map((status, index) => (
                                        <Checkbox
                                            key={status + index}
                                            name={field.name}
                                            value={status}
                                        >
                                            <span className="capitalize">{status}</span>
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </FormItem>
                    <div className="text-right mt-6">
                        <Button
                            className="ltr:mr-2 rtl:ml-2"
                            variant="plain"
                            type="button"
                            onClick={() => {
                                reset()
                                setFilterData({
                                    company: '',
                                    status: 'all',
                                })
                                onAppendQueryParams({
                                    company: '',
                                    status: '',
                                })
                                setIsOpen(false)
                            }}
                        >
                            Reset
                        </Button>
                        <Button variant="solid" type="submit">
                            Filter
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}

export default ClientListTableFilter
