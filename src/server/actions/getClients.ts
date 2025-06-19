// Server action for clients using Supabase MCP integration
import type { Client } from '@/app/(protected-pages)/concepts/clients/types'
import { createClient } from '@supabase/supabase-js'

// Helper function to get default image for clients
const getDefaultClientImage = () => {
    // Use a consistent generic image for all clients
    return '/img/avatars/thumb-1.jpg'
}

const getClients = async (_queryParams: {
    [key: string]: string | string[] | undefined
}) => {
    const queryParams = _queryParams

    const {
        pageIndex = '1',
        pageSize = '10',
        sortKey = 'name',
        order = 'asc',
        query,
    } = queryParams

    try {
        // Use Supabase client to fetch data directly from the database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpwitcdoiviixlxnuz.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk'

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Build Supabase query
        let supabaseQuery = supabase.from('clients').select('*', { count: 'exact' })

        // Apply search filter
        if (query && typeof query === 'string') {
            supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%,phone.like.%${query}%`)
        }

        // Apply sorting
        if (sortKey && typeof sortKey === 'string') {
            supabaseQuery = supabaseQuery.order(sortKey, { ascending: order !== 'desc' })
        } else {
            supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
        }

        // Apply pagination
        const limit = parseInt(pageSize as string)
        const offset = (parseInt(pageIndex as string) - 1) * limit
        supabaseQuery = supabaseQuery.range(offset, offset + limit - 1)

        const { data: clients, count, error } = await supabaseQuery

        if (error) {
            console.error('Supabase error:', error)
            throw error
        }

        // Process clients and apply default images
        const processedClients = (clients || []).map(client => ({
            ...client,
            image_url: client.image_url || getDefaultClientImage()
        })) as Client[]

        return {
            list: processedClients,
            total: count || 0,
        }

    } catch (error) {
        console.error('Error fetching clients:', error)
        // Return empty result on error
        return {
            list: [],
            total: 0,
        }
    }
}

export default getClients
