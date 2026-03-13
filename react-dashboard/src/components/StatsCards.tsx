import { Users, Send, MessageCircle, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import type { Stats } from '../types/member';

interface Props {
  stats: Stats;
}

export function StatsCards({ stats }: Props) {
  return (
    <div className="space-y-6">
      {/* Baileys connection status */}
      <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${stats.baileys_connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {stats.baileys_connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        WhatsApp Baileys : {stats.baileys_connected ? 'Connecté' : 'Déconnecté'}
        {stats.baileys_last_ping && (
          <span className="text-xs opacity-70 ml-auto">
            Dernier ping : {new Date(stats.baileys_last_ping).toLocaleTimeString('fr-FR')}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={<Users />} label="Total membres" value={stats.total_members} color="blue" />
        <KpiCard icon={<span className="text-lg">🔴</span>} label="Non contactés" value={stats.not_sent} sub={`${stats.total_members ? Math.round(stats.not_sent / stats.total_members * 100) : 0}%`} color="red" />
        <KpiCard icon={<Send />} label="Envoyés" value={stats.sent} color="green" />
        <KpiCard icon={<MessageCircle />} label="Ont répondu" value={stats.replied} color="blue" />
        <KpiCard icon={<TrendingUp />} label="Envoyés aujourd'hui" value={stats.sent_today} color="purple" />
        <KpiCard icon={<span className="text-lg">✨</span>} label="Nouveaux (7j)" value={stats.new_this_week} color="orange" />
      </div>

      {/* Language breakdown */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium mb-3">Répartition par langue</h3>
        <div className="space-y-2">
          {stats.by_language.map((l) => (
            <div key={l.primary_language} className="flex items-center gap-2">
              <span className="text-sm w-8">{l.primary_language}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${stats.total_members ? Math.round(l.count / stats.total_members * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-16 text-right">{l.count} ({stats.total_members ? Math.round(l.count / stats.total_members * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top groups */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium mb-3">Top 10 groupes</h3>
        <div className="space-y-1">
          {stats.top_groups.map((g, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <span>{g.name}</span>
              <span className="text-gray-500">{g.member_count} membres</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold">{value.toLocaleString('fr-FR')}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
