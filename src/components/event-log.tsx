import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'react-router'
import { z } from 'zod'
import { Trash2Icon } from 'lucide-react'
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
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from '@/components/ui/autocomplete'
import { useEventTypes } from '@/lib/event-types'
import { EVENTS_PAGE_SIZE, useCreateEvent, useDeleteEvent, useEvents } from '@/lib/events'

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
  // The type filter lives in the URL (`/?type=<id>`) so the types page can link to it.
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('type') ?? ALL_TYPES
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const {
    data,
    isPending,
    error,
  } = useEvents(filter === ALL_TYPES ? null : filter, page)

  const events = data?.events
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / EVENTS_PAGE_SIZE))

  if (page > 0 && page >= totalPages) {
    setPage(totalPages - 1)
  }

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
            onValueChange={(value) => {
              setSearchParams(
                !value || value === ALL_TYPES ? {} : { type: value },
              )
              setPage(0)
            }}
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
              onDone={() => {
                setDialogOpen(false)
                setPage(0)
              }}
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
          <EventRow
            key={event.id}
            id={event.id}
            typeLabel={event.event_types?.label ?? 'Unknown type'}
            occurredAt={event.occurred_at}
          />
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  )
}

function EventRow({
  id,
  typeLabel,
  occurredAt,
}: {
  id: string
  typeLabel: string
  occurredAt: string
}) {
  const deleteEvent = useDeleteEvent()

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <span>{typeLabel}</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          {new Date(occurredAt).toLocaleString()}
        </span>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Delete event"
          disabled={deleteEvent.isPending}
          onClick={() => {
            if (confirm('Delete this event?')) {
              deleteEvent.mutate(id)
            }
          }}
        >
          <Trash2Icon />
        </Button>
      </div>
    </li>
  )
}

function AddEventForm({
  eventTypes,
  onDone,
}: {
  eventTypes: { id: string; label: string }[]
  onDone: () => void
}) {
  const createEvent = useCreateEvent()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: '', occurred_at: nowLocalInputValue() },
  })
  const typeLabels = eventTypes.map((eventType) => eventType.label)

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
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Autocomplete
              items={typeLabels}
              value={field.value}
              onValueChange={field.onChange}
            >
              <AutocompleteInput
                id="event-type"
                placeholder="Pick one or type a new one"
                onBlur={field.onBlur}
              />
              <AutocompleteContent>
                <AutocompleteEmpty>Press Enter to add a new type</AutocompleteEmpty>
                <AutocompleteList>
                  {(label: string) => (
                    <AutocompleteItem key={label} value={label}>
                      {label}
                    </AutocompleteItem>
                  )}
                </AutocompleteList>
              </AutocompleteContent>
            </Autocomplete>
          )}
        />
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
