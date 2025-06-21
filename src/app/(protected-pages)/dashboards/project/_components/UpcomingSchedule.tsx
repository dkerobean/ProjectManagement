'use client'

import { useState, useMemo } from 'react'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import Calendar from '@/components/ui/Calendar'
import CreateEventDialog, { eventTypes } from './CreateEventDialog'
import { isToday } from '../utils'
import classNames from '@/utils/classNames'

import dayjs from 'dayjs'
import type { FormSchema as CreateEventPayload } from './CreateEventDialog'
import type { Event } from '../types'

type ScheduledEvent = {
    id: string
    type: Event
    label: string
    time?: Date
    isCurrentEvent?: boolean
    eventColor?: string
}

type ScheduledEventProps = ScheduledEvent

const ScheduledEvent = (props: ScheduledEventProps) => {
    const { type, label, time, isCurrentEvent, eventColor } = props

    const event = eventTypes[type]

    return (
        <div className={classNames(
            "flex items-center justify-between gap-4 py-3 px-3 rounded-lg transition-all",
            isCurrentEvent
                ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 shadow-sm"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
        )}>
            <div className="flex items-center gap-3">
                <div>
                    <Avatar
                        className={classNames(
                            'text-gray-900',
                            event?.color,
                            isCurrentEvent && 'ring-2 ring-blue-500 ring-offset-1'
                        )}
                        icon={event?.icon}
                        shape="round"
                    />
                </div>
                <div>
                    <div className={classNames(
                        "font-bold heading-text",
                        isCurrentEvent && "text-blue-700 dark:text-blue-300"
                    )}>
                        {label}
                        {isCurrentEvent && (
                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                Current
                            </span>
                        )}
                    </div>
                    <div className="font-normal text-sm">{event?.label}</div>
                </div>
            </div>
            <div className="text-right">
                <span className={classNames(
                    "font-semibold heading-text",
                    isCurrentEvent && "text-blue-700 dark:text-blue-300"
                )}>
                    {time && dayjs(time).format('hh:mm')}{' '}
                </span>
                <small className="block">{time && dayjs(time).format('A')}</small>
                {eventColor && (
                    <div
                        className="w-3 h-3 rounded-full mt-1 ml-auto"
                        style={{ backgroundColor: eventColor }}
                    />
                )}
            </div>
        </div>
    )
}

type UpcomingScheduleProps = {
    upcomingEvents?: Array<{
        id: string
        type: Event
        label: string
        time: Date
        date: string
        isCurrentEvent?: boolean
        eventColor?: string
    }>
}

const UpcomingSchedule = ({ upcomingEvents = [] }: UpcomingScheduleProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(
        dayjs().toDate(),
    )
    const [createdEventCache, setCreatedEventCache] = useState<
        Record<string, ScheduledEvent[]>
    >({})

    const eventList = useMemo(() => {
        const date = selectedDate
        const dateString = dayjs(date).format('YYYY-MM-DD')
        const today = dayjs().format('YYYY-MM-DD')

        // Filter events for the selected date
        let eventsForDate = upcomingEvents.filter(event => {
            const eventDate = event.date
            const eventStart = dayjs(event.time)
            const selectedDay = dayjs(date)

            // Include events that:
            // 1. Are scheduled for the selected date
            // 2. Are current events (if today is selected)
            // 3. Span across the selected date
            return eventDate === dateString ||
                   (event.isCurrentEvent && dateString === today) ||
                   (eventStart.isSame(selectedDay, 'day'))
        })

        // Sort current events first, then by time
        eventsForDate = eventsForDate.sort((a, b) => {
            // Current events first
            if (a.isCurrentEvent && !b.isCurrentEvent) return -1
            if (!a.isCurrentEvent && b.isCurrentEvent) return 1

            // Then sort by time
            if (!a.time && !b.time) return 0
            if (!a.time) return 1
            if (!b.time) return -1
            return a.time.getTime() - b.time.getTime()
        })

        const previousCreatedEvent =
            createdEventCache[dayjs(date).toISOString()] || []

        // Combine real events with created events
        const eventList = [
            ...eventsForDate,
            ...previousCreatedEvent,
        ]

        return eventList
    }, [selectedDate, createdEventCache, upcomingEvents])

    const handleCreateEvent = (value: CreateEventPayload & { id: string }) => {
        const payload = {
            id: value.id,
            label: value.label,
            type: value.type,
            time: dayjs(selectedDate)
                .set('hour', value.time)
                .set('minute', 0)
                .toDate(),
        }
        setCreatedEventCache((prevRecord) => {
            if (prevRecord[dayjs(selectedDate).toISOString()]) {
                prevRecord[dayjs(selectedDate).toISOString()].push(payload)
            } else {
                prevRecord[dayjs(selectedDate).toISOString()] = [payload]
            }

            return structuredClone(prevRecord)
        })
    }

    return (
        <Card>
            <div className="flex flex-col md:flex-row xl:flex-col md:gap-10 xl:gap-0">
                <div className="flex items-center mx-auto w-[280px]">
                    <Calendar
                        value={selectedDate}
                        onChange={(val) => {
                            setSelectedDate(val)
                        }}
                    />
                </div>
                <div className="w-full">
                    <div className="my-6">
                        <h5>
                            Scehdule{' '}
                            {isToday(selectedDate as Date)
                                ? 'today'
                                : dayjs(selectedDate).format('DD MMM')}
                        </h5>
                    </div>                    <div className="w-full">
                        <div className="overflow-y-auto h-[280px] xl:max-w-[280px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            <div className="flex flex-col gap-4">
                                {eventList.length > 0 ? (
                                    eventList.map((event) => (
                                        <ScheduledEvent key={event.id} {...event} />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No events scheduled for this date</p>
                                        <p className="text-sm mt-1">Create a new event to get started</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <CreateEventDialog onCreateEvent={handleCreateEvent} />
            </div>
        </Card>
    )
}

export default UpcomingSchedule
