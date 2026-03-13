import { X, RefreshCw, MessageSquare, Check, Trash2 } from 'lucide-react';
import { useMember, useGenerateMessage, useMarkSent, useMarkReplied, useUpdateNotes, useDeleteMember } from '../hooks/useMembers';
import { StatusBadge } from './StatusBadge';
import { SendWhatsAppBtn } from './SendWhatsAppBtn';
import { useState, useEffect } from 'react';

interface Props {
  memberId: number;
  onClose: () => void;
}

export function MemberDrawer({ memberId, onClose }: Props) {
  const { data: member, isLoading } = useMember(memberId);
  const generate = useGenerateMessage();
  const markSent = useMarkSent();
  const markReplied = useMarkReplied();
  const updateNotes = useUpdateNotes();
  const deleteMember = useDeleteMember();
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (member?.notes !== undefined) setNotes(member.notes || '');
  }, [member?.notes]);

  function handleDelete() {
    deleteMember.mutate(memberId, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Détail membre</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : member ? (
          <div className="flex flex-col gap-4 p-4">
            {/* Identity */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-semibold text-lg">{member.display_name || 'Membre inconnu'}</div>
              <div className="text-sm text-gray-500 mt-1">{member.phone_number}</div>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={member.message_status} sentAt={member.message_sent_at} />
                {member.is_new && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">NOUVEAU</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Détecté le {new Date(member.first_seen_at).toLocaleDateString('fr-FR')}
              </div>
            </div>

            {/* Groups */}
            <div>
              <div className="font-medium text-sm mb-2">Groupes WhatsApp actifs</div>
              <div className="flex flex-wrap gap-2">
                {member.groups
                  .filter((g) => !g.left_at)
                  .map((g) => (
                    <span key={g.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {g.name} {g.country ? `— ${g.country}` : ''}
                    </span>
                  ))}
                {member.groups.filter((g) => !g.left_at).length === 0 && (
                  <span className="text-xs text-gray-400 italic">Aucun groupe actif</span>
                )}
              </div>
            </div>

            {/* Message preview */}
            <div>
              <div className="font-medium text-sm mb-2">Message WhatsApp généré</div>
              {member.whatsapp_message ? (
                <pre className="whitespace-pre-wrap text-xs bg-gray-50 border rounded p-3 max-h-48 overflow-y-auto font-sans">
                  {member.whatsapp_message}
                </pre>
              ) : (
                <div className="text-sm text-gray-400 italic">Aucun message généré</div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {member.generated_at
                  ? `Généré le ${new Date(member.generated_at).toLocaleString('fr-FR')}`
                  : 'Pas encore généré'}
              </div>
            </div>

            {/* Main action */}
            <SendWhatsAppBtn member={member} />

            {/* Secondary actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generate.mutate(member.id)}
                disabled={generate.isPending}
                className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" /> Regénérer
              </button>
              {member.message_status !== 'sent' && member.message_status !== 'replied' && (
                <button
                  onClick={() => markSent.mutate(member.id)}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
                >
                  <Check className="w-4 h-4 text-green-600" /> Marquer envoyé
                </button>
              )}
              {member.message_status !== 'replied' && (
                <button
                  onClick={() => markReplied.mutate(member.id)}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Marquer répondu
                </button>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="font-medium text-sm mb-1">Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => updateNotes.mutate({ id: member.id, notes })}
                rows={3}
                placeholder="Notes libres..."
                className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="text-xs text-gray-400 mt-1">Sauvegarde automatique à la sortie du champ</div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-400 space-y-1 border-t pt-3">
              {member.message_sent_at && <div>Envoyé le : {new Date(member.message_sent_at).toLocaleString('fr-FR')}</div>}
              {member.replied_at && <div>Réponse le : {new Date(member.replied_at).toLocaleString('fr-FR')}</div>}
            </div>

            {/* RGPD — Suppression */}
            <div className="border-t pt-3">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded text-xs text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" /> Supprimer ce membre (RGPD)
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">Confirmer la suppression ?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMember.isPending}
                    className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">Membre introuvable</div>
        )}
      </div>
    </div>
  );
}
