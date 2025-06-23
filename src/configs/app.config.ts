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
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    activeNavTranslation: true,
}

export default appConfig
