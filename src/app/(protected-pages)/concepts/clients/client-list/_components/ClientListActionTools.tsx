'use client'

import Button from '@/components/ui/Button'
import { TbCloudDownload, TbUserPlus } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { useClientListStore } from '../_store/clientListStore'
import dynamic from 'next/dynamic'

const CSVLink = dynamic(() =>
    import('react-csv').then((mod) => mod.CSVLink), {
        ssr: false,
    }
)

const ClientListActionTools = () => {
    const router = useRouter()

    const clientList = useClientListStore((state) => state.clientList)

    return (
        <div className="flex flex-col md:flex-row gap-3">
            <CSVLink
                className="w-full"
                filename="clientList.csv"
                data={clientList}
            >
                <Button
                    icon={<TbCloudDownload className="text-xl" />}
                    className="w-full"
                >
                    Download
                </Button>
            </CSVLink>
            <Button
                variant="solid"
                icon={<TbUserPlus className="text-xl" />}
                onClick={() =>
                    router.push('/concepts/clients/client-create')
                }
            >
                Add new
            </Button>
        </div>
    )
}

export default ClientListActionTools
