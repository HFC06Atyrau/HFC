import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Match {
  id: string;
  tour_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
}

export interface MatchWithTeams extends Match {
  home_team: { id: string; name: string };
  away_team: { id: string; name: string };
}

export function useMatchesByTour(tourId: string | null) {
  return useQuery({
    queryKey: ['matches', tourId],
    queryFn: async () => {
      if (!tourId) return [];
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `)
        .eq('tour_id', tourId)
        .order('created_at');
      if (error) throw error;
      return data as MatchWithTeams[];
    },
    enabled: !!tourId,
  });
}

export function useAllMatches() {
  return useQuery({
    queryKey: ['all-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `)
        .order('created_at');
      if (error) throw error;
      return data as MatchWithTeams[];
    },
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (match: Omit<Match, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('matches')
        .insert(match)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['all-matches'] });
      toast.success('Матч добавлен');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...match }: Partial<Match> & { id: string }) => {
      const { data, error } = await supabase
        .from('matches')
        .update(match)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['all-matches'] });
      toast.success('Матч обновлён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['all-matches'] });
      toast.success('Матч удалён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
