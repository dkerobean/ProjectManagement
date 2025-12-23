import { create } from 'zustand'
import type { Client, Filter } from '../../types'

export const initialFilterData = {
    status: ['active', 'inactive'],
    company: '',
}

export type ClientsListState = {
    initialLoading: boolean
    clientList: Client[]
    filterData: Filter
    selectedClient: Partial<Client>[]
}

type ClientsListAction = {
    setClientList: (clientList: Client[]) => void
    setFilterData: (payload: Filter) => void
    setSelectedClient: (checked: boolean, client: Client) => void
    setSelectAllClient: (client: Client[]) => void
    setInitialLoading: (payload: boolean) => void
}

const initialState: ClientsListState = {
    initialLoading: true,
    clientList: [],
    filterData: initialFilterData,
    selectedClient: [],
}

export const useClientListStore = create<
    ClientsListState & ClientsListAction
>((set) => ({
    ...initialState,
    setFilterData: (payload) => set(() => ({ filterData: payload })),
    setSelectedClient: (checked, row) =>
        set((state) => {
            const prevData = state.selectedClient
            if (checked) {
                return { selectedClient: [...prevData, ...[row]] }
            } else {
                if (
                    prevData.some((prevClient) => row.id === prevClient.id)
                ) {
                    return {
                        selectedClient: prevData.filter(
                            (prevClient) => prevClient.id !== row.id,
                        ),
                    }
                }
                return { selectedClient: prevData }
            }
        }),
    setSelectAllClient: (row) => set(() => ({ selectedClient: row })),
    setClientList: (clientList) => set(() => ({ clientList })),
    setInitialLoading: (payload) => set(() => ({ initialLoading: payload })),
}))
