import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ClientListProvider from './_components/ClientListProvider'
import ClientListTable from './_components/ClientListTable'
import ClientListActionTools from './_components/ClientListActionTools'
import ClientListTableTools from './_components/ClientListTableTools'
import ClientListSelected from './_components/ClientListSelected'
import getClients from '@/server/actions/getClients'
import type { PageProps } from '@/@types/common'

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams
    const data = await getClients(params)

    return (
        <ClientListProvider clientList={data.list}>
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h3>Clients</h3>
                            <ClientListActionTools />
                        </div>
                        <ClientListTableTools />
                        <ClientListTable
                            clientListTotal={data.total}
                            pageIndex={
                                parseInt(params.pageIndex as string) || 1
                            }
                            pageSize={parseInt(params.pageSize as string) || 10}
                        />
                    </div>
                </AdaptiveCard>
            </Container>
            <ClientListSelected />
        </ClientListProvider>
    )
}
