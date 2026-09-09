import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router'
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

const authSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type AuthValues = z.infer<typeof authSchema>

export function LoginPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [notice, setNotice] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  })

  if (session) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values: AuthValues) {
    setNotice(null)

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword(values)
      if (error) {
        setError('root', { message: error.message })
      }
      return
    }

    const { data, error } = await supabase.auth.signUp(values)
    if (error) {
      setError('root', { message: error.message })
      return
    }
    if (!data.session) {
      setNotice('Check your email to confirm your account before signing in.')
      return
    }
    queryClient.setQueryData(sessionQueryOptions.queryKey, data.session)
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</CardTitle>
          <CardDescription>
            {mode === 'sign-in'
              ? "Welcome back — track what you've been up to."
              : 'Start your own private event log.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setNotice(null)
              setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'))
            }}
          >
            {mode === 'sign-in'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </CardContent>
      </Card>
    </main>
  )
}
