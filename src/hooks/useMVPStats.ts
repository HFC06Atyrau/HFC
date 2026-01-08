import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMVPCountsBySeason(seasonId: string | null) {
  return useQuery({
    queryKey: ['mvp-counts', seasonId],
    queryFn: async () => {
      if (!seasonId) return new Map<string, number>();
      
      const { data: tours, error } = await supabase
        .from('tours')
        .select('mvp_player_id')
        .eq('season_id', seasonId)
        .not('mvp_player_id', 'is', null);
      
      if (error) throw error;
      
      const counts = new Map<string, number>();
      tours?.forEach(tour => {
        if (tour.mvp_player_id) {
          counts.set(tour.mvp_player_id, (counts.get(tour.mvp_player_id) || 0) + 1);
        }
      });
      
      return counts;
    },
    enabled: !!seasonId,
  });
}
