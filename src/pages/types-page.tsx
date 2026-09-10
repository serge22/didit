import { Link } from 'react-router'
import { EventTypeList } from '@/components/event-type-list'

export function TypesPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Event types</h1>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
      </div>
      <EventTypeList />
    </main>
  )
}
