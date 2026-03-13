import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { useMarkSent, useGenerateMessage } from '../hooks/useMembers';
import type { Member } from '../types/member';

interface Props {
  member: Member;
}

export function SendWhatsAppBtn({ member }: Props) {
  const [confirming, setConfirming] = useState(false);
  const markSent = useMarkSent();
  const generate = useGenerateMessage();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount to avoid state update on unmounted component
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSendClick() {
    timerRef.current = setTimeout(() => setConfirming(true), 3000);
  }

  // Message not yet generated
  if (!member.has_message || !member.whatsapp_link) {
    return (
      <button
        onClick={() => generate.mutate(member.id)}
        disabled={generate.isPending}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
      >
        {generate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        {generate.isPending ? 'Génération...' : 'Générer message'}
      </button>
    );
  }

  // Already sent — show re-send only
  if (member.message_status === 'sent' || member.message_status === 'replied') {
    return (
      <a
        href={member.whatsapp_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
      >
        <MessageCircle className="w-3 h-3" />
        Renvoyer
      </a>
    );
  }

  // Ready to send — confirm after 3s
  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">Envoyé ?</span>
        <button
          onClick={() => { markSent.mutate(member.id); setConfirming(false); }}
          className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700"
        >
          Oui ✓
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Non
        </button>
      </div>
    );
  }

  return (
    <a
      href={member.whatsapp_link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleSendClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
    >
      <MessageCircle className="w-3 h-3" />
      Envoyer sur WhatsApp
    </a>
  );
}
