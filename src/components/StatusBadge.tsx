import React from 'react';

interface StatusBadgeProps {
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid';
}

const statusConfig = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-500', label: '● Draft' },
  sent: { bg: 'bg-blue-50', text: 'text-blue-600', label: '● Sent' },
  viewed: { bg: 'bg-amber-50', text: 'text-amber-600', label: '● Viewed' },
  signed: { bg: 'bg-green-50', text: 'text-green-600', label: '✓ Signed' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Paid' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
