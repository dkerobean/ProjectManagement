import ApiService from './ApiService'

export async function apiGetClients<T, U extends Record<string, unknown>>({
    ...params
}: U) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/clients`,
        method: 'get',
        params,
    })
}

export async function apiGetClient<T, U extends Record<string, unknown>>({
    id,
    ...params
}: U & { id: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/clients/${id}`,
        method: 'get',
        params,
    })
}

export async function apiCreateClient<T, U extends Record<string, unknown>>(
    data: U
) {
    console.log('🔄 ClientsService.apiCreateClient called with:', data)
    try {
        const result = await ApiService.fetchDataWithAxios<T>({
            url: `/clients`,
            method: 'post',
            data,
        })
        console.log('✅ ClientsService.apiCreateClient success:', result)
        return result
    } catch (error) {
        console.error('❌ ClientsService.apiCreateClient error:', error)
        throw error
    }
}

export async function apiUpdateClient<T, U extends Record<string, unknown>>({
    id,
    ...data
}: U & { id: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/clients/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteClient<T>({ id }: { id: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/clients/${id}`,
        method: 'delete',
    })
}
