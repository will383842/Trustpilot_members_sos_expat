import type { MemberFilters } from '../types/member';
import { useGroups } from '../hooks/useStats';

interface Props {
  filters: MemberFilters;
  onChange: (f: Partial<MemberFilters>) => void;
}

const LANGUAGES = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 Anglais' },
  { code: 'de', label: '🇩🇪 Allemand' },
  { code: 'pt', label: '🇵🇹 Portugais' },
  { code: 'es', label: '🇪🇸 Espagnol' },
  { code: 'it', label: '🇮🇹 Italien' },
  { code: 'nl', label: '🇳🇱 Néerlandais' },
  { code: 'ar', label: '🇸🇦 Arabe' },
  { code: 'zh', label: '🇨🇳 Chinois' },
];

export function FilterBar({ filters, onChange }: Props) {
  const { data: groups = [] } = useGroups();

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white border-b">
      {/* Search */}
      <input
        type="text"
        placeholder="Rechercher nom ou téléphone..."
        value={filters.search || ''}
        onChange={(e) => onChange({ search: e.target.value, page: 1 })}
        className="border rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* Status */}
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ status: e.target.value as MemberFilters['status'], page: 1 })}
        className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">Tous les statuts</option>
        <option value="not_sent">🔴 Non contacté</option>
        <option value="sent">✅ Envoyé</option>
        <option value="replied">💬 A répondu</option>
      </select>

      {/* Language */}
      <select
        value={filters.language || ''}
        onChange={(e) => onChange({ language: e.target.value, page: 1 })}
        className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">Toutes les langues</option>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>

      {/* Group */}
      <select
        value={filters.group_id || ''}
        onChange={(e) => onChange({ group_id: e.target.value ? Number(e.target.value) : '', page: 1 })}
        className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-w-xs"
      >
        <option value="">Tous les groupes</option>
        {groups.map((g: { id: number; name: string }) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sort || 'recent'}
        onChange={(e) => onChange({ sort: e.target.value as MemberFilters['sort'] })}
        className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="recent">Ajouté récemment</option>
        <option value="name">Nom A-Z</option>
        <option value="status">Statut</option>
      </select>

      {/* Reset */}
      <button
        onClick={() => onChange({ status: '', language: '', group_id: '', search: '', sort: 'recent', page: 1 })}
        className="border rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
      >
        Réinitialiser
      </button>
    </div>
  );
}
