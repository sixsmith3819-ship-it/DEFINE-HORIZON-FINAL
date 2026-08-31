import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export default async function Dashboard() {
  // Get authenticated user from session
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login (middleware should catch this, but extra safety)
  if (!user) {
    redirect('/login')
  }

  // Fetch user's profile to get their role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If profile not found, redirect to login (data inconsistency)
  if (error || !profile) {
    console.error('Profile lookup error:', error)
    redirect('/login')
  }

  // Map roles to their designated dashboards
  const roleRoutes: Record<string, string> = {
    admin: '/dashboard/admin',
    manager: '/dashboard/manager',
    employee: '/dashboard/employee',
  }

  // Get the target route for this user's role
  const targetRoute = roleRoutes[profile.role]

  // If we have a valid route, silently redirect (no page render)
  if (targetRoute) {
    redirect(targetRoute)
  }

  // Fallback if role doesn't match any known role (shouldn't happen)
  console.error(`Unknown role: ${profile.role}`)
  redirect('/login')
}
