import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function eventsQueryOptions(eventTypeId: string | null) {
  return {
    queryKey: ['events', { eventTypeId }] as const,
    queryFn: async () => {
      let builder = supabase
        .from('events')
        .select('id, occurred_at, event_type_id, event_types ( label )')

      if (eventTypeId) {
        builder = builder.eq('event_type_id', eventTypeId)
      }

      const { data, error } = await builder
        .order('occurred_at', { ascending: false })
        .returns<EventWithType[]>()
      if (error) throw error
      return data
    },
  }
}

export function useEvents(eventTypeId: string | null) {
  return useQuery(eventsQueryOptions(eventTypeId))
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
