import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'react-router'
import { z } from 'zod'
import { PencilIcon, Trash2Icon } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useFormatDate } from '@/lib/date-format'
import {
  EVENTS_PAGE_SIZE,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '@/lib/events'

const ALL_TYPES = 'all'

const eventSchema = z.object({
  type: z.string().trim().min(1, 'Required').max(100),
  occurred_at: z.string().min(1, 'Required'),
})
type EventValues = z.infer<typeof eventSchema>

/** Formats a date as a `datetime-local` input value in the user's timezone. */
function toLocalInputValue(d: Date) {
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
            eventTypes={eventTypes ?? []}
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
  eventTypes,
}: {
  id: string
  typeLabel: string
  occurredAt: string
  eventTypes: { id: string; label: string }[]
}) {
  const deleteEvent = useDeleteEvent()
  const formatDate = useFormatDate()
  const [editOpen, setEditOpen] = useState(false)

  return (
    <li>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={deleteEvent.isPending}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted data-popup-open:bg-muted disabled:opacity-50"
        >
          <span>{typeLabel}</span>
          <span className="text-muted-foreground">{formatDate(occurredAt)}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="py-2.5 sm:py-1.5" onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="py-2.5 sm:py-1.5"
            onClick={() => {
              if (confirm('Delete this event?')) {
                deleteEvent.mutate(id)
              }
            }}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
          </DialogHeader>
          <EditEventForm
            id={id}
            typeLabel={typeLabel}
            occurredAt={occurredAt}
            eventTypes={eventTypes}
            onDone={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
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

  return (
    <EventForm
      eventTypes={eventTypes}
      defaultValues={{ type: '', occurred_at: toLocalInputValue(new Date()) }}
      submitLabel="Log it"
      error={createEvent.error}
      onSubmit={async (values) => {
        await createEvent.mutateAsync(values)
        onDone()
      }}
    />
  )
}

function EditEventForm({
  id,
  typeLabel,
  occurredAt,
  eventTypes,
  onDone,
}: {
  id: string
  typeLabel: string
  occurredAt: string
  eventTypes: { id: string; label: string }[]
  onDone: () => void
}) {
  const updateEvent = useUpdateEvent()

  return (
    <EventForm
      eventTypes={eventTypes}
      defaultValues={{
        type: typeLabel,
        occurred_at: toLocalInputValue(new Date(occurredAt)),
      }}
      submitLabel="Save"
      error={updateEvent.error}
      onSubmit={async (values) => {
        await updateEvent.mutateAsync({ id, ...values })
        onDone()
      }}
    />
  )
}

function EventForm({
  eventTypes,
  defaultValues,
  submitLabel,
  error,
  onSubmit,
}: {
  eventTypes: { id: string; label: string }[]
  defaultValues: EventValues
  submitLabel: string
  error: Error | null
  onSubmit: (values: { type: string; occurred_at: string }) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  })
  const typeLabels = eventTypes.map((eventType) => eventType.label)

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={handleSubmit((values) =>
        onSubmit({
          type: values.type,
          occurred_at: new Date(values.occurred_at).toISOString(),
        }),
      )}
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
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
