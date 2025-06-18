'use client'

import { useMemo } from 'react'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import { useClientListStore } from '../_store/clientListStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TbPencil, TbEye } from 'react-icons/tb'
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { Client } from '../../types'

type ClientListTableProps = {
    clientListTotal: number
    pageIndex?: number
    pageSize?: number
}

const statusColor: Record<string, string> = {
    active: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    inactive: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
}

const NameColumn = ({ row }: { row: Client }) => {
    return (
        <div className="flex items-center">
            <Avatar size={40} shape="circle" src={row.image_url} />
            <Link
                className={`hover:text-primary ml-2 rtl:mr-2 font-semibold text-gray-900 dark:text-gray-100`}
                href={`/concepts/clients/client-details/${row.id}`}
            >
                {row.name}
            </Link>
        </div>
    )
}

const ActionColumn = ({
    onEdit,
    onViewDetail,
}: {
    onEdit: () => void
    onViewDetail: () => void
}) => {
    return (
        <div className="flex items-center gap-3">
            <Tooltip title="Edit">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold`}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="View">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold`}
                    role="button"
                    onClick={onViewDetail}
                >
                    <TbEye />
                </div>
            </Tooltip>
        </div>
    )
}

const ClientListTable = ({
    clientListTotal,
    pageIndex = 1,
    pageSize = 10,
}: ClientListTableProps) => {
    const router = useRouter()

    const clientList = useClientListStore((state) => state.clientList)
    const selectedClient = useClientListStore(
        (state) => state.selectedClient,
    )
    const isInitialLoading = useClientListStore(
        (state) => state.initialLoading,
    )
    const setSelectedClient = useClientListStore(
        (state) => state.setSelectedClient,
    )
    const setSelectAllClient = useClientListStore(
        (state) => state.setSelectAllClient,
    )

    const { onAppendQueryParams } = useAppendQueryParams()

    const handleEdit = (client: Client) => {
        router.push(`/concepts/clients/client-edit/${client.id}`)
    }

    const handleViewDetails = (client: Client) => {
        router.push(`/concepts/clients/client-details/${client.id}`)
    }

    const columns: ColumnDef<Client>[] = useMemo(
        () => [
            {
                header: 'Name',
                accessorKey: 'name',
                cell: (props) => {
                    const row = props.row.original
                    return <NameColumn row={row} />
                },
            },
            {
                header: 'Email',
                accessorKey: 'email',
            },
            {
                header: 'Company',
                accessorKey: 'company',
            },
            {
                header: 'Phone',
                accessorKey: 'phone',
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[row.status]}>
                                <span className="capitalize">{row.status}</span>
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: '',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onViewDetail={() =>
                            handleViewDetails(props.row.original)
                        }
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const handlePaginationChange = (page: number) => {
        onAppendQueryParams({
            pageIndex: String(page),
        })
    }

    const handleSelectChange = (value: number) => {
        onAppendQueryParams({
            pageSize: String(value),
            pageIndex: '1',
        })
    }

    const handleSort = (sort: OnSortParam) => {
        onAppendQueryParams({
            order: sort.order,
            sortKey: sort.key,
        })
    }

    const handleRowSelect = (checked: boolean, row: Client) => {
        setSelectedClient(checked, row)
    }

    const handleAllRowSelect = (checked: boolean, rows: Row<Client>[]) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectAllClient(originalRows)
        } else {
            setSelectAllClient([])
        }
    }

    return (
        <DataTable
            selectable
            columns={columns}
            data={clientList}
            noData={clientList.length === 0}
            skeletonAvatarColumns={[0]}
            skeletonAvatarProps={{ width: 28, height: 28 }}
            loading={isInitialLoading}
            pagingData={{
                total: clientListTotal,
                pageIndex,
                pageSize,
            }}
            checkboxChecked={(row) =>
                selectedClient.some((selected) => selected.id === row.id)
            }
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect}
            onIndeterminateCheckBoxChange={handleAllRowSelect}
        />
    )
}

export default ClientListTable
