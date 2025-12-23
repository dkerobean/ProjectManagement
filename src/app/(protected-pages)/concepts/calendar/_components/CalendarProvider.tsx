'use client'
import { useEffect } from 'react'
import { useCalendar } from '../_store/calendarStore'
import type { CommonProps } from '@/@types/common'

const CalendarProvider = ({ children }: CommonProps) => {
    const loadEvents = useCalendar((state) => state.loadEvents)

    useEffect(() => {
        const initializeCalendar = async () => {
            // Always load events from Supabase database
            console.log('🔄 Loading events from Supabase database...')
            await loadEvents()
        }

        initializeCalendar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <>{children}</>
}

export default CalendarProvider
