import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { ReportsPageClient } from '@/components/reports/ReportsPageClient';

export const metadata = {
  title: 'Reports — Define Horizon BMS',
};

export default async function ReportsPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const role = (profile.role as 'admin' | 'manager' | 'employee') ?? 'employee';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate and export financial reports for Define Horizon BMS.
        </p>
      </div>

      <ReportsPageClient role={role} userId={user.id} />
    </div>
  );
}
