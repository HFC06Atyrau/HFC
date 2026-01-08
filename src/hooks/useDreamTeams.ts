import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TourDreamTeam {
  id: string;
  tour_id: string;
  player_id: string;
  team_type: 'dream' | 'anti';
  position: number;
  created_at: string;
}

export interface SeasonDreamTeam {
  id: string;
  season_id: string;
  player_id: string;
  team_type: 'dream' | 'anti';
  position: number;
  created_at: string;
}

// Tour Dream Teams
export function useTourDreamTeam(tourId: string | null, teamType: 'dream' | 'anti') {
  return useQuery({
    queryKey: ['tour-dream-team', tourId, teamType],
    queryFn: async () => {
      if (!tourId) return [];
      const { data, error } = await supabase
        .from('tour_dream_teams')
        .select('*')
        .eq('tour_id', tourId)
        .eq('team_type', teamType)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as TourDreamTeam[];
    },
    enabled: !!tourId,
  });
}

export function useSetTourDreamTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      tourId, 
      teamType, 
      playerIds 
    }: { 
      tourId: string; 
      teamType: 'dream' | 'anti'; 
      playerIds: string[] 
    }) => {
      // Delete existing entries
      await supabase
        .from('tour_dream_teams')
        .delete()
        .eq('tour_id', tourId)
        .eq('team_type', teamType);
      
      // Insert new entries
      if (playerIds.length > 0) {
        const entries = playerIds.map((playerId, index) => ({
          tour_id: tourId,
          player_id: playerId,
          team_type: teamType,
          position: index + 1,
        }));
        
        const { error } = await supabase
          .from('tour_dream_teams')
          .insert(entries);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tour-dream-team', variables.tourId, variables.teamType] });
      toast.success(variables.teamType === 'dream' ? 'Сборная тура сохранена' : 'Антисборная тура сохранена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Season Dream Teams
export function useSeasonDreamTeam(seasonId: string | null, teamType: 'dream' | 'anti') {
  return useQuery({
    queryKey: ['season-dream-team', seasonId, teamType],
    queryFn: async () => {
      if (!seasonId) return [];
      const { data, error } = await supabase
        .from('season_dream_teams')
        .select('*')
        .eq('season_id', seasonId)
        .eq('team_type', teamType)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as SeasonDreamTeam[];
    },
    enabled: !!seasonId,
  });
}

export function useSetSeasonDreamTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      seasonId, 
      teamType, 
      playerIds 
    }: { 
      seasonId: string; 
      teamType: 'dream' | 'anti'; 
      playerIds: string[] 
    }) => {
      // Delete existing entries
      await supabase
        .from('season_dream_teams')
        .delete()
        .eq('season_id', seasonId)
        .eq('team_type', teamType);
      
      // Insert new entries
      if (playerIds.length > 0) {
        const entries = playerIds.map((playerId, index) => ({
          season_id: seasonId,
          player_id: playerId,
          team_type: teamType,
          position: index + 1,
        }));
        
        const { error } = await supabase
          .from('season_dream_teams')
          .insert(entries);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['season-dream-team', variables.seasonId, variables.teamType] });
      toast.success(variables.teamType === 'dream' ? 'Сборная сезона сохранена' : 'Антисборная сезона сохранена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
