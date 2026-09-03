'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ReportStatusBannerProps {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

export function ReportStatusBanner({
  type,
  message,
  onDismiss,
}: ReportStatusBannerProps) {
  // Auto-dismiss after 5 seconds for success notifications
  useEffect(() => {
    if (type !== 'success') return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [type, onDismiss]);

  const styles =
    type === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : 'bg-red-50 text-red-800 border-red-200';

  const dismissStyles =
    type === 'success'
      ? 'text-green-500 hover:text-green-700 hover:bg-green-100'
      : 'text-red-500 hover:text-red-700 hover:bg-red-100';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${styles}`}
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={`shrink-0 rounded p-0.5 transition-colors ${dismissStyles}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
