import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ManagerDashboard() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'manager') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
        <p className="text-gray-600 mb-8">Manage operations and view team performance</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm font-medium">Team Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm font-medium">Today's Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <p className="text-gray-600 text-sm font-medium">Transactions (Today)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <p className="text-gray-600 text-sm font-medium">Pending Tasks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Manager Access</h2>
          <p className="text-gray-600 mb-6">
            Monitor team performance, manage transactions, and oversee daily operations.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ View team transactions</p>
            <p>✓ Monitor performance metrics</p>
            <p>✓ Manage daily operations</p>
            <p>✓ View reports</p>
          </div>
        </div>
      </div>
    </div>
  )
}
