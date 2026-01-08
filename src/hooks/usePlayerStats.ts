import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlayerStat {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  own_goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  created_at: string;
}

export interface PlayerStatWithPlayer extends PlayerStat {
  player: { id: string; name: string; team_id: string };
}

export function usePlayerStatsByMatch(matchId: string | null) {
  return useQuery({
    queryKey: ['player-stats', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from('player_stats')
        .select(`
          *,
          player:players(id, name, team_id)
        `)
        .eq('match_id', matchId);
      if (error) throw error;
      return data as PlayerStatWithPlayer[];
    },
    enabled: !!matchId,
  });
}

export function useAllPlayerStats() {
  return useQuery({
    queryKey: ['all-player-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_stats')
        .select(`
          *,
          player:players(id, name, team_id),
          match:matches(tour_id)
        `);
      if (error) throw error;
      return data;
    },
  });
}

export function usePlayerStatsWithSubstitutions() {
  return useQuery({
    queryKey: ['player-stats-with-subs'],
    queryFn: async () => {
      // Get all player stats
      const { data: stats, error: statsError } = await supabase
        .from('player_stats')
        .select(`
          *,
          player:players(id, name, team_id),
          match:matches(tour_id)
        `);
      if (statsError) throw statsError;

      // Get all substitutions
      const { data: subs, error: subsError } = await supabase
        .from('tour_player_substitutions')
        .select('*');
      if (subsError) throw subsError;

      return { stats: stats || [], substitutions: subs || [] };
    },
  });
}

export function usePlayerStatsByTour(tourId: string | null) {
  return useQuery({
    queryKey: ['player-stats-tour', tourId],
    queryFn: async () => {
      if (!tourId) return [];
      const { data, error } = await supabase
        .from('player_stats')
        .select(`
          *,
          player:players(id, name, team_id),
          match:matches!inner(tour_id)
        `)
        .eq('match.tour_id', tourId);
      if (error) throw error;
      return data;
    },
    enabled: !!tourId,
  });
}

export function useCreatePlayerStat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stat: Omit<PlayerStat, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('player_stats')
        .insert(stat)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['player-stats-tour'] });
      toast.success('Статистика добавлена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePlayerStat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...stat }: Partial<PlayerStat> & { id: string }) => {
      const { data, error } = await supabase
        .from('player_stats')
        .update(stat)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['player-stats-tour'] });
      toast.success('Статистика обновлена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePlayerStat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('player_stats')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['player-stats-tour'] });
      toast.success('Статистика удалена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
