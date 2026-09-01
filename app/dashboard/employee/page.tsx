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
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {profile.full_name || 'Employee'}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">My Transactions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalTransactions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Total processed</p>
              </div>
              <Activity className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats?.totalRevenue.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Generated</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Commission</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats?.totalCommission.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Earned</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Recent Activity</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.recentTransactions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </div>
              <Users className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Transaction Trends */}
        {trends.length > 0 ? (
          <div className="mb-8">
            <TransactionTrendChart data={trends} />
          </div>
        ) : null}

        {/* Welcome Card */}
        {!stats || stats.totalTransactions === 0 ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Define Horizon</h2>
            <p className="text-gray-600 mb-6">
              You can record transactions, manage customers, and track your performance metrics.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Record customer transactions</p>
              <p>✓ Register new customers</p>
              <p>✓ View your transaction history</p>
              <p>✓ View company announcements</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
