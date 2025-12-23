import dashboardsRoute from './dashboardsRoute'
import conceptsRoute from './conceptsRoute'
import uiComponentsRoute from './uiComponentsRoute'
import authRoute from './authRoute'
import authDemoRoute from './authDemoRoute'
import guideRoute from './guideRoute'
import goldRoute from './goldRoute'
// import othersRoute from './othersRoute'
import type { Routes } from '@/@types/routes'

export const protectedRoutes: Routes = {
    ...dashboardsRoute,
    ...uiComponentsRoute,
    ...authDemoRoute,
    ...conceptsRoute,
    ...guideRoute,
    ...goldRoute,
}

export const publicRoutes: Routes = {
    '/': {
        key: 'landing',
        authority: [],
    },
    '/landing': {
        key: 'landing-page',
        authority: [],
    },
}

export const authRoutes = authRoute
