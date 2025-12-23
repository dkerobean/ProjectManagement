import { ADMIN, MEMBER } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

const goldRoute: Routes = {
    '/gold': {
        key: 'gold.dashboard',
        authority: [ADMIN, MEMBER],
        meta: {
            pageContainerType: 'gutterless',
        },
    },
    '/gold/trade': {
        key: 'gold.trade',
        authority: [ADMIN, MEMBER],
        meta: {
            pageContainerType: 'gutterless',
        },
    },
    '/gold/vault': {
        key: 'gold.vault',
        authority: [ADMIN, MEMBER],
        meta: {
            pageContainerType: 'gutterless',
        },
    },
    '/gold/suppliers': {
        key: 'gold.suppliers',
        authority: [ADMIN, MEMBER],
        meta: {
            pageContainerType: 'gutterless',
        },
    },
    '/gold/suppliers/[id]': {
        key: 'gold.supplier-details',
        authority: [ADMIN, MEMBER],
        meta: {
            pageContainerType: 'gutterless',
        },
    },
    '/gold/reports': {
        key: 'gold.reports',
        authority: [ADMIN, MEMBER],
        meta: {
            pageContainerType: 'gutterless',
        },
    },
    '/gold/settings': {
        key: 'gold.settings',
        authority: [ADMIN, MEMBER],
        meta: {
            pageContainerType: 'gutterless',
        },
    },
}

export default goldRoute

