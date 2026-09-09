import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  event_type_id: z.string().min(1, 'Select a type'),
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
  const {
    data: events,
    isPending,
    error,
  } = useEvents(filter === ALL_TYPES ? null : filter)

  const hasTypes = (eventTypes?.length ?? 0) > 0

  return (
    <section className="flex w-full flex-col gap-3">
      <h2 className="text-left text-sm font-medium text-muted-foreground">Events</h2>

      {hasTypes ? (
        <AddEventForm eventTypes={eventTypes!} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Add an event type above, then log your first event here.
        </p>
      )}

      {hasTypes && (
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value ?? ALL_TYPES)}
        >
          <SelectTrigger className="w-full">
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
      )}

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
}: {
  eventTypes: { id: string; label: string }[]
}) {
  const createEvent = useCreateEvent()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { event_type_id: '', occurred_at: nowLocalInputValue() },
  })

  return (
    <form
      className="flex flex-col gap-3 rounded-md border border-border p-3"
      onSubmit={handleSubmit(async (values) => {
        await createEvent.mutateAsync({
          event_type_id: values.event_type_id,
          occurred_at: new Date(values.occurred_at).toISOString(),
        })
        reset({
          event_type_id: values.event_type_id,
          occurred_at: nowLocalInputValue(),
        })
      })}
    >
      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Controller
          control={control}
          name="event_type_id"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value ?? '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((eventType) => (
                  <SelectItem key={eventType.id} value={eventType.id}>
                    {eventType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.event_type_id && (
          <p className="text-sm text-destructive">{errors.event_type_id.message}</p>
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
