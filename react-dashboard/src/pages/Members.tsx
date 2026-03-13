import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMembers } from '../hooks/useMembers';
import { FilterBar } from '../components/FilterBar';
import { MemberTable } from '../components/MemberTable';
import type { MemberFilters } from '../types/member';

export function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({
    status: '',
    language: '',
    group_id: '',
    search: '',
    sort: 'recent',
    page: 1,
  });

  const { data, isLoading, isError } = useMembers(filters);

  function handleFiltersChange(partial: Partial<MemberFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h1 className="text-xl font-semibold">Membres WhatsApp</h1>
        <p className="text-sm text-gray-500">Gérez et contactez les membres de vos 68 groupes SOS-Expat</p>
      </div>

      <FilterBar filters={filters} onChange={handleFiltersChange} />

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-500">
            Erreur lors du chargement des membres. Vérifiez que l'API est démarrée.
          </div>
        ) : data ? (
          <MemberTable
            members={data.data}
            total={data.total}
            currentPage={data.current_page}
            lastPage={data.last_page}
            filters={filters}
            onPageChange={(page) => handleFiltersChange({ page })}
          />
        ) : null}
      </div>
    </div>
  );
}
