'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyStatsChartProps {
  data: Array<{ month: string; transactions: number; revenue: number; commission: number }>;
}

export function MonthlyStatsChart({ data }: MonthlyStatsChartProps) {
  const formattedData = data.map(item => {
    const [year, month] = item.month.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
    return {
      month: monthName,
      transactions: item.transactions,
      revenue: item.revenue,
      commission: item.commission,
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Overview (Last 12 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" style={{ fontSize: '12px' }} />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="transactions" fill="#3b82f6" name="Transactions" />
          <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
          <Bar dataKey="commission" fill="#f59e0b" name="Commission ($)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
