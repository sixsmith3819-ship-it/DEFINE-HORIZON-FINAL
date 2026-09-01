'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ServiceProviderChartProps {
  data: Array<{ provider: string; count: number; revenue: number }>;
}

export function ServiceProviderChart({ data }: ServiceProviderChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Service Provider Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="provider" style={{ fontSize: '12px' }} />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" name="Transactions" />
          <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
