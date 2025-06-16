'use client'

import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select, { Option } from '@/components/ui/Select'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { HiOutlinePrinter, HiOutlineDocumentDownload, HiOutlinePlus, HiOutlineTrash, HiOutlineSave } from 'react-icons/hi'
import { format } from 'date-fns'

interface InvoiceItem {
    id: string
    description: string
    quantity: number
    rate: number
    amount: number
}

interface InvoiceData {
    id: string
    invoiceNumber: string
    date: string
    dueDate: string
    status: 'draft' | 'sent' | 'paid' | 'overdue'
    
    // Company Info
    companyName: string
    companyAddress: string
    companyCity: string
    companyZip: string
    companyPhone: string
    companyEmail: string
    
    // Client Info
    clientName: string
    clientAddress: string
    clientCity: string
    clientZip: string
    clientEmail: string
    
    // Invoice Items
    items: InvoiceItem[]
    
    // Totals
    subtotal: number
    taxRate: number
    taxAmount: number
    total: number
    
    // Payment Info
    paymentTerms: string
    notes: string
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
                        >
                            <Option value="Net 15">Net 15</Option>
                            <Option value="Net 30">Net 30</Option>
                            <Option value="Net 60">Net 60</Option>
                            <Option value="Due on Receipt">Due on Receipt</Option>
                        </Select>
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
