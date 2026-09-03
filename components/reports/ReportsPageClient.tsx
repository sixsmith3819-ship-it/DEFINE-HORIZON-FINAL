'use client';

import { DailyReportSection } from './DailyReportSection';
import { CsvExportSection } from './CsvExportSection';
import { MonthlyReportSection } from './MonthlyReportSection';

interface ReportsPageClientProps {
  role: 'admin' | 'manager' | 'employee';
  userId: string;
}

export function ReportsPageClient({ role }: ReportsPageClientProps) {
  const isPrivileged = role !== 'employee';

  return (
    <div className="space-y-6">
      {isPrivileged && <DailyReportSection />}
      <CsvExportSection />
      {isPrivileged && <MonthlyReportSection />}
    </div>
  );
}
