import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TourTeam {
  id: string;
  tour_id: string;
  team_id: string;
  color: string;
}

export interface TourTeamWithTeam extends TourTeam {
  team: { id: string; name: string };
}

export function useTourTeams(tourId: string | null) {
  return useQuery({
    queryKey: ['tour-teams', tourId],
    queryFn: async () => {
      if (!tourId) return [];
      const { data, error } = await supabase
        .from('tour_teams')
        .select(`
          *,
          team:teams(id, name)
        `)
        .eq('tour_id', tourId);
      if (error) throw error;
      return data as TourTeamWithTeam[];
    },
    enabled: !!tourId,
  });
}

export function useAddTeamToTour() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tourId, teamId, color = 'black' }: { tourId: string; teamId: string; color?: string }) => {
      const { data, error } = await supabase
        .from('tour_teams')
        .insert({ tour_id: tourId, team_id: teamId, color })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-teams'] });
      toast.success('Команда добавлена в тур');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTourTeamColor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      const { data, error } = await supabase
        .from('tour_teams')
        .update({ color })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-teams'] });
      toast.success('Цвет обновлён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveTeamFromTour() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tour_teams')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-teams'] });
      toast.success('Команда удалена из тура');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
