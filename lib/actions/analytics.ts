'use server';

import { createServerClient } from '@/lib/supabase-server';

export interface DashboardStats {
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
  totalCommission: number;
  totalProducts: number;
  lowStockProducts: number;
  activeAnnouncements: number;
  recentTransactions: number;
}

export interface TransactionTrend {
  date: string;
  count: number;
  revenue: number;
  commission: number;
}

export interface ServiceProviderStats {
  provider: string;
  count: number;
  revenue: number;
}

export interface MonthlyStats {
  month: string;
  transactions: number;
  revenue: number;
  commission: number;
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    // Get customer count
    const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });

    // Get transaction stats
    let transactionQuery = supabase.from('transactions').select('amount, commission, created_at');
    if (!isAdmin) {
      transactionQuery = transactionQuery.eq('created_by', user.id);
    }
    const { data: transactions } = await transactionQuery;

    const totalTransactions = transactions?.length || 0;
    const totalRevenue = transactions?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
    const totalCommission = transactions?.reduce((sum, t) => sum + (parseFloat(t.commission) || 0), 0) || 0;

    // Recent transactions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTransactions = transactions?.filter(t => new Date(t.created_at) >= sevenDaysAgo).length || 0;

    // Get product stats
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('quantity', 10).gt('quantity', 0);

    // Get active announcements
    const { count: announcementCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'published');

    return {
      success: true,
      data: {
        totalCustomers: customerCount || 0,
        totalTransactions,
        totalRevenue,
        totalCommission,
        totalProducts: productCount || 0,
        lowStockProducts: lowStockCount || 0,
        activeAnnouncements: announcementCount || 0,
        recentTransactions,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTransactionTrends(days: number = 30): Promise<{ success: boolean; data?: TransactionTrend[]; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase.from('transactions').select('amount, commission, created_at').gte('created_at', startDate.toISOString());
    if (!isAdmin) {
      query = query.eq('created_by', user.id);
    }

    const { data: transactions } = await query;

    // Group by date
    const trendMap = new Map<string, { count: number; revenue: number; commission: number }>();
    
    transactions?.forEach(t => {
      const date = new Date(t.created_at).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { count: 0, revenue: 0, commission: 0 };
      trendMap.set(date, {
        count: existing.count + 1,
        revenue: existing.revenue + parseFloat(t.amount),
        commission: existing.commission + parseFloat(t.commission),
      });
    });

    const trends = Array.from(trendMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: trends };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getServiceProviderStats(): Promise<{ success: boolean; data?: ServiceProviderStats[]; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    let query = supabase.from('transactions').select('service_provider, amount');
    if (!isAdmin) {
      query = query.eq('created_by', user.id);
    }

    const { data: transactions } = await query;

    // Group by service provider
    const providerMap = new Map<string, { count: number; revenue: number }>();
    
    transactions?.forEach(t => {
      const provider = t.service_provider || 'Unknown';
      const existing = providerMap.get(provider) || { count: 0, revenue: 0 };
      providerMap.set(provider, {
        count: existing.count + 1,
        revenue: existing.revenue + parseFloat(t.amount),
      });
    });

    const stats = Array.from(providerMap.entries())
      .map(([provider, data]) => ({ provider, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return { success: true, data: stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMonthlyStats(): Promise<{ success: boolean; data?: MonthlyStats[]; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    // Get last 12 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    let query = supabase.from('transactions').select('amount, commission, created_at').gte('created_at', startDate.toISOString());
    if (!isAdmin) {
      query = query.eq('created_by', user.id);
    }

    const { data: transactions } = await query;

    // Group by month
    const monthMap = new Map<string, { transactions: number; revenue: number; commission: number }>();
    
    transactions?.forEach(t => {
      const date = new Date(t.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(month) || { transactions: 0, revenue: 0, commission: 0 };
      monthMap.set(month, {
        transactions: existing.transactions + 1,
        revenue: existing.revenue + parseFloat(t.amount),
        commission: existing.commission + parseFloat(t.commission),
      });
    });

    const stats = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { success: true, data: stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
