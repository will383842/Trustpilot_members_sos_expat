import type { MessageStatus } from '../types/member';

const config: Record<MessageStatus, { label: string; className: string }> = {
  not_sent: { label: '🔴 Non contacté', className: 'bg-red-100 text-red-700' },
  sent:     { label: '✅ Envoyé',       className: 'bg-green-100 text-green-700' },
  replied:  { label: '💬 A répondu',   className: 'bg-blue-100 text-blue-700' },
};

interface Props {
  status: MessageStatus;
  sentAt?: string | null;
}

export function StatusBadge({ status, sentAt }: Props) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
      {status === 'sent' && sentAt && (
        <span className="ml-1 text-gray-500">
          {new Date(sentAt).toLocaleDateString('fr-FR')}
        </span>
      )}
    </span>
  );
}
