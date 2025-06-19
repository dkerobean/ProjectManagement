'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Container from '@/components/shared/Container'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { HiOutlinePlus, HiOutlineEye, HiOutlineDocumentDownload, HiOutlineSearch, HiOutlineTrash } from 'react-icons/hi'
import { format } from 'date-fns'

interface Invoice {
    id: string
    invoice_number: string
    client_name: string
    client_email?: string
    client_address?: string
    issue_date: string
    due_date: string
    status: 'draft' | 'sent' | 'paid' | 'Draft' | 'Sent' | 'Paid'
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    notes?: string
    created_at: string
    updated_at: string
    invoice_items?: InvoiceItem[]
}

interface InvoiceItem {
    id: string
    invoice_id: string
    description: string
    quantity: number
    rate: number
    amount: number
    position: number
}

const { Tr, Th, Td, THead, TBody } = Table

const ViewInvoices = () => {
    const router = useRouter()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Load invoices from API
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/invoicing/invoices')
                
                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setInvoices(data.data || [])
                    } else {
                        throw new Error(data.error || 'Failed to fetch invoices')
                    }
                } else {
                    throw new Error('Failed to fetch invoices')
                }
            } catch (error) {
                console.error('Error fetching invoices:', error)
                toast.push(
                    <Notification type="danger">
                        Failed to load invoices
                    </Notification>,
                    { placement: 'top-center' }
                )
            } finally {
                setLoading(false)
            }
        }

        fetchInvoices()
    }, [])

    // Filter invoices based on search term and status
    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = !searchTerm || 
            invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = statusFilter === 'all' || 
            invoice.status.toLowerCase() === statusFilter.toLowerCase()
        
        return matchesSearch && matchesStatus
    })

    // Get status tag props
    const getStatusProps = (status: string) => {
        switch (status.toLowerCase()) {
            case 'draft':
                return { className: 'bg-gray-100 text-gray-800' }
            case 'sent':
                return { className: 'bg-blue-100 text-blue-800' }
            case 'paid':
                return { className: 'bg-green-100 text-green-800' }
            default:
                return { className: 'bg-gray-100 text-gray-800' }
        }
    }

    // Handle invoice deletion
    const handleDelete = async (invoiceId: string, invoiceNumber: string) => {
        if (!window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
            return
        }

        try {
            setDeletingId(invoiceId)
            const response = await fetch(`/api/invoicing/invoices/${invoiceId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setInvoices(invoices => invoices.filter(inv => inv.id !== invoiceId))
                toast.push(
                    <Notification type="success">
                        Invoice deleted successfully
                    </Notification>,
                    { placement: 'top-center' }
                )
            } else {
                throw new Error('Failed to delete invoice')
            }
        } catch (error) {
            console.error('Error deleting invoice:', error)
            toast.push(
                <Notification type="danger">
                    Failed to delete invoice
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setDeletingId(null)
        }
    }

    // Handle status update
    const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/invoicing/invoices/${invoiceId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setInvoices(invoices => 
                        invoices.map(inv => 
                            inv.id === invoiceId ? { ...inv, status: newStatus as 'draft' | 'sent' | 'paid' | 'Draft' | 'Sent' | 'Paid' } : inv
                        )
                    )
                    toast.push(
                        <Notification type="success">
                            Invoice status updated successfully
                        </Notification>,
                        { placement: 'top-center' }
                    )
                } else {
                    throw new Error(result.error || 'Failed to update invoice status')
                }
            } else {
                throw new Error('Failed to update invoice status')
            }
        } catch (error) {
            console.error('Error updating invoice status:', error)
            toast.push(
                <Notification type="danger">
                    Failed to update invoice status
                </Notification>,
                { placement: 'top-center' }
            )
        }
    }

    // Navigate to invoice detail/edit
    const handleViewInvoice = (invoiceId: string) => {
        // For now, redirect to create-invoice page with the invoice ID as a parameter
        // Later we can create a dedicated view page
        router.push(`/concepts/invoicing/create-invoice?view=${invoiceId}`)
    }

    // Export invoice as PDF
    const handleExportInvoice = async (invoiceId: string, invoiceNumber: string) => {
        try {
            toast.push(
                <Notification type="info">
                    Generating PDF for {invoiceNumber}...
                </Notification>,
                { placement: 'top-center' }
            )

            // Create a simple PDF export using browser print
            const invoice = invoices.find(inv => inv.id === invoiceId)
            if (!invoice) return

            // Create a new window with invoice content for printing
            const printWindow = window.open('', '_blank')
            if (!printWindow) return

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice ${invoice.invoice_number}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .invoice-details { margin-bottom: 30px; }
                        .client-info { margin-bottom: 30px; }
                        .amount { font-size: 24px; font-weight: bold; color: #059669; }
                        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                        .status.paid { background-color: #d1fae5; color: #065f46; }
                        .status.sent { background-color: #dbeafe; color: #1e40af; }
                        .status.draft { background-color: #f3f4f6; color: #374151; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
                        th { background-color: #f9fafb; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>INVOICE</h1>
                        <h2>${invoice.invoice_number}</h2>
                    </div>
                    
                    <div class="invoice-details">
                        <table>
                            <tr><td><strong>Issue Date:</strong></td><td>${new Date(invoice.issue_date).toLocaleDateString()}</td></tr>
                            <tr><td><strong>Due Date:</strong></td><td>${new Date(invoice.due_date).toLocaleDateString()}</td></tr>
                            <tr><td><strong>Status:</strong></td><td><span class="status ${invoice.status.toLowerCase()}">${invoice.status}</span></td></tr>
                        </table>
                    </div>

                    <div class="client-info">
                        <h3>Bill To:</h3>
                        <p><strong>${invoice.client_name}</strong></p>
                        ${invoice.client_email ? `<p>${invoice.client_email}</p>` : ''}
                        ${invoice.client_address ? `<p>${invoice.client_address}</p>` : ''}
                    </div>

                    <div class="amount">
                        <p>Total Amount: $${invoice.total.toFixed(2)}</p>
                    </div>

                    ${invoice.notes ? `<div style="margin-top: 30px;"><h3>Notes:</h3><p>${invoice.notes}</p></div>` : ''}
                </body>
                </html>
            `

            printWindow.document.write(printContent)
            printWindow.document.close()
            
            // Auto-print after a short delay
            setTimeout(() => {
                printWindow.print()
                printWindow.close()
            }, 500)

            toast.push(
                <Notification type="success">
                    PDF export initiated for {invoiceNumber}
                </Notification>,
                { placement: 'top-center' }
            )
        } catch (error) {
            console.error('Error exporting invoice:', error)
            toast.push(
                <Notification type="danger">
                    Failed to export invoice PDF
                </Notification>,
                { placement: 'top-center' }
            )
        }
    }

    return (
        <Container>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Invoices</h1>
                        <p className="text-gray-600 mt-1">
                            Manage and track all your invoices
                        </p>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlinePlus />}
                        onClick={() => router.push('/concepts/invoicing/create-invoice')}
                    >
                        Create Invoice
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <Input
                                placeholder="Search by invoice number or client name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                prefix={<HiOutlineSearch />}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <Select
                                placeholder="All Statuses"
                                value={statusFilter === 'all' ? null : { label: statusFilter, value: statusFilter }}
                                onChange={(option) => setStatusFilter(option?.value || 'all')}
                                options={[
                                    { label: 'All Statuses', value: 'all' },
                                    { label: 'Draft', value: 'draft' },
                                    { label: 'Sent', value: 'sent' },
                                    { label: 'Paid', value: 'paid' },
                                ]}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setSearchTerm('')
                                    setStatusFilter('all')
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Invoice Table */}
                <Card>
                    {loading ? (
                        <div className="p-8">
                            <div className="animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex space-x-4">
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl text-gray-300 mb-4">📄</div>
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                                {searchTerm || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Create your first invoice to get started'
                                }
                            </p>
                            {(!searchTerm && statusFilter === 'all') && (
                                <Button
                                    variant="solid"
                                    icon={<HiOutlinePlus />}
                                    onClick={() => router.push('/concepts/invoicing/create-invoice')}
                                >
                                    Create Invoice
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>Invoice #</Th>
                                    <Th>Client</Th>
                                    <Th>Issue Date</Th>
                                    <Th>Due Date</Th>
                                    <Th>Amount</Th>
                                    <Th>Status</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {filteredInvoices.map((invoice) => (
                                    <Tr key={invoice.id}>
                                        <Td>
                                            <div className="font-medium text-blue-600">
                                                {invoice.invoice_number}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="font-medium">
                                                {invoice.client_name}
                                            </div>
                                            {invoice.client_email && (
                                                <div className="text-sm text-gray-500">
                                                    {invoice.client_email}
                                                </div>
                                            )}
                                        </Td>
                                        <Td>
                                            {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                                        </Td>
                                        <Td>
                                            {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                                        </Td>
                                        <Td>
                                            <div className="font-medium">
                                                ${invoice.total.toFixed(2)}
                                            </div>
                                        </Td>
                                        <Td>
                                            <Select
                                                size="sm"
                                                value={{ label: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1), value: invoice.status }}
                                                onChange={(option) => option && handleStatusUpdate(invoice.id, option.value)}
                                                options={[
                                                    { label: 'Draft', value: 'draft' },
                                                    { label: 'Sent', value: 'sent' },
                                                    { label: 'Paid', value: 'paid' },
                                                ]}
                                                className={`status-select ${getStatusProps(invoice.status).className}`}
                                            />
                                        </Td>
                                        <Td>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    icon={<HiOutlineEye />}
                                                    onClick={() => handleViewInvoice(invoice.id)}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    icon={<HiOutlineDocumentDownload />}
                                                    onClick={() => handleExportInvoice(invoice.id, invoice.invoice_number)}
                                                >
                                                    Export
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    icon={<HiOutlineTrash />}
                                                    loading={deletingId === invoice.id}
                                                    onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                    )}
                </Card>

                {/* Summary Stats */}
                {filteredInvoices.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card className="p-4">
                            <div className="text-sm text-gray-600">Total Invoices</div>
                            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
                            <div className="text-sm text-gray-500 mt-1">
                                ${filteredInvoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-sm text-gray-600">Draft</div>
                            <div className="text-2xl font-bold text-gray-600">
                                {filteredInvoices.filter(inv => inv.status.toLowerCase() === 'draft').length}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                ${filteredInvoices.filter(inv => inv.status.toLowerCase() === 'draft').reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-sm text-gray-600">Sent</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {filteredInvoices.filter(inv => inv.status.toLowerCase() === 'sent').length}
                            </div>
                            <div className="text-sm text-blue-500 mt-1">
                                ${filteredInvoices.filter(inv => inv.status.toLowerCase() === 'sent').reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-sm text-gray-600">Paid</div>
                            <div className="text-2xl font-bold text-green-600">
                                {filteredInvoices.filter(inv => inv.status.toLowerCase() === 'paid').length}
                            </div>
                            <div className="text-sm text-green-500 mt-1">
                                ${filteredInvoices.filter(inv => inv.status.toLowerCase() === 'paid').reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-sm text-gray-600">Outstanding</div>
                            <div className="text-2xl font-bold text-orange-600">
                                {filteredInvoices.filter(inv => inv.status.toLowerCase() !== 'paid').length}
                            </div>
                            <div className="text-sm text-orange-500 mt-1">
                                ${filteredInvoices.filter(inv => inv.status.toLowerCase() !== 'paid').reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </Container>
    )
}

export default ViewInvoices
