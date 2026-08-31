import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

export default async function EmployeeDashboard() {
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

  if (error || profile?.role !== 'employee') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Employee Dashboard</h1>
          <p className="text-gray-600 mb-8">Manage customer transactions and operations</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
              <p className="text-gray-600 text-sm font-medium">My Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
              <p className="text-gray-600 text-sm font-medium">Today's Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
              <p className="text-gray-600 text-sm font-medium">Customers Served</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
              <p className="text-gray-600 text-sm font-medium">Commission Earned</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Employee</h2>
            <p className="text-gray-600 mb-6">
              You can record transactions, manage customers, and view your performance metrics.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Record customer transactions</p>
              <p>✓ Register new customers</p>
              <p>✓ View your transaction history</p>
              <p>✓ View announcements</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
