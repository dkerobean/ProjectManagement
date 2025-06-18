import { create } from 'zustand'
import type { CalendarEvents, CalendarEvent } from '../types'

type CalendarState = {
    data: CalendarEvents
    initialLoading: boolean
}

type CalendarAction = {
    setData: (data: CalendarEvents) => void
    setInitialLoading: (initialLoading: boolean) => void
    loadEvents: () => Promise<void>
    createEvent: (eventData: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent | null>
    updateEvent: (id: string, eventData: Partial<CalendarEvent>) => Promise<CalendarEvent | null>
    deleteEvent: (id: string) => Promise<boolean>
}

const initialState: CalendarState = {
    data: [],
    initialLoading: true,
}

export const useCalendar = create<CalendarState & CalendarAction>(
    (set, get) => ({
        ...initialState,

        setData: (data) => set(() => ({ data })),

        setInitialLoading: (initialLoading) => set(() => ({ initialLoading })),

        // Load all events from the API
        loadEvents: async () => {
            try {
                console.log('🔄 Loading calendar events from API...')
                set(() => ({ initialLoading: true }))

                const response = await fetch('/api/calendar/events')

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const result = await response.json()
                console.log('✅ Events loaded successfully:', result.data?.length || 0)

                set(() => ({
                    data: result.data || [],
                    initialLoading: false
                }))

            } catch (error) {
                console.error('❌ Failed to load events:', error)
                set(() => ({ initialLoading: false }))
            }
        },        // Create a new event
        createEvent: async (eventData) => {
            try {
                console.log('🔄 Creating new calendar event...')

                const response = await fetch('/api/calendar/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventData),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                    console.error('❌ HTTP error response:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData
                    })
                    throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`)
                }

                const result = await response.json()
                console.log('✅ Event created successfully:', result.data.id)

                // Update local state
                const currentData = get().data
                set(() => ({ data: [...currentData, result.data] }))

                return result.data

            } catch (error) {
                console.error('❌ Failed to create event:', error)
                return null
            }
        },

        // Update an existing event
        updateEvent: async (id, eventData) => {
            try {
                console.log('🔄 Updating calendar event:', id)

                const response = await fetch('/api/calendar/events', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id, ...eventData }),
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const result = await response.json()
                console.log('✅ Event updated successfully:', result.data.id)

                // Update local state
                const currentData = get().data
                const updatedData = currentData.map(event =>
                    event.id === id ? result.data : event
                )
                set(() => ({ data: updatedData }))

                return result.data

            } catch (error) {
                console.error('❌ Failed to update event:', error)
                return null
            }
        },

        // Delete an event
        deleteEvent: async (id) => {
            try {
                console.log('🔄 Deleting calendar event:', id)

                const response = await fetch(`/api/calendar/events?id=${id}`, {
                    method: 'DELETE',
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                console.log('✅ Event deleted successfully:', id)

                // Update local state
                const currentData = get().data
                const filteredData = currentData.filter(event => event.id !== id)
                set(() => ({ data: filteredData }))

                return true

            } catch (error) {
                console.error('❌ Failed to delete event:', error)
                return false
            }
        },
    }),
)
