import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export default async function Home() {
  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // If not authenticated, redirect to login
  redirect('/login')
}
