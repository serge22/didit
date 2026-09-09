import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { sessionQueryOptions } from './session'

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

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { event_type_id: string; occurred_at: string }) => {
      const session = queryClient.getQueryData<Session | null>(
        sessionQueryOptions.queryKey,
      )
      if (!session) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('events')
        .insert({ ...input, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
