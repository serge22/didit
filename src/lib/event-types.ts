import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { sessionQueryOptions } from './session'

export const eventTypesQueryOptions = {
  queryKey: ['event_types'] as const,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .order('label')
    if (error) throw error
    return data
  },
}

export function useEventTypes() {
  return useQuery(eventTypesQueryOptions)
}

export function useCreateEventType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (label: string) => {
      const session = queryClient.getQueryData<Session | null>(
        sessionQueryOptions.queryKey,
      )
      if (!session) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('event_types')
        .insert({ label, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventTypesQueryOptions.queryKey })
    },
  })
}

export function useRenameEventType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { data, error } = await supabase
        .from('event_types')
        .update({ label })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventTypesQueryOptions.queryKey })
    },
  })
}
