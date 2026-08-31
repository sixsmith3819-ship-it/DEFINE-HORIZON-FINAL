import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createServerClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user has admin role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin') {
    // User doesn't have admin role - redirect to their correct dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">Full system access and administrative controls</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm font-medium">Active Sessions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <p className="text-gray-600 text-sm font-medium">System Health</p>
            <p className="text-3xl font-bold text-green-600 mt-2">✓ Good</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <p className="text-gray-600 text-sm font-medium">Transactions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Administrator</h2>
          <p className="text-gray-600 mb-6">
            You have full access to the Horizon Business Management System. Use the navigation to manage users, transactions, stock, and view analytics.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Manage employees</p>
            <p>✓ View all transactions</p>
            <p>✓ Manage stock inventory</p>
            <p>✓ View system analytics</p>
            <p>✓ Configure settings</p>
          </div>
        </div>
      </div>
    </div>
  )
}
