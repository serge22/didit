import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router'
import { ListIcon, LogOutIcon, MenuIcon, TagsIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { sessionQueryOptions } from '@/lib/session'

const navItems = [
  { to: '/', label: 'Events', icon: ListIcon },
  { to: '/types', label: 'Manage types', icon: TagsIcon },
  { to: '/account', label: 'Account', icon: UserIcon },
]

// Larger touch targets on mobile, compact from `sm` up; bold marks the current page.
const itemClassName = 'py-2.5 sm:py-1.5 aria-[current=page]:font-medium'

export function AppHeader({ title }: { title: string }) {
  const { data: session } = useQuery(sessionQueryOptions)
  const { pathname } = useLocation()

  return (
    <header className="flex items-center justify-between gap-2">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-lg" aria-label="Open menu">
              <MenuIcon className="size-5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">
              {session?.user.email}
            </DropdownMenuLabel>
            {navItems.map(({ to, label, icon: Icon }) => (
              <DropdownMenuItem
                key={to}
                className={itemClassName}
                render={<Link to={to} />}
                aria-current={pathname === to ? 'page' : undefined}
              >
                <Icon />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className={itemClassName}
            onClick={() => supabase.auth.signOut()}
          >
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
