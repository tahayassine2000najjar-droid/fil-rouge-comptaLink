import { Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';

export const STATUS = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  accepted: { label: 'Acceptée', className: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 },
  declined: { label: 'Refusée', className: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
  completed: { label: 'Terminée', className: 'bg-blue-50 text-blue-700 border-blue-200', Icon: CheckCircle2 },
  cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-600 border-gray-200', Icon: Ban },
};

export default function StatusBadge({ status }) {
  const config = STATUS[status] || STATUS.pending;
  const { Icon } = config;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {config.label}
    </span>
  );
}
