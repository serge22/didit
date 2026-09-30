import { AppHeader } from '@/components/app-header'
import { EventLog } from '@/components/event-log'

export function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 p-6">
      <AppHeader title="Didit" />
      <EventLog />
    </main>
  )
}
