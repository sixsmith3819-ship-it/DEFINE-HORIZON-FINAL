import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { DollarSign, TrendingUp, Users, Activity } from 'lucide-react';
import { getDashboardStats, getTransactionTrends } from '@/lib/actions/analytics';
import { TransactionTrendChart } from '@/components/dashboard/TransactionTrendChart';

export default async function EmployeeDashboard() {
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

  if (error || profile?.role !== 'employee') {
    redirect('/dashboard');
  }

  const statsResult = await getDashboardStats();
  const trendsResult = await getTransactionTrends(30);

  const stats = statsResult.success ? statsResult.data! : null;
  const trends = trendsResult.success ? trendsResult.data! : [];

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--dh-bg)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--dh-primary)' }}>Welcome back,</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{profile.full_name || 'Employee'}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--dh-text-2)' }}>Here&apos;s your performance overview for today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>My Transactions</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>{stats?.totalTransactions || 0}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>Total processed</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Revenue Generated</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>${stats?.totalRevenue.toFixed(2) || '0.00'}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>Total amount</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="dh-card stat-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--dh-text-3)' }}>Commission Earned</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--dh-text)' }}>${stats?.totalCommission.toFixed(2) || '0.00'}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--dh-text-3)' }}>Your earnings</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <TrendingUp className="w-6 h-6 text-white" />
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
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {trends.length > 0 && (
          <div className="dh-card p-6 mb-6">
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--dh-text)' }}>My Transaction Trends</p>
            <p className="text-xs mb-4" style={{ color: 'var(--dh-text-3)' }}>Last 30 days</p>
            <TransactionTrendChart data={trends} />
          </div>
        )}

        {(!stats || stats.totalTransactions === 0) && (
          <div className="dh-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--dh-text)' }}>Welcome to Define Horizon</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--dh-text-2)' }}>You can record transactions, manage customers, and track your performance here.</p>
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
