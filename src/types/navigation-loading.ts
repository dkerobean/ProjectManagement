export interface PageLoadingConfig {
    /** Minimum loading time in milliseconds */
    minimumLoadingTime?: number
    /** Maximum loading time before force clearing */
    maxLoadingTime?: number
    /** Check for specific elements that indicate page readiness */
    waitForSelectors?: string[]
    /** Ignore certain loading indicators */
    ignoreSelectors?: string[]
    /** Custom readiness check function */
    customReadinessCheck?: () => boolean | Promise<boolean>
    /** Skip image loading checks */
    skipImageChecks?: boolean
    /** Skip font loading checks */
    skipFontChecks?: boolean
    /** Skip skeleton checks */
    skipSkeletonChecks?: boolean
}

export interface NavigationLoadingConfig {
    /** Global configuration */
    global: PageLoadingConfig
    /** Page-specific configurations keyed by pathname pattern */
    pages: Record<string, PageLoadingConfig>
}

export const defaultLoadingConfig: NavigationLoadingConfig = {
    global: {
        minimumLoadingTime: 500,
        maxLoadingTime: 5000,
        waitForSelectors: ['main', '[role="main"]', '.main-content'],
        ignoreSelectors: [],
        skipImageChecks: false,
        skipFontChecks: false,
        skipSkeletonChecks: false,
    },
    pages: {
        '/dashboards/project': {
            minimumLoadingTime: 300,
            waitForSelectors: ['.project-overview', '.current-tasks'],
            skipImageChecks: true,
        },
        '/concepts/clients': {
            minimumLoadingTime: 400,
            waitForSelectors: ['.client-list-table', '.client-cards'],
        },
        '/concepts/invoicing': {
            minimumLoadingTime: 600,
            waitForSelectors: ['.invoice-table', '.invoice-summary'],
            skipSkeletonChecks: true,
        },
        '/concepts/projects': {
            minimumLoadingTime: 400,
            waitForSelectors: ['.projects-grid', '.project-table'],
        },
        '/concepts/tasks': {
            minimumLoadingTime: 350,
            waitForSelectors: ['.tasks-container', '.task-filters'],
        },
    }
}