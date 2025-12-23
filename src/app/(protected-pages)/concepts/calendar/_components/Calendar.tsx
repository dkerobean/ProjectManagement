'use client'
import { useState } from 'react'
import CalendarView from '@/components/shared/CalendarView'
import Container from '@/components/shared/Container'
import EventDialog from './EventDialog'
import { useCalendar } from '../_store/calendarStore'
import dayjs from 'dayjs'
import type { SelectedCell, CalendarEventParam } from '../types'
import type {
    EventDropArg,
    EventClickArg,
    DateSelectArg,
} from '@fullcalendar/core'

const Calendar = () => {
    const [dialogOpen, setDialogOpen] = useState(false)

    const [selectedCell, setSelectedCell] = useState<SelectedCell>({
        type: '',
    })

    const events = useCalendar((state) => state.data)
    const createEvent = useCalendar((state) => state.createEvent)
    const updateEvent = useCalendar((state) => state.updateEvent)
    const deleteEvent = useCalendar((state) => state.deleteEvent)

    const handleCellSelect = (event: DateSelectArg) => {
        const { start, end } = event
        setSelectedCell({
            type: 'NEW',
            start: dayjs(start).format(),
            end: dayjs(end).format(),
        })
        setDialogOpen(true)
    }

    const handleEventClick = (arg: EventClickArg) => {
        const { start, end, id, title, extendedProps } = arg.event

        setSelectedCell({
            type: 'EDIT',
            eventColor: extendedProps.eventColor,
            title,
            start: start ? dayjs(start).toISOString() : undefined,
            end: end ? dayjs(end).toISOString() : undefined,
            id,
        })
        setDialogOpen(true)
    }

    const handleEventChange = async (arg: EventDropArg) => {
        const { id, start, end } = arg.event

        console.log('🔄 Event dragged - updating in Supabase...')

        const updateData = {
            start: dayjs(start).format(),
            end: end ? dayjs(end).format() : undefined,
        }

        const success = await updateEvent(id, updateData)

        if (!success) {
            console.error('❌ Failed to update event position')
            // Optionally, you could revert the UI change here
        } else {
            console.log('✅ Event position updated successfully')
        }
    }

    const handleSubmit = async (data: CalendarEventParam, type: string) => {
        console.log('🔄 Submitting event:', { data, type })

        if (type === 'NEW') {
            const eventData = {
                title: data.title,
                start: data.start,
                end: data.end,
                eventColor: data.eventColor,
                groupId: data.groupId,
            }

            const success = await createEvent(eventData)

            if (!success) {
                console.error('❌ Failed to create event')
                // Optionally show error toast/notification here
            } else {
                console.log('✅ Event created successfully')
            }
        }

        if (type === 'EDIT') {
            const updateData = {
                title: data.title,
                start: data.start,
                end: data.end,
                eventColor: data.eventColor,
                groupId: data.groupId,            }

            const success = await updateEvent(data.id, updateData)

            if (!success) {
                console.error('❌ Failed to update event')
                // Optionally show error toast/notification here
            } else {
                console.log('✅ Event updated successfully')
            }
        }
    }

    const handleDelete = async (eventId: string) => {
        console.log('🔄 Deleting event:', eventId)

        const success = await deleteEvent(eventId)

        if (!success) {
            console.error('❌ Failed to delete event')
            // Optionally show error toast/notification here
        } else {
            console.log('✅ Event deleted successfully')
        }
    }

    return (
        <Container className="h-full">
            <CalendarView
                editable
                selectable
                events={events}
                eventClick={handleEventClick}
                select={handleCellSelect}
                eventDrop={handleEventChange}
            />
            <EventDialog
                open={dialogOpen}
                selected={selectedCell}
                submit={handleSubmit}
                onDialogOpen={setDialogOpen}
                onDelete={handleDelete}
            />
        </Container>
    )
}

export default Calendar
