import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tour {
  id: string;
  number: number;
  season_id: string | null;
  video_url: string | null;
  mvp_player_id: string | null;
  created_at: string;
}

export function useTours() {
  return useQuery({
    queryKey: ['tours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('number', { ascending: false });
      if (error) throw error;
      return data as Tour[];
    },
  });
}

export function useToursBySeason(seasonId: string | null) {
  return useQuery({
    queryKey: ['tours', 'season', seasonId],
    queryFn: async () => {
      if (!seasonId) return [];
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('season_id', seasonId)
        .order('number', { ascending: false });
      if (error) throw error;
      return data as Tour[];
    },
    enabled: !!seasonId,
  });
}

export function useCurrentTour() {
  return useQuery({
    queryKey: ['current-tour'],
    queryFn: async () => {
      // Get current season first
      const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();
      
      if (!season) return null;
      
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('season_id', season.id)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Tour | null;
    },
  });
}

export function useCreateTour() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (seasonId: string) => {
      // Get max tour number for this season
      const { data: tours } = await supabase
        .from('tours')
        .select('number')
        .eq('season_id', seasonId)
        .order('number', { ascending: false })
        .limit(1);
      
      const nextNumber = tours && tours.length > 0 ? tours[0].number + 1 : 1;
      
      const { data, error } = await supabase
        .from('tours')
        .insert({ number: nextNumber, season_id: seasonId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      queryClient.invalidateQueries({ queryKey: ['current-tour'] });
      toast.success('Новый тур создан');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
