import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Player {
  id: string;
  name: string;
  team_id: string | null;
  photo_url: string | null;
  created_at: string;
}

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*, teams(name)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function usePlayersByTeam(teamId: string | null) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('name');
      if (error) throw error;
      return data as Player[];
    },
    enabled: !!teamId,
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, teamId }: { name: string; teamId: string | null }) => {
      const { data, error } = await supabase
        .from('players')
        .insert({ name, team_id: teamId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Игрок добавлен');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string | null }) => {
      const { data, error } = await supabase
        .from('players')
        .update({ team_id: teamId })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Команда игрока обновлена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Игрок удалён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
