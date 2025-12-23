'use client'

import ClientListSearch from './ClientListSearch'
import ClientTableFilter from './ClientListTableFilter'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'

const ClientListTableTools = () => {
    const { onAppendQueryParams } = useAppendQueryParams()

    const handleInputChange = (query: string) => {
        onAppendQueryParams({
            query,
        })
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <ClientListSearch onInputChange={handleInputChange} />
            <ClientTableFilter />
        </div>
    )
}

export default ClientListTableTools
