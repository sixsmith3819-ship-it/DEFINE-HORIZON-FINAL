'use client';

import { AuditLogEntry, OperationType } from '@/lib/types/customer';
import { useState } from 'react';

interface AuditTrailProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
}

// Define operation type colors
// Color scheme: green=create, blue=update, red=delete, yellow=assign, orange=reactivate
const operationColors: Record<OperationType, { badge: string; dot: string }> = {
  [OperationType.Create]: {
    badge: 'bg-green-100 text-green-800 border border-green-300',
    dot: 'bg-green-500',
  },
  [OperationType.Update]: {
    badge: 'bg-blue-100 text-blue-800 border border-blue-300',
    dot: 'bg-blue-500',
  },
  [OperationType.Delete]: {
    badge: 'bg-red-100 text-red-800 border border-red-300',
    dot: 'bg-red-500',
  },
  [OperationType.Assign]: {
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    dot: 'bg-yellow-500',
  },
  [OperationType.Reactivate]: {
    badge: 'bg-orange-100 text-orange-800 border border-orange-300',
    dot: 'bg-orange-500',
  },
};

// Format date in human-readable format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

// Get operation message based on operation type and details
function getOperationMessage(entry: AuditLogEntry): string {
  switch (entry.operationType) {
    case OperationType.Create:
      return 'Customer created';
    case OperationType.Delete:
      return 'Customer deleted (soft delete)';
    case OperationType.Reactivate:
      return 'Customer reactivated';
    case OperationType.Assign:
      if (entry.previousValue && entry.newValue) {
        return `Assigned to ${entry.newValue} (was ${entry.previousValue})`;
      }
      return `Assigned to ${entry.newValue || 'unassigned'}`;
    case OperationType.Update:
      if (entry.fieldName && entry.previousValue !== undefined && entry.newValue !== undefined) {
        return `${entry.fieldName}: ${entry.previousValue} → ${entry.newValue}`;
      }
      return `Updated ${entry.fieldName || 'field'}`;
    default:
      return 'Operation recorded';
  }
}

// Truncate long text and show tooltip
function TruncatedText({ text, maxLength = 50 }: { text: string; maxLength?: number }) {
  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }
  return (
    <span title={text} className="cursor-help">
      {text.substring(0, maxLength)}...
    </span>
  );
}

// Expandable details section
function DetailsSection({ details }: { details: Record<string, any> }) {
  const [expanded, setExpanded] = useState(false);

  if (!details || Object.keys(details).length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-2 py-1 -ml-2"
      >
        {expanded ? '▼ Hide Details' : '▶ Show Details'}
      </button>
      {expanded && (
        <pre className="mt-3 p-4 bg-gray-900 rounded-lg text-xs font-mono text-gray-100 overflow-auto max-h-80 border border-gray-700 shadow-inner">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  );
}

// Skeleton loader for loading state
function AuditTrailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-gray-300 mt-1"></div>
            {i < 3 && <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditTrail({ entries, isLoading = false }: AuditTrailProps) {
  // Sort entries in chronological order (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (isLoading) {
    return <AuditTrailSkeleton />;
  }

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">No audit log entries</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-0">
        {sortedEntries.map((entry, index) => {
          const colors = operationColors[entry.operationType];
          const message = getOperationMessage(entry);

          return (
            <div key={entry.id} className="flex gap-4 pb-4 last:pb-0">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${colors.dot} mt-1.5`}></div>
                {index < sortedEntries.length - 1 && (
                  <div className="w-0.5 h-16 bg-gray-200 mt-1"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4 border-b border-gray-200 last:border-b-0 pt-0.5">
                {/* Operation badge and timestamp */}
                <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}
                  >
                    {entry.operationType}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(entry.createdAt)}</span>
                </div>

                {/* Operation message */}
                <p className="text-sm text-gray-900 mb-1">
                  <TruncatedText text={message} maxLength={100} />
                </p>

                {/* User information */}
                <p className="text-xs text-gray-600 mb-2">By: {entry.createdBy}</p>

                {/* Before/After values for updates */}
                {entry.operationType === OperationType.Update &&
                  entry.previousValue !== undefined &&
                  entry.newValue !== undefined && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      {/* Previous Value Box */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-xs font-semibold text-red-700 mb-1">
                          Previous Value
                        </div>
                        <div className="font-mono text-sm text-red-900 break-all">
                          {entry.previousValue || <span className="text-gray-400 italic">empty</span>}
                        </div>
                      </div>
                      
                      {/* New Value Box */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-xs font-semibold text-green-700 mb-1">
                          New Value
                        </div>
                        <div className="font-mono text-sm text-green-900 break-all">
                          {entry.newValue || <span className="text-gray-400 italic">empty</span>}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Expandable details */}
                {entry.details && <DetailsSection details={entry.details} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
