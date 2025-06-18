export type CalendarEventParam = {
    id: string
    title: string
    start: string
    eventColor: string
    end?: string
    groupId?: string
}

export type CalendarEvent = {
    id: string
    title: string
    start: string
    end?: string
    eventColor: string
    groupId?: string
}

export type SelectedCell = {
    type: string
} & Partial<CalendarEvent>

export type CalendarEvents = CalendarEvent[]
