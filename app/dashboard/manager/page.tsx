import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react'
import { getDashboardStats, getTransactionTrends, getServiceProviderStats } from '@/lib/actions/analytics'
import { TransactionTrendChart } from '@/components/dashboard/TransactionTrendChart'
import { ServiceProviderChart } from '@/components/dashboard/ServiceProviderChart'

export default async function ManagerDashboard() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'manager') redirect('/dashboard')

  const statsResult = await getDashboardStats()
  const trendsResult = await getTransactionTrends(30)
  const providerStatsResult = await getServiceProviderStats()

  const stats = statsResult.success ? statsResult.data! : null
  const trends = trendsResult.success ? trendsResult.data! : []
  const providerStats = providerStatsResult.success ? providerStatsResult.data! : []

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--dh-bg)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--dh-primary)' }}>Good day,</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{profile.full_name || 'Manager'}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--dh-text-2)' }}>Monitor operations and team performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Total Revenue</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>${stats?.totalRevenue.toFixed(2) || '0.00'}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>{stats?.totalTransactions || 0} transactions</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Commission</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>${stats?.totalCommission.toFixed(2) || '0.00'}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>Earned</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Customers</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{stats?.totalCustomers || 0}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>Registered</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Recent Activity</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{stats?.recentTransactions || 0}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>Last 7 days</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {(trends.length > 0 || providerStats.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {trends.length > 0 && (
              <div className="dh-card p-6">
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--dh-text)' }}>Transaction Trends</p>
                <p className="text-xs mb-4" style={{ color: 'var(--dh-text-3)' }}>Last 30 days</p>
                <TransactionTrendChart data={trends} />
              </div>
            )}
            {providerStats.length > 0 && (
              <div className="dh-card p-6">
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--dh-text)' }}>By Service Provider</p>
                <p className="text-xs mb-4" style={{ color: 'var(--dh-text-3)' }}>Revenue distribution</p>
                <ServiceProviderChart data={providerStats} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
