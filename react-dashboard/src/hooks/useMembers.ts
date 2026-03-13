import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { Member, MemberFilters, PaginatedResponse } from '../types/member';

export function useMembers(filters: MemberFilters) {
  return useQuery<PaginatedResponse<Member>>({
    queryKey: ['members', filters],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      );
      const { data } = await api.get('/api/members', { params });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useMember(id: number) {
  return useQuery<Member>({
    queryKey: ['member', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/${id}`);
      return data;
    },
  });
}

export function useMarkSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/members/${id}/mark-sent`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useMarkReplied() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/members/${id}/mark-replied`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useGenerateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/members/${id}/generate`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['member', id] });
    },
  });
}

export function useUpdateNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.put(`/api/members/${id}/notes`, { notes }),
    onSuccess: (_data, { id }) => qc.invalidateQueries({ queryKey: ['member', id] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/members/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
