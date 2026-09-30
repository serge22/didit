import { useQuery } from '@tanstack/react-query'
import { sessionQueryOptions } from './session'

// Each user's choice is stored in their Supabase auth `user_metadata.date_format`,
// so it follows them across devices without needing a table of its own.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n: number) => String(n).padStart(2, '0')

// Year is only shown when it isn't the current one, to keep recent entries short.
function yearSuffix(d: Date, separator: string) {
  return d.getFullYear() === new Date().getFullYear() ? '' : `${separator}${d.getFullYear()}`
}

export const DATE_FORMATS = {
  auto: {
    label: 'Browser default',
    format: (d: Date) => d.toLocaleString(),
  },
  'day-month': {
    label: 'Day month',
    format: (d: Date) =>
      `${d.getDate()} ${MONTHS[d.getMonth()]}${yearSuffix(d, ' ')}, ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  },
  'month-day': {
    label: 'Month day',
    format: (d: Date) =>
      new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        ...(yearSuffix(d, '') && { year: 'numeric' }),
      }).format(d),
  },
  iso: {
    label: 'ISO',
    format: (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  },
} satisfies Record<string, { label: string; format: (d: Date) => string }>

export type DateFormat = keyof typeof DATE_FORMATS

export function isDateFormat(value: unknown): value is DateFormat {
  return typeof value === 'string' && value in DATE_FORMATS
}

export function useDateFormat(): DateFormat {
  const { data: session } = useQuery(sessionQueryOptions)
  const stored = session?.user.user_metadata.date_format
  return isDateFormat(stored) ? stored : 'auto'
}

/** Returns a formatter for timestamps that follows the signed-in user's preference. */
export function useFormatDate() {
  const dateFormat = useDateFormat()
  return (iso: string) => DATE_FORMATS[dateFormat].format(new Date(iso))
}
