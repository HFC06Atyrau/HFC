import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TourSubstitution {
  id: string;
  tour_id: string;
  original_player_id: string;
  substitute_player_id: string;
  created_at: string;
}

export interface TourSubstitutionWithPlayers extends TourSubstitution {
  original_player: { id: string; name: string };
  substitute_player: { id: string; name: string };
}

export function useTourSubstitutions(tourId: string | null) {
  return useQuery({
    queryKey: ['tour-substitutions', tourId],
    queryFn: async () => {
      if (!tourId) return [];
      const { data, error } = await supabase
        .from('tour_player_substitutions')
        .select(`
          *,
          original_player:players!tour_player_substitutions_original_player_id_fkey(id, name),
          substitute_player:players!tour_player_substitutions_substitute_player_id_fkey(id, name)
        `)
        .eq('tour_id', tourId);
      if (error) throw error;
      return data as TourSubstitutionWithPlayers[];
    },
    enabled: !!tourId,
  });
}

export function useAllTourSubstitutions() {
  return useQuery({
    queryKey: ['all-tour-substitutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_player_substitutions')
        .select('*');
      if (error) throw error;
      return data as TourSubstitution[];
    },
  });
}

export function useCreateTourSubstitution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sub: { tour_id: string; original_player_id: string; substitute_player_id: string }) => {
      const { data, error } = await supabase
        .from('tour_player_substitutions')
        .insert(sub)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tour-substitutions', variables.tour_id] });
      queryClient.invalidateQueries({ queryKey: ['all-tour-substitutions'] });
      toast.success('Замена добавлена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTourSubstitution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, tourId }: { id: string; tourId: string }) => {
      const { error } = await supabase
        .from('tour_player_substitutions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return tourId;
    },
    onSuccess: (tourId) => {
      queryClient.invalidateQueries({ queryKey: ['tour-substitutions', tourId] });
      queryClient.invalidateQueries({ queryKey: ['all-tour-substitutions'] });
      toast.success('Замена удалена');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
