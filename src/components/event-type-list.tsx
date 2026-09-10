import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useCreateEventType,
  useEventTypes,
  useRenameEventType,
} from '@/lib/event-types'

const labelSchema = z.object({
  label: z.string().trim().min(1, 'Required').max(100),
})
type LabelValues = z.infer<typeof labelSchema>

export function EventTypeList() {
  const { data: eventTypes, isPending, error } = useEventTypes()

  return (
    <section className="flex w-full flex-col gap-3">
      {isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {eventTypes?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No event types yet — add one below.
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {eventTypes?.map((eventType) => (
          <EventTypeRow key={eventType.id} id={eventType.id} label={eventType.label} />
        ))}
      </ul>
      <AddEventTypeForm />
    </section>
  )
}

function EventTypeRow({ id, label }: { id: string; label: string }) {
  const [editing, setEditing] = useState(false)
  const renameEventType = useRenameEventType()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LabelValues>({
    resolver: zodResolver(labelSchema),
    defaultValues: { label },
  })

  if (editing) {
    return (
      <li>
        <form
          className="flex items-start gap-2"
          onSubmit={handleSubmit(async (values) => {
            await renameEventType.mutateAsync({ id, label: values.label })
            setEditing(false)
          })}
        >
          <div className="flex-1">
            <Input autoFocus {...register('label')} />
            {errors.label && (
              <p className="text-sm text-destructive">{errors.label.message}</p>
            )}
            {renameEventType.error && (
              <p className="text-sm text-destructive">
                {renameEventType.error.message}
              </p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              reset({ label })
              setEditing(false)
            }}
          >
            Cancel
          </Button>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
      <span>{label}</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          reset({ label })
          setEditing(true)
        }}
      >
        Rename
      </Button>
    </li>
  )
}

function AddEventTypeForm() {
  const createEventType = useCreateEventType()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LabelValues>({
    resolver: zodResolver(labelSchema),
    defaultValues: { label: '' },
  })

  return (
    <form
      className="flex items-start gap-2"
      onSubmit={handleSubmit(async (values) => {
        await createEventType.mutateAsync(values.label)
        reset()
      })}
    >
      <div className="flex-1">
        <Input placeholder="New event type" {...register('label')} />
        {errors.label && (
          <p className="text-sm text-destructive">{errors.label.message}</p>
        )}
        {createEventType.error && (
          <p className="text-sm text-destructive">{createEventType.error.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Add
      </Button>
    </form>
  )
}
