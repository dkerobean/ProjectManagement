import { CONCEPTS_PREFIX_PATH } from '@/constants/route.constant'
import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_COLLAPSE,
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const conceptsNavigationConfig: NavigationTree[] = [
    {
        key: 'concepts',
        path: '',
        title: 'Project Management',
        translateKey: 'nav.projectManagement',
        icon: 'concepts',
        type: NAV_ITEM_TYPE_TITLE,
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 4,
            },
        },
        subMenu: [
            // Move Projects submenu items to top-level
            {
                key: 'concepts.projects.crud',
                path: `${CONCEPTS_PREFIX_PATH}/projects`,
                title: 'Projects',
                translateKey: 'nav.conceptsProjects.projects',
                icon: 'projects',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.conceptsProjects.projectsDesc',
                        label: 'Manage and track projects',
                    },
                },
                subMenu: [],
            },
            {
                key: 'concepts.projects.scrumBoard',
                path: `${CONCEPTS_PREFIX_PATH}/projects/scrum-board`,
                title: 'Scrum Board',
                translateKey: 'nav.conceptsProjects.scrumBoard',
                icon: 'projectScrumBoard',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey:
                            'nav.conceptsProjects.scrumBoardDesc',
                        label: 'Manage your scrum workflow',
                    },
                },
                subMenu: [],
            },
            {
                key: 'concepts.projects.projectDashboard',
                path: `${CONCEPTS_PREFIX_PATH}/projects/dashboard`,
                title: 'Project Dashboard',
                translateKey: 'nav.conceptsProjects.projectDashboard',
                icon: 'dashboardProject',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey:
                            'nav.conceptsProjects.projectDashboardDesc',
                        label: 'Project overview and metrics',
                    },
                },
                subMenu: [],
            },
            {
                key: 'concepts.projects.projectTasks',
                path: `${CONCEPTS_PREFIX_PATH}/projects/tasks`,
                title: 'Tasks',
                translateKey: 'nav.conceptsProjects.projectTasks',
                icon: 'projectTask',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey:
                            'nav.conceptsProjects.projectTasksDesc',
                        label: 'Manage project tasks',
                    },
                },
                subMenu: [],
            },            {
                key: 'concepts.clients',
                path: '',
                title: 'Clients',
                translateKey: 'nav.conceptsClients.clients',
                icon: 'customers',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.conceptsClients.clientsDesc',
                        label: 'Client management',
                    },
                },
                subMenu: [
                    {
                        key: 'concepts.clients.clientList',
                        path: `${CONCEPTS_PREFIX_PATH}/clients/client-list`,
                        title: 'List',
                        translateKey: 'nav.conceptsClients.clientList',
                        icon: 'customerList',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsClients.clientListDesc',
                                label: 'List of all clients',
                            },
                        },                        subMenu: [],
                    },
                    {
                        key: 'concepts.clients.clientCreate',
                        path: `${CONCEPTS_PREFIX_PATH}/clients/client-create`,
                        title: 'Create',
                        translateKey: 'nav.conceptsClients.clientCreate',
                        icon: 'customerCreate',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsClients.clientCreateDesc',
                                label: 'Add a new client',
                            },
                        },
                        subMenu: [],
                    },
                ],
            },
            // {
            //     key: 'concepts.products',
            //     path: '',
            //     title: 'Products',
            //     translateKey: 'nav.conceptsProducts.products',
            //     icon: 'products',
            //     type: NAV_ITEM_TYPE_COLLAPSE,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.conceptsProducts.productsDesc',
            //             label: 'Product inventory management',
            //         },
            //     },
            //     subMenu: [
            //         {
            //             key: 'concepts.products.productList',
            //             path: `${CONCEPTS_PREFIX_PATH}/products/product-list`,
            //             title: 'Product List',
            //             translateKey: 'nav.conceptsProducts.productList',
            //             icon: 'productList',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsProducts.productListDesc',
            //                     label: 'All products listed',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.products.productEdit',
            //             path: `${CONCEPTS_PREFIX_PATH}/products/product-edit/12`,
            //             title: 'Product Edit',
            //             translateKey: 'nav.conceptsProducts.productEdit',
            //             icon: 'productEdit',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsProducts.productEditDesc',
            //                     label: 'Edit product details',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.products.productCreate',
            //             path: `${CONCEPTS_PREFIX_PATH}/products/product-create`,
            //             title: 'Product Create',
            //             translateKey: 'nav.conceptsProducts.productCreate',
            //             icon: 'productCreate',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsProducts.productCreateDesc',
            //                     label: 'Add new product',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //     ],
            // },
            // {
            //     key: 'concepts.orders',
            //     path: '',
            //     title: 'Orders',
            //     translateKey: 'nav.conceptsOrders.orders',
            //     icon: 'orders',
            //     type: NAV_ITEM_TYPE_COLLAPSE,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.conceptsOrders.ordersDesc',
            //             label: 'Customer orders management',
            //         },
            //     },
            //     subMenu: [
            //         {
            //             key: 'concepts.orders.orderList',
            //             path: `${CONCEPTS_PREFIX_PATH}/orders/order-list`,
            //             title: 'Order List',
            //             translateKey: 'nav.conceptsOrders.orderList',
            //             icon: 'orderList',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsOrders.orderListDesc',
            //                     label: 'View all customer orders',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.orders.orderEdit',
            //             path: `${CONCEPTS_PREFIX_PATH}/orders/order-edit/95954`,
            //             title: 'Order Edit',
            //             translateKey: 'nav.conceptsOrders.orderEdit',
            //             icon: 'orderEdit',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsOrders.orderEditDesc',
            //                     label: 'Edit order details',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.orders.orderCreate',
            //             path: `${CONCEPTS_PREFIX_PATH}/orders/order-create`,
            //             title: 'Order Create',
            //             translateKey: 'nav.conceptsOrders.orderCreate',
            //             icon: 'orderCreate',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsOrders.orderCreateDesc',
            //                     label: 'Create new order',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.orders.orderDetails',
            //             path: `${CONCEPTS_PREFIX_PATH}/orders/order-details/95954`,
            //             title: 'Order Details',
            //             translateKey: 'nav.conceptsOrders.orderDetails',
            //             icon: 'ordeDetails',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsOrders.orderDetailsDesc',
            //                     label: 'Detailed order information',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //     ],
            // },
            {
                key: 'concepts.invoicing',
                path: '',
                title: 'Invoicing',
                translateKey: 'nav.conceptsInvoicing.invoicing',
                icon: 'invoice',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.conceptsInvoicing.invoicingDesc',
                        label: 'Invoice and billing management',
                    },
                },
                subMenu: [
                    {
                        key: 'concepts.invoicing.createInvoice',
                        path: `${CONCEPTS_PREFIX_PATH}/invoicing/create-invoice`,
                        title: 'Create Invoice',
                        translateKey: 'nav.conceptsInvoicing.createInvoice',
                        icon: 'invoiceCreate',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey: 'nav.conceptsInvoicing.createInvoiceDesc',
                                label: 'Create new invoices',
                            },
                        },
                        subMenu: [],
                    },                    {
                        key: 'concepts.invoicing.viewInvoices',
                        path: `${CONCEPTS_PREFIX_PATH}/invoicing/view-invoices`,
                        title: 'View Invoices',
                        translateKey: 'nav.conceptsInvoicing.viewInvoices',
                        icon: 'invoiceList',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey: 'nav.conceptsInvoicing.viewInvoicesDesc',
                                label: 'Manage and view all invoices',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'concepts.invoicing.paymentMethods',
                        path: `${CONCEPTS_PREFIX_PATH}/invoicing/payment-methods`,
                        title: 'Payment Methods',
                        translateKey: 'nav.conceptsInvoicing.paymentMethods',
                        icon: 'payment',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey: 'nav.conceptsInvoicing.paymentMethodsDesc',
                                label: 'Manage payment methods',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'concepts.invoicing.companySettings',
                        path: `${CONCEPTS_PREFIX_PATH}/invoicing/company-settings`,
                        title: 'Company Settings',
                        translateKey: 'nav.conceptsInvoicing.companySettings',
                        icon: 'companySettings',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey: 'nav.conceptsInvoicing.companySettingsDesc',
                                label: 'Manage company profile and logo',
                            },
                        },
                        subMenu: [],
                    },
                ],
            },
            {
                key: 'concepts.account',
                path: '',
                title: 'Account',
                translateKey: 'nav.conceptsAccount.account',
                icon: 'account',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.conceptsAccount.accountDesc',
                        label: 'Account settings and info',
                    },
                },
                subMenu: [
                    {
                        key: 'concepts.account.settings',
                        path: `${CONCEPTS_PREFIX_PATH}/account/settings`,
                        title: 'Settings',
                        translateKey: 'nav.conceptsAccount.settings',
                        icon: 'accountSettings',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsAccount.settingsDesc',
                                label: 'Configure your settings',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'concepts.account.activityLog',
                        path: `${CONCEPTS_PREFIX_PATH}/account/activity-log`,
                        title: 'Activity log',
                        translateKey: 'nav.conceptsAccount.activityLog',
                        icon: 'accountActivityLogs',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsAccount.activityLogDesc',
                                label: 'View recent activities',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'concepts.account.rolesPermissions',
                        path: `${CONCEPTS_PREFIX_PATH}/account/roles-permissions`,
                        title: 'Roles & Permissions',
                        translateKey: 'nav.conceptsAccount.rolesPermissions',
                        icon: 'accountRoleAndPermission',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsAccount.rolesPermissionsDesc',
                                label: 'Manage roles & permissions',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'concepts.account.pricing',
                        path: `${CONCEPTS_PREFIX_PATH}/account/pricing`,
                        title: 'Pricing',
                        translateKey: 'nav.conceptsAccount.pricing',
                        icon: 'accountPricing',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey: 'nav.conceptsAccount.pricingDesc',
                                label: 'View pricing plans',
                            },
                        },
                        subMenu: [],
                    },
                ],
            },
            // {
            //     key: 'concepts.helpCenter',
            //     path: '',
            //     title: 'Help Center',
            //     translateKey: 'nav.conceptsHelpCenter.helpCenter',
            //     icon: 'helpCenter',
            //     type: NAV_ITEM_TYPE_COLLAPSE,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.conceptsHelpCenter.helpCenterDesc',
            //             label: 'Support and articles',
            //         },
            //     },
            //     subMenu: [
            //         {
            //             key: 'concepts.helpCenter.supportHub',
            //             path: `${CONCEPTS_PREFIX_PATH}/help-center/support-hub`,
            //             title: 'Support Hub',
            //             translateKey: 'nav.conceptsHelpCenter.supportHub',
            //             icon: 'helpCeterSupportHub',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsHelpCenter.supportHubDesc',
            //                     label: 'Central support hub',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.helpCenter.article',
            //             path: `${CONCEPTS_PREFIX_PATH}/help-center/article/pWBKE_0UiQ`,
            //             title: 'Article',
            //             translateKey: 'nav.conceptsHelpCenter.article',
            //             icon: 'helpCeterArticle',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsHelpCenter.articleDesc',
            //                     label: 'Read support articles',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.helpCenter.editArticle',
            //             path: `${CONCEPTS_PREFIX_PATH}/help-center/edit-article/pWBKE_0UiQ`,
            //             title: 'Edit Article',
            //             translateKey: 'nav.conceptsHelpCenter.editArticle',
            //             icon: 'helpCeterEditArticle',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsHelpCenter.editArticleDesc',
            //                     label: 'Modify article content',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //         {
            //             key: 'concepts.helpCenter.manageArticle',
            //             path: `${CONCEPTS_PREFIX_PATH}/help-center/manage-article`,
            //             title: 'Manage Article',
            //             translateKey: 'nav.conceptsHelpCenter.manageArticle',
            //             icon: 'helpCeterManageArticle',
            //             type: NAV_ITEM_TYPE_ITEM,
            //             authority: [ADMIN, USER],
            //             meta: {
            //                 description: {
            //                     translateKey:
            //                         'nav.conceptsHelpCenter.manageArticleDesc',
            //                     label: 'Article management',
            //                 },
            //             },
            //             subMenu: [],
            //         },
            //     ],
            // },
            {
                key: 'concepts.calendar',
                path: `${CONCEPTS_PREFIX_PATH}/calendar`,
                title: 'Calendar',
                translateKey: 'nav.calendar',
                icon: 'calendar',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.calendarDesc',
                        label: 'Schedule and events',
                    },
                },
                subMenu: [],
            },
            {
                key: 'concepts.fileManager',
                path: `${CONCEPTS_PREFIX_PATH}/file-manager`,
                title: 'File Manager',
                translateKey: 'nav.fileManager',
                icon: 'fileManager',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.fileManagerDesc',
                        label: 'Manage your files',
                    },
                },
                subMenu: [],
            },
            // {
            //     key: 'concepts.mail',
            //     path: `${CONCEPTS_PREFIX_PATH}/mail`,
            //     title: 'Mail',
            //     translateKey: 'nav.mail',
            //     icon: 'mail',
            //     type: NAV_ITEM_TYPE_ITEM,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.mailDesc',
            //             label: 'Manage your emails',
            //         },
            //     },
            //     subMenu: [],
            // },
            // {
            //     key: 'concepts.chat',
            //     path: `${CONCEPTS_PREFIX_PATH}/chat`,
            //     title: 'Chat',
            //     translateKey: 'nav.chat',
            //     icon: 'chat',
            //     type: NAV_ITEM_TYPE_ITEM,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.chatDesc',
            //             label: 'Chat with friends',
            //         },
            //     },
            //     subMenu: [],
            // },
        ],
    },
]

export default conceptsNavigationConfig









