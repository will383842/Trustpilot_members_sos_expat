import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Member, MemberFilters } from '../types/member';
import { StatusBadge } from './StatusBadge';
import { SendWhatsAppBtn } from './SendWhatsAppBtn';
import { MemberDrawer } from './MemberDrawer';

interface Props {
  members: Member[];
  total: number;
  currentPage: number;
  lastPage: number;
  filters: MemberFilters;
  onPageChange: (page: number) => void;
}

const LANG_FLAGS: Record<string, string> = {
  fr: '🇫🇷', en: '🇬🇧', de: '🇩🇪', pt: '🇵🇹',
  es: '🇪🇸', it: '🇮🇹', nl: '🇳🇱', ar: '🇸🇦', zh: '🇨🇳',
};

function maskPhone(phone: string) {
  if (phone.length < 6) return phone;
  return phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4);
}

export function MemberTable({ members, total, currentPage, lastPage, onPageChange }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Membre</th>
              <th className="px-4 py-3 text-left">Groupes</th>
              <th className="px-4 py-3 text-left">Langue</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Ajouté le</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucun membre trouvé
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedId(m.id)}
                        className="font-medium text-blue-600 hover:underline text-left"
                      >
                        {m.display_name || 'Inconnu'}
                      </button>
                      {m.is_new && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">NOUVEAU</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{maskPhone(m.phone_number)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.groups.slice(0, 3).map((g) => (
                        <span key={g.id} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                          {g.country || g.name.slice(0, 10)}
                        </span>
                      ))}
                      {m.groups.length > 3 && (
                        <span className="text-xs text-gray-400">+{m.groups.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span title={m.primary_language}>
                      {LANG_FLAGS[m.primary_language] || '🌐'} {m.primary_language}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.message_status} sentAt={m.message_sent_at} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(m.first_seen_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <SendWhatsAppBtn member={m} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
        <span>{total} membre{total > 1 ? 's' : ''} au total</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>Page {currentPage} / {lastPage}</span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === lastPage}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedId && (
        <MemberDrawer memberId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
