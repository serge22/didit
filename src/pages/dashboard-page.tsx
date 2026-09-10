import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { EventLog } from '@/components/event-log'
import { supabase } from '@/lib/supabase'
import { sessionQueryOptions } from '@/lib/session'

export function DashboardPage() {
  const { data: session } = useQuery(sessionQueryOptions)

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Didit</h1>
          <p className="text-sm text-muted-foreground">{session?.user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/types" className={buttonVariants({ variant: 'ghost' })}>
            Manage types
          </Link>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </div>
      <EventLog />
    </main>
  )
}
