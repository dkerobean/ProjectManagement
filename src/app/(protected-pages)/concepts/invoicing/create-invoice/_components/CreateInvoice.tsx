'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import jsPDF from 'jspdf'
import { useReactToPrint } from 'react-to-print'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import Container from '@/components/shared/Container'
import { HiOutlinePrinter, HiOutlineDocumentDownload, HiOutlinePlus, HiOutlineTrash, HiOutlineSave } from 'react-icons/hi'
import { format } from 'date-fns'

interface InvoiceItem {
    id: string
    description: string
    quantity: number
    rate: number
    amount: number
}

interface PaymentMethod {
    id: string
    method_name: string
    payment_instructions: string
}

interface UserProfile {
    company_name?: string
    company_address?: string
    phone_number?: string
    contact_email?: string
    logo_url?: string
}

interface InvoiceData {
    id: string
    invoiceNumber: string
    issueDate: string
    dueDate: string
    status: 'draft' | 'sent' | 'paid'

    // Company Info (auto-populated from profile)
    companyName: string
    companyAddress: string
    companyPhone: string
    companyEmail: string
    companyLogo: string

    // Client Info
    clientName: string
    clientAddress: string
    clientEmail: string

    // Invoice Items
    items: InvoiceItem[]

    // Totals
    subtotal: number
    taxRate: number
    taxAmount: number
    total: number

    // Payment Info
    paymentMethodId: string
    paymentInstructions: string
    notes: string
}

