import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { DollarSign, Users, Package, TrendingUp, AlertCircle, Bell, Activity } from 'lucide-react';
import { getDashboardStats, getTransactionTrends, getServiceProviderStats, getMonthlyStats } from '@/lib/actions/analytics';
import { TransactionTrendChart } from '@/components/dashboard/TransactionTrendChart';
import { ServiceProviderChart } from '@/components/dashboard/ServiceProviderChart';
import { MonthlyStatsChart } from '@/components/dashboard/MonthlyStatsChart';

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const statsResult = await getDashboardStats();
  const trendsResult = await getTransactionTrends(30);
  const providerStatsResult = await getServiceProviderStats();
  const monthlyStatsResult = await getMonthlyStats();

  const stats = statsResult.success ? statsResult.data! : null;
  const trends = trendsResult.success ? trendsResult.data! : [];
  const providerStats = providerStatsResult.success ? providerStatsResult.data! : [];
  const monthlyStats = monthlyStatsResult.success ? monthlyStatsResult.data! : [];

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--dh-bg)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--dh-primary)' }}>Good day,</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{profile.full_name || 'Administrator'}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--dh-text-2)' }}>Here&apos;s what&apos;s happening with Define Horizon today.</p>
        </div>

        {/* Primary stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Revenue */}
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

          {/* Commission */}
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Commission Earned</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>${stats?.totalCommission.toFixed(2) || '0.00'}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>
                  {stats && stats.totalRevenue > 0 ? ((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1) : 0}% of revenue
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Customers */}
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Total Customers</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{stats?.totalCustomers || 0}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>Registered clients</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Products</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{stats?.totalProducts || 0}</p>
                {(stats?.lowStockProducts || 0) > 0 ? (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#f59e0b' }}>
                    <AlertCircle className="w-3 h-3" />{stats?.lowStockProducts} low stock
                  </p>
                ) : (
                  <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>In inventory</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary stat row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="dh-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Activity className="w-5 h-5" style={{ color: 'var(--dh-primary)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--dh-text-3)' }}>Recent Activity</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--dh-text)' }}>{stats?.recentTransactions || 0}</p>
              <p className="text-xs" style={{ color: 'var(--dh-text-3)' }}>Last 7 days</p>
            </div>
          </div>
          <div className="dh-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Bell className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--dh-text-3)' }}>Announcements</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--dh-text)' }}>{stats?.activeAnnouncements || 0}</p>
              <p className="text-xs" style={{ color: 'var(--dh-text-3)' }}>Active</p>
            </div>
          </div>
          <div className="dh-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <DollarSign className="w-5 h-5" style={{ color: '#10b981' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--dh-text-3)' }}>Avg Transaction</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--dh-text)' }}>
                ${stats && stats.totalTransactions > 0 ? (stats.totalRevenue / stats.totalTransactions).toFixed(2) : '0.00'}
              </p>
              <p className="text-xs" style={{ color: 'var(--dh-text-3)' }}>Per transaction</p>
            </div>
          </div>
        </div>

        {/* Charts */}
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

        {monthlyStats.length > 0 && (
          <div className="dh-card p-6 mb-6">
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--dh-text)' }}>Monthly Performance</p>
            <p className="text-xs mb-4" style={{ color: 'var(--dh-text-3)' }}>Last 12 months</p>
            <MonthlyStatsChart data={monthlyStats} />
          </div>
        )}

        {/* Empty state */}
        {(!stats || stats.totalTransactions === 0) && (
          <div className="dh-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--dh-text)' }}>No Activity Yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--dh-text-2)' }}>Start by adding customers and recording transactions to see analytics here.</p>
            <div className="flex justify-center gap-3">
              <a href="/customers/new" className="dh-btn-primary">Add Customer</a>
              <a href="/transactions/new" className="dh-btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>New Transaction</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
