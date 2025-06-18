import ClientEdit from './_components/ClientEdit'
import type { PageProps } from '@/@types/common'

export default async function Page({ params }: PageProps) {
    const { slug } = await params

    return <ClientEdit clientId={slug as string} />
}
