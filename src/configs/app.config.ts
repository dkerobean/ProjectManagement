export type AppConfig = {
    apiPrefix: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    locale: string
    activeNavTranslation: boolean
}

const appConfig: AppConfig = {
    apiPrefix: '/api',
    authenticatedEntryPath: '/dashboards/project',
    unAuthenticatedEntryPath: '/landing',
    locale: 'en',
    activeNavTranslation: true,
}

export default appConfig
