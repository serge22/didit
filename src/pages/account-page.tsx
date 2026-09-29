import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { sessionQueryOptions } from '@/lib/session'

export function AccountPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Account</h1>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
      </div>
      <EmailForm />
      <PasswordForm />
    </main>
  )
}

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type EmailValues = z.infer<typeof emailSchema>

function EmailForm() {
  const { data: session } = useQuery(sessionQueryOptions)
  const [notice, setNotice] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: session?.user.email ?? '' },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>
          You'll need to confirm the change from a link sent to your new address before
          it takes effect.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit(async (values) => {
            setNotice(null)
            const { error } = await supabase.auth.updateUser({ email: values.email })
            if (error) {
              setError('root', { message: error.message })
              return
            }
            setNotice('Check your new email address for a confirmation link.')
          })}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
          <Button type="submit" disabled={isSubmitting}>
            Update email
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type PasswordValues = z.infer<typeof passwordSchema>

function PasswordForm() {
  const { data: session } = useQuery(sessionQueryOptions)
  const [notice, setNotice] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit(async (values) => {
            setNotice(null)
            const email = session?.user.email
            if (!email) {
              setError('root', { message: 'Not signed in' })
              return
            }

            const { error: reauthError } = await supabase.auth.signInWithPassword({
              email,
              password: values.currentPassword,
            })
            if (reauthError) {
              setError('currentPassword', { message: 'Current password is incorrect' })
              return
            }

            const { error } = await supabase.auth.updateUser({
              password: values.password,
            })
            if (error) {
              setError('root', { message: error.message })
              return
            }
            reset()
            setNotice('Password updated.')
          })}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
          <Button type="submit" disabled={isSubmitting}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
