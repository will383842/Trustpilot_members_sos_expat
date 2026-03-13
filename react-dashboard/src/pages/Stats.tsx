import { Loader2 } from 'lucide-react';
import { useStats } from '../hooks/useStats';
import { StatsCards } from '../components/StatsCards';

export function StatsPage() {
  const { data, isLoading, isError } = useStats();

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h1 className="text-xl font-semibold">Statistiques</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble de la campagne Trustpilot</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-500">
            Erreur lors du chargement des statistiques.
          </div>
        ) : data ? (
          <StatsCards stats={data} />
        ) : null}
      </div>
    </div>
  );
}
