import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Stats } from '../types/member';

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/stats');
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await api.get('/api/groups');
      return data;
    },
    staleTime: 300_000,
  });
}
