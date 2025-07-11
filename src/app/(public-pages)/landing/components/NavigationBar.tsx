'use client'
import { useState } from 'react'
import NavList from './NavList'
import Drawer from '@/components/ui/Drawer'
import classNames from '@/utils/classNames'
import useScrollTop from '@/utils/hooks/useScrollTop'
import Image from 'next/image'
import { TbMenu2 } from "react-icons/tb";
import Link from 'next/link'
import type { Mode } from '@/@types/theme'

type NavigationProps = {
    toggleMode: () => void
    mode: Mode
}

const navMenu = [
    {
        title: 'Features',
        value: 'features',
        to: 'features'
    },
    {
        title: 'Dashboard',
        value: 'dashboard',
        href: '/dashboards/project'
    },
    {
        title: 'Scrum Board',
        value: 'scrum',
        href: '/app/scrum-board'
    }
]

const Navigation = ({ toggleMode, mode }: NavigationProps) => {

    const { isSticky } = useScrollTop()

    const [isOpen, setIsOpen] = useState(false)

    const openDrawer = () => {
        setIsOpen(true)
    }

    const onDrawerClose = () => {
        setIsOpen(false)
    }

    return (
        <div style={{transition: 'all 0.2s ease-in-out'}} className={classNames('w-full fixed inset-x-0 z-[50]', isSticky ? 'top-4' : 'top-0')}>
            <div className={
                classNames('flex flex-row self-start items-center justify-between py-3 max-w-7xl mx-auto px-4 rounded-xl relative z-[60] w-full transition duration-200', isSticky ? 'bg-white dark:bg-gray-800 shadow-lg' : 'bg-transparent dark:bg-transparent')
            }>
                <button onClick={openDrawer} className="flex lg:hidden items-center gap-4">
                    <TbMenu2 size={24} />
                </button>                <Drawer
                    title="Navigation"
                    isOpen={isOpen}
                    onClose={onDrawerClose}
                    onRequestClose={onDrawerClose}
                    width={250}
                    placement="left"
                >
                    <div className="flex flex-col gap-4">
                        <NavList onTabClick={onDrawerClose} tabs={
                            navMenu
                        } />
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col gap-2">
                            <Link 
                                href="/sign-in"
                                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors text-center"
                                onClick={onDrawerClose}
                            >
                                Sign In
                            </Link>
                            <Link 
                                href="/sign-up"
                                className="bg-gradient-to-r from-[#2feaa8] to-[#0eb9ce] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 text-center"
                                onClick={onDrawerClose}
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </Drawer>
                <Link href="/">
                    {
                        mode === 'light' && (
                            <Image 
                                src="/img/logo/logo-light-full.png"
                                width={120}
                                height={40}
                                alt="logo"
                            />
                        )
                    }
                    {
                        mode === 'dark' && (
                            <Image 
                                src="/img/logo/logo-dark-full.png"
                                width={120}
                                height={40}
                                alt="logo"
                            />
                        )
                    }
                </Link>
                <div className="lg:flex flex-row flex-1 absolute inset-0 hidden items-center justify-center text-sm text-zinc-600 font-medium hover:text-zinc-800 transition duration-200 [perspective:1000px] overflow-auto sm:overflow-visible no-visible-scrollbar">
                    <NavList tabs={
                        navMenu
                    } />
                </div>                <div className="flex items-center gap-2">
                    <Link 
                        href="/sign-in"
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link 
                        href="/sign-up"
                        className="bg-gradient-to-r from-[#2feaa8] to-[#0eb9ce] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                    >
                        Get Started
                    </Link>
                    <button className="relative flex cursor-pointer items-center justify-center rounded-xl p-2 text-neutral-500 hover:shadow-input dark:text-neutral-500" onClick={toggleMode}>
                        <svg
                            className="lucide lucide-sun rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                            fill="none"
                            height="16"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                        </svg>
                        <svg
                            className="lucide lucide-moon absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                            fill="none"
                            height="16"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                        <span className="sr-only">Toggle theme</span>
                    </button>                    <div className="border border-gray-200 dark:border-gray-700 rounded-full inline-flex items-center justify-center gap-2 py-1 px-2 bg-white dark:bg-gray-800">
                        <div className="w-6 h-6 bg-gradient-to-r from-[#2feaa8] to-[#0eb9ce] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Z</span>
                        </div>
                        <span className="heading-text">Zeno</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navigation
