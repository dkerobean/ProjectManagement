'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Input from '@/components/ui/Input'
import Select, { Option } from '@/components/ui/Select'
import { HiOutlinePlus, HiOutlineEye, HiOutlineDocumentDownload, HiOutlineSearch } from 'react-icons/hi'
import { format } from 'date-fns'

interface Invoice {
    id: string
    invoiceNumber: string
    clientName: string
    date: string
    dueDate: string
    amount: number
    status: 'draft' | 'sent' | 'paid' | 'overdue'
}

const { Tr, Th, Td, THead, TBody } = Table

const ViewInvoices = () => {
    const router = useRouter()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // Mock data - replace with actual API call
    useEffect(() => {
        const mockInvoices: Invoice[] = [
            {
                id: '1',
                invoiceNumber: 'INV-001',
                clientName: 'Acme Corporation',
                date: '2025-01-15',
                dueDate: '2025-02-14',
                amount: 2500.00,
                status: 'sent'
            },
            {
                id: '2',
                invoiceNumber: 'INV-002',
                clientName: 'Tech Solutions Inc',
                date: '2025-01-10',
                dueDate: '2025-02-09',
                amount: 1750.00,
                status: 'paid'
            },
            {
                id: '3',
                invoiceNumber: 'INV-003',
                clientName: 'Design Studio LLC',
                date: '2024-12-20',
                dueDate: '2025-01-19',
                amount: 950.00,
                status: 'overdue'
            },
            {
                id: '4',
                invoiceNumber: 'INV-004',
                clientName: 'Marketing Pro',
                date: '2025-01-20',
                dueDate: '2025-02-19',
                amount: 3200.00,
                status: 'draft'
            }
        ]

        setTimeout(() => {
            setInvoices(mockInvoices)
            setLoading(false)
        }, 1000)
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'sent':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'overdue':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'draft':
                return 'bg-gray-100 text-gray-700 border-gray-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const paidAmount = filteredInvoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0)
    const outstandingAmount = totalAmount - paidAmount

    return (
        <div className="h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Invoice Management
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage and track all your invoices
                    </p>
                </div>
                <Button
                    variant="solid"
                    size="sm"
                    icon={<HiOutlinePlus />}
                    onClick={() => router.push('/concepts/invoicing/create-invoice')}
                >
                    Create Invoice
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                ${totalAmount.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <HiOutlineDocumentDownload className="text-blue-600 text-xl" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</p>
                            <p className="text-2xl font-bold text-green-600">
                                ${paidAmount.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <HiOutlineDocumentDownload className="text-green-600 text-xl" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                            <p className="text-2xl font-bold text-red-600">
                                ${outstandingAmount.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <HiOutlineDocumentDownload className="text-red-600 text-xl" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            prefix={<HiOutlineSearch className="text-gray-400" />}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            value={{ label: statusFilter === 'all' ? 'All Status' : statusFilter, value: statusFilter }}
                            onChange={(option) => setStatusFilter(option?.value || 'all')}
                        >
                            <Option value="all">All Status</Option>
                            <Option value="draft">Draft</Option>
                            <Option value="sent">Sent</Option>
                            <Option value="paid">Paid</Option>
                            <Option value="overdue">Overdue</Option>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Invoices Table */}
            <Card>
                <Table>
                    <THead>
                        <Tr>
                            <Th>Invoice #</Th>
                            <Th>Client</Th>
                            <Th>Date</Th>
                            <Th>Due Date</Th>
                            <Th>Amount</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {loading ? (
                            <Tr>
                                <Td colSpan={7} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-2">Loading invoices...</span>
                                    </div>
                                </Td>
                            </Tr>
                        ) : filteredInvoices.length === 0 ? (
                            <Tr>
                                <Td colSpan={7} className="text-center py-8">
                                    <div className="text-gray-500">
                                        No invoices found matching your criteria.
                                    </div>
                                </Td>
                            </Tr>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <Tr key={invoice.id}>
                                    <Td>
                                        <span className="font-medium text-blue-600">
                                            {invoice.invoiceNumber}
                                        </span>
                                    </Td>
                                    <Td>{invoice.clientName}</Td>
                                    <Td>{format(new Date(invoice.date), 'MMM dd, yyyy')}</Td>
                                    <Td>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</Td>
                                    <Td>
                                        <span className="font-medium">
                                            ${invoice.amount.toFixed(2)}
                                        </span>
                                    </Td>
                                    <Td>
                                        <Tag className={getStatusColor(invoice.status)}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </Tag>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="plain"
                                                size="xs"
                                                icon={<HiOutlineEye />}
                                                onClick={() => router.push(`/concepts/invoicing/create-invoice?id=${invoice.id}`)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="plain"
                                                size="xs"
                                                icon={<HiOutlineDocumentDownload />}
                                            >
                                                PDF
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </TBody>
                </Table>
            </Card>
        </div>
    )
}

export default ViewInvoices
