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
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {profile.full_name || 'Administrator'}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats?.totalRevenue.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats?.totalTransactions || 0} transactions</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Commission Earned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats?.totalCommission.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats ? ((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1) : 0}% of revenue
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCustomers || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Registered clients</p>
              </div>
              <Users className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalProducts || 0}</p>
                {(stats?.lowStockProducts || 0) > 0 && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {stats?.lowStockProducts} low stock
                  </p>
                )}
              </div>
              <Package className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Recent Activity (7 days)</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.recentTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Active Announcements</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeAnnouncements || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats && stats.totalTransactions > 0 
                    ? (stats.totalRevenue / stats.totalTransactions).toFixed(2) 
                    : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {trends.length > 0 && <TransactionTrendChart data={trends} />}
          {providerStats.length > 0 && <ServiceProviderChart data={providerStats} />}
        </div>

        {/* Monthly Stats */}
        {monthlyStats.length > 0 && (
          <div className="mb-8">
            <MonthlyStatsChart data={monthlyStats} />
          </div>
        )}

        {/* Empty State */}
        {!stats || stats.totalTransactions === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Start by adding customers and creating transactions to see analytics here.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Full system access granted</p>
              <p>✓ Manage all users and transactions</p>
              <p>✓ View comprehensive analytics</p>
              <p>✓ Configure system settings</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
