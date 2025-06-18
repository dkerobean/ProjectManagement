'use client'

import { useEffect } from 'react'
import { useClientListStore } from '../_store/clientListStore'
import type { Client } from '../../types'
import type { CommonProps } from '@/@types/common'

interface ClientListProviderProps extends CommonProps {
    clientList: Client[]
}

const ClientListProvider = ({
    clientList,
    children,
}: ClientListProviderProps) => {
    const setClientList = useClientListStore(
        (state) => state.setClientList,
    )

    const setInitialLoading = useClientListStore(
        (state) => state.setInitialLoading,
    )

    useEffect(() => {
        setClientList(clientList)
        setInitialLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientList])

    return <>{children}</>
}

export default ClientListProvider
