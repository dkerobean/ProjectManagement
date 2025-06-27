'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
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

    // Enhanced PDF export with automatic download and logo support
    const handleExportInvoice = async (invoiceId: string, invoiceNumber: string) => {
        try {
            toast.push(
                <Notification type="info">
                    Generating PDF for {invoiceNumber}...
                </Notification>,
                { placement: 'top-center' }
            )

            // Get full invoice data with items
            const response = await fetch(`/api/invoicing/invoices/${invoiceId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch invoice details')
            }

            const result = await response.json()
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch invoice details')
            }

            const fullInvoice = result.data

            // Create PDF using jsPDF for better control and auto-download
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const margin = 20

            // Set up fonts and colors
            pdf.setFont('helvetica', 'normal')

            // Helper function to add company logo
            const addLogo = async (logoUrl: string | null) => {
                if (logoUrl) {
                    try {
                        const img = new Image()
                        img.crossOrigin = 'anonymous'

                        return new Promise((resolve) => {
                            img.onload = () => {
                                try {
                                    const logoWidth = 40
                                    const logoHeight = 16
                                    const logoX = margin
                                    const logoY = margin

                                    // Determine image format for better compatibility
                                    let format = 'JPEG'
                                    if (logoUrl.toLowerCase().includes('.png')) {
                                        format = 'PNG'
                                    }

                                    pdf.addImage(img, format, logoX, logoY, logoWidth, logoHeight)
                                    console.log('Logo successfully added to PDF')
                                    resolve(true)
                                } catch (error) {
                                    console.log('Failed to add logo to PDF:', error)
                                    resolve(false)
                                }
                            }
                            img.onerror = () => {
                                console.log('Logo image failed to load from:', logoUrl)
                                resolve(false)
                            }
                            img.src = logoUrl
                        })
                    } catch (error) {
                        console.log('Logo loading failed:', error)
                        return false
                    }
                } else {
                    console.log('No logo URL provided')
                    return false
                }
            }

            // Add logo if available - check multiple possible logo fields
            const logoAdded = await addLogo(fullInvoice.company_logo || fullInvoice.logo_url || null)

            let yPosition = margin + (logoAdded ? 20 : 10)

            // Header Section - matches web layout
            // Invoice Title (left side, below logo)
            pdf.setFontSize(24)
            pdf.setTextColor(55, 65, 81)
            pdf.setFont('helvetica', 'bold')
            pdf.text('INVOICE', margin, yPosition)

            // Invoice Number and Status (right side)
            pdf.setFontSize(12)
            pdf.setTextColor(0, 0, 0)
            pdf.setFont('helvetica', 'normal')
            pdf.text('Invoice #' + fullInvoice.invoice_number, pageWidth - margin - 50, yPosition - 5, { align: 'right' })
            
            pdf.setFontSize(10)
            pdf.setTextColor(107, 114, 128)
            pdf.text('Status: ' + fullInvoice.status.toUpperCase(), pageWidth - margin - 50, yPosition + 2, { align: 'right' })

            yPosition += 15

            // From/To Section - two columns to match web layout
            const leftColX = margin
            const rightColX = pageWidth / 2 + 10 // Increased spacing between columns

            // From section (left column)
            pdf.setFontSize(12)
            pdf.setTextColor(55, 65, 81)
            pdf.setFont('helvetica', 'bold')
            pdf.text('From:', leftColX, yPosition)

            let leftYPosition = yPosition + 8
            pdf.setFontSize(10)
            pdf.setTextColor(0, 0, 0)
            pdf.setFont('helvetica', 'normal')

            // Company info
            pdf.setFont('helvetica', 'bold')
            pdf.text(fullInvoice.company_name || 'Your Company Name', leftColX, leftYPosition)
            leftYPosition += 6

            pdf.setFont('helvetica', 'normal')
            if (fullInvoice.company_address) {
                const maxWidth = (pageWidth / 2) - 25 // More restrictive width accounting for column spacing
                // Ensure the address string is properly formatted for splitting
                const addressText = fullInvoice.company_address.toString().trim()
                const splitAddress = pdf.splitTextToSize(addressText, maxWidth)
                pdf.text(splitAddress, leftColX, leftYPosition)
                leftYPosition += splitAddress.length * 5
            }
            if (fullInvoice.company_phone) {
                pdf.text(fullInvoice.company_phone, leftColX, leftYPosition)
                leftYPosition += 5
            }
            if (fullInvoice.company_email) {
                pdf.text(fullInvoice.company_email, leftColX, leftYPosition)
                leftYPosition += 5
            }

            // To section (right column)
            pdf.setFontSize(12)
            pdf.setTextColor(55, 65, 81)
            pdf.setFont('helvetica', 'bold')
            pdf.text('To:', rightColX, yPosition)

            let rightYPosition = yPosition + 8
            pdf.setFontSize(10)
            pdf.setTextColor(0, 0, 0)

            // Client info
            pdf.setFont('helvetica', 'bold')
            pdf.text(fullInvoice.client_name, rightColX, rightYPosition)
            rightYPosition += 6

            pdf.setFont('helvetica', 'normal')
            if (fullInvoice.client_address) {
                const maxWidth = (pageWidth / 2) - 25 // More restrictive width accounting for column spacing
                // Ensure the address string is properly formatted for splitting
                const clientAddressText = fullInvoice.client_address.toString().trim()
                const splitClientAddress = pdf.splitTextToSize(clientAddressText, maxWidth)
                pdf.text(splitClientAddress, rightColX, rightYPosition)
                rightYPosition += splitClientAddress.length * 5
            }
            if (fullInvoice.client_email) {
                pdf.text(fullInvoice.client_email, rightColX, rightYPosition)
                rightYPosition += 5
            }

            yPosition += 35

            // Dates Section - two columns to match web layout
            pdf.setFontSize(10)
            pdf.setTextColor(55, 65, 81)
            pdf.setFont('helvetica', 'bold')
            pdf.text('Issue Date', leftColX, yPosition)
            pdf.text('Due Date', rightColX, yPosition)

            yPosition += 6
            pdf.setFontSize(10)
            pdf.setTextColor(0, 0, 0)
            pdf.setFont('helvetica', 'normal')
            pdf.text(new Date(fullInvoice.issue_date || fullInvoice.date).toLocaleDateString(), leftColX, yPosition)
            pdf.text(new Date(fullInvoice.due_date).toLocaleDateString(), rightColX, yPosition)

            yPosition += 20

            // Items Table - styled to match web version
            if (fullInvoice.invoice_items && fullInvoice.invoice_items.length > 0) {
                const tableY = yPosition
                const tableWidth = pageWidth - 2 * margin
                const colWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.175, tableWidth * 0.175]
                const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]]

                // Add Items section title
                pdf.setFontSize(12)
                pdf.setTextColor(55, 65, 81)
                pdf.setFont('helvetica', 'bold')
                pdf.text('Items', margin, tableY)
                yPosition = tableY + 10

                // Table border
                pdf.setDrawColor(229, 231, 235)
                pdf.setLineWidth(0.5)
                pdf.rect(margin, yPosition, tableWidth, 10 + (fullInvoice.invoice_items.length * 8), 'D')

                // Header background - lighter gray to match web
                pdf.setFillColor(249, 250, 251)
                pdf.rect(margin, yPosition, tableWidth, 10, 'F')

                // Header borders
                pdf.setDrawColor(229, 231, 235)
                pdf.setLineWidth(0.3)
                for (let i = 1; i < colX.length; i++) {
                    pdf.line(colX[i], yPosition, colX[i], yPosition + 10)
                }

                // Header text
                pdf.setFontSize(10)
                pdf.setTextColor(55, 65, 81)
                pdf.setFont('helvetica', 'bold')
                pdf.text('Description', colX[0] + 3, yPosition + 6)
                pdf.text('Qty', colX[1] + 3, yPosition + 6, { align: 'center' })
                pdf.text('Rate', colX[2] + 3, yPosition + 6, { align: 'right' })
                pdf.text('Amount', colX[3] + 3, yPosition + 6, { align: 'right' })

                yPosition += 10

                // Table rows
                pdf.setTextColor(0, 0, 0)
                pdf.setFont('helvetica', 'normal')

                fullInvoice.invoice_items.forEach((item: { description: string; quantity: number; rate: number; amount: number }, index: number) => {
                    const rowY = yPosition + (index * 8)
                    
                    // Row border
                    if (index > 0) {
                        pdf.setDrawColor(229, 231, 235)
                        pdf.setLineWidth(0.2)
                        pdf.line(margin, rowY, margin + tableWidth, rowY)
                    }

                    // Column borders
                    pdf.setDrawColor(229, 231, 235)
                    pdf.setLineWidth(0.3)
                    for (let i = 1; i < colX.length; i++) {
                        pdf.line(colX[i], rowY, colX[i], rowY + 8)
                    }

                    // Item data with proper alignment
                    pdf.setFontSize(9)
                    pdf.text(item.description.substring(0, 50), colX[0] + 3, rowY + 5)
                    pdf.text(item.quantity.toString(), colX[1] + colWidths[1]/2, rowY + 5, { align: 'center' })
                    pdf.text('$' + item.rate.toFixed(2), colX[2] + colWidths[2] - 3, rowY + 5, { align: 'right' })
                    pdf.text('$' + item.amount.toFixed(2), colX[3] + colWidths[3] - 3, rowY + 5, { align: 'right' })
                })

                yPosition += fullInvoice.invoice_items.length * 8 + 15
            }

            // Totals section - right-aligned to match web layout
            const totalsWidth = 80
            const totalsX = pageWidth - margin - totalsWidth
            yPosition += 10

            pdf.setFontSize(10)
            pdf.setTextColor(0, 0, 0)

            const addTotalRow = (label: string, amount: number, isFinal = false) => {
                if (isFinal) {
                    pdf.setFont('helvetica', 'bold')
                    pdf.setFontSize(11)
                    pdf.setTextColor(0, 0, 0)
                } else {
                    pdf.setFont('helvetica', 'normal')
                    pdf.setFontSize(10)
                    pdf.setTextColor(107, 114, 128)
                }

                pdf.text(label + ':', totalsX, yPosition)
                pdf.setTextColor(0, 0, 0)
                pdf.text('$' + amount.toFixed(2), totalsX + totalsWidth - 5, yPosition, { align: 'right' })
                yPosition += 6
            }

            // Subtotal
            addTotalRow('Subtotal', fullInvoice.subtotal)
            
            // Tax rate and amount
            if (fullInvoice.tax_rate > 0) {
                addTotalRow(`Tax Rate (%)`, fullInvoice.tax_rate)
                addTotalRow('Tax Amount', fullInvoice.tax_amount)
            }

            // Add line separator before total
            yPosition += 2
            pdf.setDrawColor(229, 231, 235)
            pdf.setLineWidth(0.5)
            pdf.line(totalsX, yPosition, totalsX + totalsWidth - 5, yPosition)
            yPosition += 4

            // Final total
            addTotalRow('Total', fullInvoice.total, true)

            // Notes section
            if (fullInvoice.notes) {
                yPosition += 15
                pdf.setFontSize(12)
                pdf.setTextColor(55, 65, 81)
                pdf.setFont('helvetica', 'bold')
                pdf.text('Notes', margin, yPosition)

                yPosition += 8
                pdf.setFontSize(10)
                pdf.setTextColor(0, 0, 0)
                pdf.setFont('helvetica', 'normal')

                // Split long notes into lines
                const splitNotes = pdf.splitTextToSize(fullInvoice.notes, pageWidth - 2 * margin)
                pdf.text(splitNotes, margin, yPosition)
                yPosition += splitNotes.length * 5
            }

            // Payment Instructions
            if (fullInvoice.payment_instructions) {
                yPosition += 10
                pdf.setFontSize(12)
                pdf.setTextColor(79, 70, 229)
                pdf.setFont('helvetica', 'bold')
                pdf.text('Payment Instructions', margin, yPosition)

                yPosition += 8
                pdf.setFontSize(10)
                pdf.setTextColor(0, 0, 0)
                pdf.setFont('helvetica', 'normal')

                const splitInstructions = pdf.splitTextToSize(fullInvoice.payment_instructions, pageWidth - 2 * margin)
                pdf.text(splitInstructions, margin, yPosition)
            }

            // Auto-download the PDF
            const fileName = `Invoice_${fullInvoice.invoice_number}_${new Date().toISOString().split('T')[0]}.pdf`
            pdf.save(fileName)

            toast.push(
                <Notification type="success">
                    PDF downloaded successfully: {fileName}
                </Notification>,
                { placement: 'top-center' }
            )
        } catch (error) {
            console.error('Error exporting invoice:', error)
            toast.push(
                <Notification type="danger">
                    Failed to export invoice PDF: {error instanceof Error ? error.message : 'Unknown error'}
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
