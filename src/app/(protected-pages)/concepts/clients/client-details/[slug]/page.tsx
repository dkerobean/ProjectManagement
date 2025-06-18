import ClientDetails from './_components/ClientDetails'
import type { PageProps } from '@/@types/common'

export default async function Page({ params }: PageProps) {
    const { slug } = await params

    return <ClientDetails clientId={slug as string} />
}
