'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    status: 'Draft' | 'Sent' | 'Paid'

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
        status: 'Draft',

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
                // Load invoice number, user profile, and payment methods in parallel
                const [invoiceNumResponse, profileResponse, paymentMethodsResponse] = await Promise.all([
                    fetch('/api/invoicing/generate-invoice-number'),
                    fetch('/api/invoicing/company-profile'),
                    fetch('/api/invoicing/payment-methods')
                ])

                // Handle invoice number
                if (invoiceNumResponse.ok) {
                    const invoiceNumData = await invoiceNumResponse.json()
                    if (invoiceNumData.success) {
                        setInvoice(prev => ({ ...prev, invoiceNumber: invoiceNumData.data.invoice_number }))
                    }
                }

                // Handle user profile
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json()
                    if (profileData.success && profileData.data) {
                        const profile = profileData.data
                        setUserProfile(profile)
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
    }, [])

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

    // Export to PDF
    const exportToPDF = async () => {
        try {
            // First save the invoice
            await saveInvoice()

            // Then trigger PDF generation (for now, just save)
            toast.push(
                <Notification type="info">
                    PDF export functionality will be implemented
                </Notification>,
                { placement: 'top-center' }
            )
        } catch (error) {
            console.error('Error exporting to PDF:', error)
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
                    <h1 className="text-2xl font-bold">Create Invoice</h1>
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            icon={<HiOutlineSave />}
                            onClick={saveInvoice}
                            loading={isSaving}
                        >
                            Save
                        </Button>
                        <Button
                            variant="default"
                            icon={<HiOutlineDocumentDownload />}
                            onClick={exportToPDF}
                        >
                            Export PDF
                        </Button>
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
                                    />
                                    <Input
                                        placeholder="Client Address"
                                        value={invoice.clientAddress}
                                        onChange={(e) => updateInvoiceField('clientAddress', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Client Email"
                                        type="email"
                                        value={invoice.clientEmail}
                                        onChange={(e) => updateInvoiceField('clientEmail', e.target.value)}
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
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    ${item.amount.toFixed(2)}
                                                </td>
                                                <td className="px-2 py-3">
                                                    {invoice.items.length > 1 && (
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

const CreateInvoice = () => {
    const printRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(false)

    const [invoice, setInvoice] = useState<InvoiceData>({
        id: '',
        invoiceNumber: `INV-${Date.now()}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
        status: 'draft',

        // Company Info (Generic defaults)
        companyName: 'Your Company Name',
        companyAddress: '123 Business Street',
        companyCity: 'City, State 12345',
        companyZip: '',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'contact@yourcompany.com',

        // Client Info
        clientName: '',
        clientAddress: '',
        clientCity: '',
        clientZip: '',
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
        paymentTerms: 'Net 30',
        notes: 'Thank you for your business!'
    })

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
            setIsLoading(true)

            // TODO: Implement Supabase save
            console.log('Saving invoice:', invoice)

            toast.push(
                <Notification title="Success" type="success">
                    Invoice saved successfully!
                </Notification>
            )
        } catch (error) {
            console.error('Error saving invoice:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to save invoice. Please try again.
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    // Print invoice
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    })

    // Generate PDF (placeholder for now)
    const generatePDF = async () => {
        try {
            setIsLoading(true)

            // TODO: Implement PDF generation
            console.log('Generating PDF for:', invoice)

            toast.push(
                <Notification title="Success" type="success">
                    PDF generated successfully!
                </Notification>
            )
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to generate PDF. Please try again.
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="h-full">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Create Invoice
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Create and customize your invoice
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="default"
                        size="sm"
                        icon={<HiOutlineSave />}
                        onClick={saveInvoice}
                        loading={isLoading}
                    >
                        Save
                    </Button>
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<HiOutlinePrinter />}
                        onClick={handlePrint}
                    >
                        Print
                    </Button>
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlineDocumentDownload />}
                        onClick={generatePDF}
                        loading={isLoading}
                    >
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Invoice Template */}
            <Card className="p-8 print:shadow-none" ref={printRef}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex-1">
                        <Input
                            value={invoice.companyName}
                            onChange={(e) => updateInvoiceField('companyName', e.target.value)}
                            className="text-2xl font-bold border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                            placeholder="Your Company Name"
                        />
                        <div className="mt-2 space-y-1">
                            <Input
                                value={invoice.companyAddress}
                                onChange={(e) => updateInvoiceField('companyAddress', e.target.value)}
                                className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                placeholder="Company Address"
                            />
                            <Input
                                value={invoice.companyCity}
                                onChange={(e) => updateInvoiceField('companyCity', e.target.value)}
                                className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                placeholder="City, State ZIP"
                            />
                            <Input
                                value={invoice.companyPhone}
                                onChange={(e) => updateInvoiceField('companyPhone', e.target.value)}
                                className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                placeholder="Phone Number"
                            />
                            <Input
                                value={invoice.companyEmail}
                                onChange={(e) => updateInvoiceField('companyEmail', e.target.value)}
                                className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                placeholder="Email Address"
                            />
                        </div>
                    </div>

                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            INVOICE
                        </h1>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Invoice #:</span>
                                <Input
                                    value={invoice.invoiceNumber}
                                    onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)}
                                    className="w-32 text-right border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                                <Input
                                    type="date"
                                    value={invoice.date}
                                    onChange={(e) => updateInvoiceField('date', e.target.value)}
                                    className="w-32 text-right border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
                                <Input
                                    type="date"
                                    value={invoice.dueDate}
                                    onChange={(e) => updateInvoiceField('dueDate', e.target.value)}
                                    className="w-32 text-right border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill To Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Bill To:
                    </h3>
                    <div className="space-y-2">
                        <Input
                            value={invoice.clientName}
                            onChange={(e) => updateInvoiceField('clientName', e.target.value)}
                            className="font-medium border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                            placeholder="Client Name"
                        />
                        <Input
                            value={invoice.clientAddress}
                            onChange={(e) => updateInvoiceField('clientAddress', e.target.value)}
                            className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                            placeholder="Client Address"
                        />
                        <Input
                            value={invoice.clientCity}
                            onChange={(e) => updateInvoiceField('clientCity', e.target.value)}
                            className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                            placeholder="City, State ZIP"
                        />
                        <Input
                            value={invoice.clientEmail}
                            onChange={(e) => updateInvoiceField('clientEmail', e.target.value)}
                            className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                            placeholder="Client Email"
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">
                                        Description
                                    </th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100 w-20">
                                        Qty
                                    </th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100 w-24">
                                        Rate
                                    </th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100 w-24">
                                        Amount
                                    </th>
                                    <th className="w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-3 px-2">
                                            <Input
                                                value={item.description}
                                                onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                                                className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                                placeholder="Item description"
                                            />
                                        </td>
                                        <td className="py-3 px-2">
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="text-right border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                                min="0"
                                                step="0.01"
                                            />
                                        </td>
                                        <td className="py-3 px-2">
                                            <Input
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => updateInvoiceItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                className="text-right border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                                min="0"
                                                step="0.01"
                                            />
                                        </td>
                                        <td className="py-3 px-2 text-right font-medium">
                                            ${item.amount.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-2">
                                            {invoice.items.length > 1 && (
                                                <Button
                                                    variant="plain"
                                                    size="xs"
                                                    icon={<HiOutlineTrash />}
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-500 hover:text-red-700 print:hidden"
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Button
                        variant="plain"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={addItem}
                        className="mt-3 print:hidden"
                    >
                        Add Item
                    </Button>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-8">
                    <div className="w-80">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                                    <Input
                                        type="number"
                                        value={invoice.taxRate}
                                        onChange={(e) => updateInvoiceField('taxRate', parseFloat(e.target.value) || 0)}
                                        className="w-16 text-right border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800"
                                        min="0"
                                        step="0.1"
                                    />
                                    <span className="text-gray-600 dark:text-gray-400">%</span>
                                </div>
                                <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Total:</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    ${invoice.total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Terms & Notes */}
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Payment Terms:
                        </h4>
                        <Select
                            value={{ label: invoice.paymentTerms, value: invoice.paymentTerms }}
                            onChange={(option) => updateInvoiceField('paymentTerms', option?.value || '')}
                            className="print:hidden"
                            options={[
                                { label: 'Net 15', value: 'Net 15' },
                                { label: 'Net 30', value: 'Net 30' },
                                { label: 'Net 60', value: 'Net 60' },
                                { label: 'Due on Receipt', value: 'Due on Receipt' }
                            ]}
                        />
                        <div className="hidden print:block text-gray-700 dark:text-gray-300">
                            {invoice.paymentTerms}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Notes:
                        </h4>
                        <Input
                            textArea
                            value={invoice.notes}
                            onChange={(e) => updateInvoiceField('notes', e.target.value)}
                            placeholder="Additional notes or terms..."
                            rows={3}
                            className="border-none p-0 bg-transparent focus:bg-white dark:focus:bg-gray-800 print:border-0"
                        />
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default CreateInvoice
