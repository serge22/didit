import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router'
import { sessionQueryOptions } from '@/lib/session'

/** Redirects to /login unless there's a signed-in session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useQuery(sessionQueryOptions)

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
