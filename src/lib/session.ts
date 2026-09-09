import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

export const sessionQueryOptions = {
  queryKey: ['session'] as const,
  queryFn: async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },
  staleTime: Infinity,
}

/**
 * Keeps the `['session']` query cache in sync with Supabase auth events
 * (sign in, sign out, token refresh). Mount once, near the app root.
 */
export function useAuthListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(sessionQueryOptions.queryKey, session)
    })
    return () => subscription.unsubscribe()
  }, [queryClient])
}
