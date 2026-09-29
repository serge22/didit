import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { sessionQueryOptions } from './session'
import { eventTypesQueryOptions } from './event-types'

export type EventWithType = {
  id: string
  occurred_at: string
  event_type_id: string
  event_types: { label: string } | null
}

export const EVENTS_PAGE_SIZE = 10

export function eventsQueryOptions(eventTypeId: string | null, page: number) {
  return {
    queryKey: ['events', { eventTypeId, page }] as const,
    queryFn: async () => {
      let builder = supabase
        .from('events')
        .select('id, occurred_at, event_type_id, event_types ( label )', {
          count: 'exact',
        })

      if (eventTypeId) {
        builder = builder.eq('event_type_id', eventTypeId)
      }

      const from = page * EVENTS_PAGE_SIZE
      const { data, error, count } = await builder
        .order('occurred_at', { ascending: false })
        .range(from, from + EVENTS_PAGE_SIZE - 1)
        .returns<EventWithType[]>()
      if (error) throw error
      return { events: data, count: count ?? 0 }
    },
    placeholderData: keepPreviousData,
  }
}

export function useEvents(eventTypeId: string | null, page: number) {
  return useQuery(eventsQueryOptions(eventTypeId, page))
}

/**
 * Creates an event. `type` is a label the user typed or picked from the
 * dropdown; if no event type with that label exists yet, it's created first.
 */
export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      type,
      occurred_at,
    }: {
      type: string
      occurred_at: string
    }) => {
      const session = queryClient.getQueryData<Session | null>(
        sessionQueryOptions.queryKey,
      )
      if (!session) throw new Error('Not signed in')
      const userId = session.user.id

      const label = type.trim()
      if (!label) throw new Error('Event type is required')

      const cachedTypes = queryClient.getQueryData<
        { id: string; label: string }[]
      >(eventTypesQueryOptions.queryKey)
      const existing = cachedTypes?.find(
        (t) => t.label.toLowerCase() === label.toLowerCase(),
      )

      let eventTypeId = existing?.id
      if (!eventTypeId) {
        const inserted = await supabase
          .from('event_types')
          .insert({ label, user_id: userId })
          .select('id')
          .single()

        if (inserted.error?.code === '23505') {
          // Created concurrently, or a case-only duplicate — reuse it.
          const found = await supabase
            .from('event_types')
            .select('id')
            .eq('label', label)
            .single()
          if (found.error) throw found.error
          eventTypeId = found.data.id
        } else if (inserted.error) {
          throw inserted.error
        } else {
          eventTypeId = inserted.data.id
        }
      }

      const { data, error } = await supabase
        .from('events')
        .insert({ event_type_id: eventTypeId, user_id: userId, occurred_at })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: eventTypesQueryOptions.queryKey })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