const CreateInvoice = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const viewInvoiceId = searchParams.get('view')
    const isViewMode = Boolean(viewInvoiceId)
    
    const printRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

    const [invoice, setInvoice] = useState<InvoiceData>({
        id: '',
        invoiceNumber: '',
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
        status: 'draft',

        // Company Info (will be populated from profile)
        companyName: 'Your Company Name',
        companyAddress: '123 Business Street',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'contact@yourcompany.com',
        companyLogo: '',

        // Client Info
        clientName: '',
        clientAddress: '',
        clientEmail: '',

        // Invoice Items
        items: [
            {
                id: '1',
                description: 'Service or Product Description',
                quantity: 1,
                rate: 0,
                amount: 0
            }
        ],

        // Totals
        subtotal: 0,
        taxRate: 10, // 10% default
        taxAmount: 0,
        total: 0,

        // Payment Info
        paymentMethodId: '',
        paymentInstructions: '',
        notes: 'Thank you for your business!'
    })

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                let promises = []
                
                if (isViewMode && viewInvoiceId) {
                    // In view mode, load the specific invoice
                    promises = [
                        fetch(`/api/invoicing/invoices/${viewInvoiceId}`),
                        fetch('/api/invoicing/company-profile'),
                        fetch('/api/invoicing/payment-methods')
                    ]
                } else {
                    // In create mode, load invoice number, user profile, and payment methods
                    promises = [
                        fetch('/api/invoicing/generate-invoice-number'),
                        fetch('/api/invoicing/company-profile'),
                        fetch('/api/invoicing/payment-methods')
                    ]
                }

                const [firstResponse, profileResponse, paymentMethodsResponse] = await Promise.all(promises)

                if (isViewMode && viewInvoiceId) {
                    // Handle loading existing invoice
                    if (firstResponse.ok) {
                        const invoiceData = await firstResponse.json()
                        if (invoiceData.success && invoiceData.data) {
                            const invoice = invoiceData.data
                            setInvoice({
                                id: invoice.id,
                                invoiceNumber: invoice.invoice_number,
                                issueDate: invoice.issue_date || invoice.date,
                                dueDate: invoice.due_date,
                                status: invoice.status,
                                companyName: invoice.company_name || 'Your Company Name',
                                companyAddress: invoice.company_address || '123 Business Street',
                                companyPhone: invoice.company_phone || '+1 (555) 123-4567',
                                companyEmail: invoice.company_email || 'contact@yourcompany.com',
                                companyLogo: '',
                                clientName: invoice.client_name,
                                clientAddress: invoice.client_address || '',
                                clientEmail: invoice.client_email || '',
                                items: invoice.invoice_items?.map((item: { description: string; quantity: number; rate: number; amount: number }) => ({
                                    description: item.description,
                                    quantity: item.quantity,
                                    rate: item.rate,
                                    amount: item.amount
                                })) || [],
                                subtotal: invoice.subtotal,
                                taxRate: invoice.tax_rate,
                                taxAmount: invoice.tax_amount,
                                total: invoice.total,
                                paymentMethodId: invoice.payment_method_id || '',
                                paymentInstructions: invoice.payment_instructions || '',
                                notes: invoice.notes || ''
                            })
                        }
                    }
                } else {
                    // Handle invoice number generation for create mode
                    if (firstResponse.ok) {
                        const invoiceNumData = await firstResponse.json()
                        if (invoiceNumData.success) {
                            setInvoice(prev => ({ ...prev, invoiceNumber: invoiceNumData.data.invoice_number }))
                        }
                    }
                }

                // Handle user profile
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json()
                    if (profileData.success && profileData.data) {
                        const profile = profileData.data
                        setUserProfile(profile)
                        if (!isViewMode) {
                            // Only update company info in create mode
                            setInvoice(prev => ({
                                ...prev,
                                companyName: profile.company_name || 'Your Company Name',
                                companyAddress: profile.company_address || '123 Business Street',
                                companyPhone: profile.phone_number || '+1 (555) 123-4567',
                                companyEmail: profile.contact_email || 'contact@yourcompany.com',
                                companyLogo: profile.logo_url || '',
                            }))
                        }
                    }
                }

                // Handle payment methods
                if (paymentMethodsResponse.ok) {
                    const paymentData = await paymentMethodsResponse.json()
                    if (paymentData.success) {
                        setPaymentMethods(paymentData.data || [])
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error)
                toast.push(
                    <Notification type="danger">
                        Failed to load invoice data
                    </Notification>,
                    { placement: 'top-center' }
                )
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [isViewMode, viewInvoiceId])

    // Calculate totals whenever items or tax rate changes
    const calculateTotals = (items: InvoiceItem[], taxRate: number) => {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
        const taxAmount = (subtotal * taxRate) / 100
        const total = subtotal + taxAmount

        return { subtotal, taxAmount, total }
    }

    // Update invoice field
    const updateInvoiceField = (field: keyof InvoiceData, value: string | number | InvoiceItem[]) => {
        setInvoice(prev => {
            const updated = { ...prev, [field]: value }

            // Recalculate totals if items or taxRate changed
            if (field === 'items' || field === 'taxRate') {
                const totals = calculateTotals(
                    field === 'items' ? value as InvoiceItem[] : updated.items,
                    field === 'taxRate' ? value as number : updated.taxRate
                )
                return { ...updated, ...totals }
            }

            return updated
        })
    }

    // Update payment method
    const updatePaymentMethod = (methodId: string) => {
        const method = paymentMethods.find(m => m.id === methodId)
        setInvoice(prev => ({
            ...prev,
            paymentMethodId: methodId,
            paymentInstructions: method?.payment_instructions || ''
        }))
    }

    // Update invoice item
    const updateInvoiceItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
        const updatedItems = invoice.items.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value }

                // Recalculate amount if quantity or rate changed
                if (field === 'quantity' || field === 'rate') {
                    updatedItem.amount = updatedItem.quantity * updatedItem.rate
                }

                return updatedItem
            }
            return item
        })

        updateInvoiceField('items', updatedItems)
    }

    // Add new item
    const addItem = () => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0
        }
        updateInvoiceField('items', [...invoice.items, newItem])
    }

    // Remove item
    const removeItem = (itemId: string) => {
        if (invoice.items.length > 1) {
            const updatedItems = invoice.items.filter(item => item.id !== itemId)
            updateInvoiceField('items', updatedItems)
        }
    }

    // Save invoice
    const saveInvoice = async () => {
        try {
            setIsSaving(true)

            // Validate required fields
            if (!invoice.clientName || !invoice.issueDate || !invoice.dueDate) {
                toast.push(
                    <Notification type="danger">
                        Please fill in client name and dates
                    </Notification>,
                    { placement: 'top-center' }
                )
                return
            }

            if (invoice.items.some(item => !item.description)) {
                toast.push(
                    <Notification type="danger">
                        Please provide descriptions for all items
                    </Notification>,
                    { placement: 'top-center' }
                )
                return
            }

            const response = await fetch('/api/invoicing/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_name: invoice.clientName,
                    client_email: invoice.clientEmail,
                    client_address: invoice.clientAddress,
                    issue_date: invoice.issueDate,
                    due_date: invoice.dueDate,
                    items: invoice.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        rate: item.rate
                    })),
                    tax_rate: invoice.taxRate,
                    notes: invoice.notes,
                    payment_method_id: invoice.paymentMethodId || null,
                    payment_instructions: invoice.paymentInstructions,
                    status: invoice.status
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to save invoice')
            }

            const result = await response.json()
            if (result.success) {
                toast.push(
                    <Notification type="success">
                        Invoice saved successfully!
                    </Notification>,
                    { placement: 'top-center' }
                )

                // Redirect to invoice list after successful save
                router.push('/concepts/invoicing/view-invoices')
            } else {
                throw new Error(result.error || 'Failed to save invoice')
            }
        } catch (error) {
            console.error('Error saving invoice:', error)
            toast.push(
                <Notification type="danger">
                    Failed to save invoice. Please try again.
                </Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsSaving(false)
        }
    }

    // Enhanced PDF export with automatic download and logo support
    const exportToPDF = async () => {
        try {
            toast.push(
                <Notification type="info">
                    Generating PDF for {invoice.invoiceNumber}...
                </Notification>,
                { placement: 'top-center' }
            )

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
                                    const logoWidth = 30
                                    const logoHeight = 20
                                    const logoX = pageWidth - margin - logoWidth
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
            await addLogo(invoice.companyLogo || null)

            let yPosition = margin + 10

            // Company Header
            pdf.setFontSize(24)
            pdf.setTextColor(79, 70, 229)
            pdf.setFont('helvetica', 'bold')
            pdf.text(invoice.companyName, margin, yPosition)
            
            yPosition += 10
            pdf.setFontSize(10)
            pdf.setTextColor(100, 100, 100)
            pdf.setFont('helvetica', 'normal')
            
            pdf.text(invoice.companyAddress, margin, yPosition)
            yPosition += 5
            pdf.text(invoice.companyPhone, margin, yPosition)
            yPosition += 5
            pdf.text(invoice.companyEmail, margin, yPosition)
            yPosition += 5

            // Invoice Title and Number (top right)
            pdf.setFontSize(32)
            pdf.setTextColor(79, 70, 229)
            pdf.setFont('helvetica', 'bold')
            pdf.text('INVOICE', pageWidth - margin - 50, margin + 15, { align: 'right' })
            
            pdf.setFontSize(14)
            pdf.setTextColor(100, 100, 100)
            pdf.setFont('helvetica', 'normal')
            pdf.text(invoice.invoiceNumber, pageWidth - margin - 50, margin + 25, { align: 'right' })

            // Line separator
            yPosition += 10
            pdf.setDrawColor(79, 70, 229)
            pdf.setLineWidth(1)
            pdf.line(margin, yPosition, pageWidth - margin, yPosition)
            yPosition += 15

            // Bill To and Invoice Details (two columns)
            const leftColX = margin
            const rightColX = pageWidth / 2 + 10

            // Bill To section
            pdf.setFontSize(12)
            pdf.setTextColor(79, 70, 229)
            pdf.setFont('helvetica', 'bold')
            pdf.text('Bill To', leftColX, yPosition)

            yPosition += 8
            pdf.setFontSize(11)
            pdf.setTextColor(0, 0, 0)
            pdf.setFont('helvetica', 'bold')
            pdf.text(invoice.clientName, leftColX, yPosition)

            yPosition += 6
            pdf.setFont('helvetica', 'normal')
            if (invoice.clientAddress) {
                pdf.text(invoice.clientAddress, leftColX, yPosition)
                yPosition += 5
            }
            if (invoice.clientEmail) {
                pdf.text(invoice.clientEmail, leftColX, yPosition)
            }

            // Invoice Details section (right column)
            let rightYPosition = yPosition - 20
            pdf.setFontSize(12)
            pdf.setTextColor(79, 70, 229)
            pdf.setFont('helvetica', 'bold')
            pdf.text('Invoice Details', rightColX, rightYPosition)

            rightYPosition += 8
            pdf.setFontSize(10)
            pdf.setTextColor(0, 0, 0)
            pdf.setFont('helvetica', 'normal')
            
            const addDetailRow = (label: string, value: string) => {
                pdf.setFont('helvetica', 'bold')
                pdf.text(label + ':', rightColX, rightYPosition)
                pdf.setFont('helvetica', 'normal')
                pdf.text(value, rightColX + 25, rightYPosition)
                rightYPosition += 5
            }

            addDetailRow('Issue Date', new Date(invoice.issueDate).toLocaleDateString())
            addDetailRow('Due Date', new Date(invoice.dueDate).toLocaleDateString())
            addDetailRow('Status', invoice.status.toUpperCase())

            yPosition += 30

            // Items Table
            if (invoice.items && invoice.items.length > 0) {
                const tableY = yPosition
                const colX = [margin, margin + 80, margin + 105, margin + 135]
                
                // Header background
                pdf.setFillColor(79, 70, 229)
                pdf.rect(margin, tableY, pageWidth - 2 * margin, 8, 'F')
                
                // Header text
                pdf.setFontSize(10)
                pdf.setTextColor(255, 255, 255)
                pdf.setFont('helvetica', 'bold')
                pdf.text('Description', colX[0] + 2, tableY + 5)
                pdf.text('Qty', colX[1] + 2, tableY + 5)
                pdf.text('Rate', colX[2] + 2, tableY + 5)
                pdf.text('Amount', colX[3] + 2, tableY + 5)

                yPosition = tableY + 8

                // Table rows
                pdf.setTextColor(0, 0, 0)
                pdf.setFont('helvetica', 'normal')
                
                invoice.items.forEach((item, index) => {
                    yPosition += 6
                    
                    // Alternating row background
                    if (index % 2 === 1) {
                        pdf.setFillColor(249, 250, 251)
                        pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F')
                    }
                    
                    // Add border lines
                    pdf.setDrawColor(229, 231, 235)
                    pdf.setLineWidth(0.1)
                    pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2)
                    
                    // Item data
                    pdf.text(item.description.substring(0, 45), colX[0] + 2, yPosition)
                    pdf.text(item.quantity.toString(), colX[1] + 2, yPosition)
                    pdf.text('$' + item.rate.toFixed(2), colX[2] + 2, yPosition)
                    pdf.text('$' + item.amount.toFixed(2), colX[3] + 2, yPosition)
                })

                yPosition += 15
            }

            // Totals section (right-aligned)
            const totalsX = pageWidth - margin - 60
            yPosition += 10

            // Totals box background
            pdf.setFillColor(248, 250, 252)
            pdf.setDrawColor(229, 231, 235)
            pdf.rect(totalsX - 5, yPosition - 5, 65, 30, 'FD')

            pdf.setFontSize(10)
            pdf.setTextColor(0, 0, 0)
            
            const addTotalRow = (label: string, amount: number, isFinal = false) => {
                if (isFinal) {
                    pdf.setFont('helvetica', 'bold')
                    pdf.setFontSize(12)
                    pdf.setTextColor(79, 70, 229)
                } else {
                    pdf.setFont('helvetica', 'normal')
                    pdf.setFontSize(10)
                    pdf.setTextColor(0, 0, 0)
                }
                
                pdf.text(label + ':', totalsX, yPosition)
                pdf.text('$' + amount.toFixed(2), totalsX + 40, yPosition, { align: 'right' })
                yPosition += isFinal ? 8 : 6
            }

            addTotalRow('Subtotal', invoice.subtotal)
            if (invoice.taxRate > 0) {
                addTotalRow(`Tax (${invoice.taxRate}%)`, invoice.taxAmount)
            }
            
            // Final total with line
            pdf.setDrawColor(79, 70, 229)
            pdf.setLineWidth(0.5)
            pdf.line(totalsX, yPosition - 2, totalsX + 55, yPosition - 2)
            yPosition += 2
            addTotalRow('Total', invoice.total, true)

            // Notes section
            if (invoice.notes) {
                yPosition += 15
                pdf.setFontSize(12)
                pdf.setTextColor(79, 70, 229)
                pdf.setFont('helvetica', 'bold')
                pdf.text('Notes', margin, yPosition)
                
                yPosition += 8
                pdf.setFontSize(10)
                pdf.setTextColor(0, 0, 0)
                pdf.setFont('helvetica', 'normal')
                
                const splitNotes = pdf.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
                pdf.text(splitNotes, margin, yPosition)
                yPosition += splitNotes.length * 5
            }

            // Payment Instructions
            if (invoice.paymentInstructions) {
                yPosition += 10
                pdf.setFontSize(12)
                pdf.setTextColor(79, 70, 229)
                pdf.setFont('helvetica', 'bold')
                pdf.text('Payment Instructions', margin, yPosition)
                
                yPosition += 8
                pdf.setFontSize(10)
                pdf.setTextColor(0, 0, 0)
                pdf.setFont('helvetica', 'normal')
                
                const splitInstructions = pdf.splitTextToSize(invoice.paymentInstructions, pageWidth - 2 * margin)
                pdf.text(splitInstructions, margin, yPosition)
            }

            // Auto-download the PDF
            const fileName = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`
            pdf.save(fileName)

            toast.push(
                <Notification type="success">
                    PDF downloaded successfully: {fileName}
                </Notification>,
                { placement: 'top-center' }
            )
        } catch (error) {
            console.error('Error exporting to PDF:', error)
            toast.push(
                <Notification type="danger">
                    Failed to export PDF: {error instanceof Error ? error.message : 'Unknown error'}
                </Notification>,
                { placement: 'top-center' }
            )
        }
    }

    // Print invoice
    const handlePrint = useReactToPrint({
        contentRef: printRef,
    })

    if (isLoading) {
        return (
            <Container>
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8">
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="max-w-4xl mx-auto">
                {/* Action Buttons */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">
                        {isViewMode ? `Invoice ${invoice.invoiceNumber}` : 'Create Invoice'}
                    </h1>
                    <div className="flex gap-2">
                        {!isViewMode && (
                            <Button
                                variant="default"
                                icon={<HiOutlineSave />}
                                onClick={saveInvoice}
                                loading={isSaving}
                            >
                                Save
                            </Button>
                        )}
                        <Button
                            variant="default"
                            icon={<HiOutlineDocumentDownload />}
                            onClick={exportToPDF}
                        >
                            Export PDF
                        </Button>
                        {isViewMode && (
                            <Button
                                variant="default"
                                onClick={() => router.push('/concepts/invoicing/view-invoices')}
                            >
                                Back to Invoices
                            </Button>
                        )}
                        <Button
                            variant="default"
                            icon={<HiOutlinePrinter />}
                            onClick={handlePrint}
                        >
                            Print
                        </Button>
                    </div>
                </div>

                {/* Invoice Form */}
                <Card className="p-8">
                    <div ref={printRef}>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                {userProfile?.logo_url && (
                                    <img
                                        src={userProfile.logo_url}
                                        alt="Company Logo"
                                        className="h-16 mb-4"
                                    />
                                )}
                                <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-semibold mb-2">
                                    Invoice #{invoice.invoiceNumber}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Status: <span className="font-medium">{invoice.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* From/To Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* From - Company Info */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">From:</h3>
                                <div className="space-y-2">
                                    <div className="font-medium">{invoice.companyName}</div>
                                    {invoice.companyAddress && <div>{invoice.companyAddress}</div>}
                                    {invoice.companyPhone && <div>{invoice.companyPhone}</div>}
                                    {invoice.companyEmail && <div>{invoice.companyEmail}</div>}
                                </div>
                            </div>

                            {/* To - Client Info */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">To:</h3>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Client Name"
                                        value={invoice.clientName}
                                        onChange={(e) => updateInvoiceField('clientName', e.target.value)}
                                        className="font-medium"
                                        readOnly={isViewMode}
                                    />
                                    <Input
                                        placeholder="Client Address"
                                        value={invoice.clientAddress}
                                        onChange={(e) => updateInvoiceField('clientAddress', e.target.value)}
                                        readOnly={isViewMode}
                                    />
                                    <Input
                                        placeholder="Client Email"
                                        type="email"
                                        value={invoice.clientEmail}
                                        onChange={(e) => updateInvoiceField('clientEmail', e.target.value)}
                                        readOnly={isViewMode}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Issue Date
                                </label>
                                <Input
                                    type="date"
                                    value={invoice.issueDate}
                                    onChange={(e) => updateInvoiceField('issueDate', e.target.value)}
                                    readOnly={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due Date
                                </label>
                                <Input
                                    type="date"
                                    value={invoice.dueDate}
                                    onChange={(e) => updateInvoiceField('dueDate', e.target.value)}
                                    readOnly={isViewMode}
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-800">Items</h3>
                                <Button
                                    size="sm"
                                    variant="default"
                                    icon={<HiOutlinePlus />}
                                    onClick={addItem}
                                    style={{ display: isViewMode ? 'none' : 'inline-flex' }}
                                >
                                    Add Item
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-24">Qty</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 w-32">Rate</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 w-32">Amount</th>
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item) => (
                                            <tr key={item.id} className="border-t">
                                                <td className="px-4 py-3">
                                                    <Input
                                                        placeholder="Item description"
                                                        value={item.description}
                                                        onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                                                        readOnly={isViewMode}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="text-center"
                                                        readOnly={isViewMode}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.rate}
                                                        onChange={(e) => updateInvoiceItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="text-right"
                                                        readOnly={isViewMode}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    ${item.amount.toFixed(2)}
                                                </td>
                                                <td className="px-2 py-3">
                                                    {invoice.items.length > 1 && !isViewMode && (
                                                        <Button
                                                            size="sm"
                                                            variant="plain"
                                                            icon={<HiOutlineTrash />}
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals and Payment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Payment Method and Notes */}
                            <div className="space-y-4">
                                {paymentMethods.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Method
                                        </label>
                                        <Select
                                            placeholder="Select payment method"
                                            value={paymentMethods.find(m => m.id === invoice.paymentMethodId)}
                                            onChange={(option) => updatePaymentMethod(option?.id || '')}
                                            options={paymentMethods.map(method => ({
                                                label: method.method_name,
                                                value: method.id,
                                                id: method.id
                                            }))}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Additional notes..."
                                        value={invoice.notes}
                                        onChange={(e) => updateInvoiceField('notes', e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        readOnly={isViewMode}
                                    />
                                </div>

                                {invoice.paymentInstructions && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Instructions
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                                            {invoice.paymentInstructions}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Totals */}
                            <div>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>${invoice.subtotal.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span>Tax Rate (%):</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={invoice.taxRate}
                                                onChange={(e) => updateInvoiceField('taxRate', parseFloat(e.target.value) || 0)}
                                                className="w-20 text-right"
                                            />
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Tax Amount:</span>
                                            <span>${invoice.taxAmount.toFixed(2)}</span>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="flex justify-between text-lg font-bold">
                                                <span>Total:</span>
                                                <span>${invoice.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    .print-hidden {
                        display: none !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    #invoice-content, #invoice-content * {
                        visibility: visible;
                    }

                    #invoice-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </Container>
    )
}

export default CreateInvoice
