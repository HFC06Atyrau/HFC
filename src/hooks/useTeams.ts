import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Team {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Team[];
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Команда создана');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTeamColor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .update({ color })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['tour-teams'] });
      toast.success('Цвет команды обновлён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Команда удалена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
