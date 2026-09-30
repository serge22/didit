import { AppHeader } from '@/components/app-header'
import { EventTypeList } from '@/components/event-type-list'

export function TypesPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 p-6">
      <AppHeader title="Event types" />
      <EventTypeList />
    </main>
  )
}
