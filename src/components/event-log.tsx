import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEventTypes } from '@/lib/event-types'
import { useCreateEvent, useEvents } from '@/lib/events'

const ALL_TYPES = 'all'

const eventSchema = z.object({
  type: z.string().trim().min(1, 'Required').max(100),
  occurred_at: z.string().min(1, 'Required'),
})
type EventValues = z.infer<typeof eventSchema>

function nowLocalInputValue() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export function EventLog() {
  const { data: eventTypes } = useEventTypes()
  const [filter, setFilter] = useState<string>(ALL_TYPES)
  const [dialogOpen, setDialogOpen] = useState(false)
  const {
    data: events,
    isPending,
    error,
  } = useEvents(filter === ALL_TYPES ? null : filter)

  const hasTypes = (eventTypes?.length ?? 0) > 0
  const filterItems: Record<string, string> = {
    [ALL_TYPES]: 'All types',
    ...Object.fromEntries((eventTypes ?? []).map((t) => [t.id, t.label])),
  }

  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        {hasTypes ? (
          <Select
            items={filterItems}
            value={filter}
            onValueChange={(value) => setFilter(value ?? ALL_TYPES)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>All types</SelectItem>
              {eventTypes!.map((eventType) => (
                <SelectItem key={eventType.id} value={eventType.id}>
                  {eventType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span />
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button>Add event</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add event</DialogTitle>
            </DialogHeader>
            <AddEventForm
              eventTypes={eventTypes ?? []}
              onDone={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {events?.length === 0 && (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      )}
      <ul className="flex flex-col gap-1.5">
        {events?.map((event) => (
          <li
            key={event.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <span>{event.event_types?.label ?? 'Unknown type'}</span>
            <span className="text-muted-foreground">
              {new Date(event.occurred_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AddEventForm({
  eventTypes,
  onDone,
}: {
  eventTypes: { id: string; label: string }[]
  onDone: () => void
}) {
  const listId = useId()
  const createEvent = useCreateEvent()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: '', occurred_at: nowLocalInputValue() },
  })

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={handleSubmit(async (values) => {
        await createEvent.mutateAsync({
          type: values.type,
          occurred_at: new Date(values.occurred_at).toISOString(),
        })
        onDone()
      })}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-type">Type</Label>
        <Input
          id="event-type"
          list={listId}
          autoComplete="off"
          placeholder="Pick one or type a new one"
          {...register('type')}
        />
        <datalist id={listId}>
          {eventTypes.map((eventType) => (
            <option key={eventType.id} value={eventType.label} />
          ))}
        </datalist>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="occurred_at">When</Label>
        <Input id="occurred_at" type="datetime-local" {...register('occurred_at')} />
        {errors.occurred_at && (
          <p className="text-sm text-destructive">{errors.occurred_at.message}</p>
        )}
      </div>
      {createEvent.error && (
        <p className="text-sm text-destructive">{createEvent.error.message}</p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        Log it
      </Button>
    </form>
  )
}
