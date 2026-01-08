import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TourDreamTeamEntry {
  id: string;
  tour_id: string;
  player_id: string;
  team_type: 'dream' | 'anti';
  position: number;
}

export function useTourDreamTeamsBySeason(seasonId: string | null) {
  return useQuery({
    queryKey: ['tour-dream-teams-by-season', seasonId],
    queryFn: async () => {
      if (!seasonId) return [];
      
      // First get all tours for this season
      const { data: tours, error: toursError } = await supabase
        .from('tours')
        .select('id')
        .eq('season_id', seasonId);
      
      if (toursError) throw toursError;
      if (!tours || tours.length === 0) return [];
      
      const tourIds = tours.map(t => t.id);
      
      // Then get all dream team entries for these tours
      const { data, error } = await supabase
        .from('tour_dream_teams')
        .select('*')
        .in('tour_id', tourIds)
        .eq('team_type', 'dream');
      
      if (error) throw error;
      return data as TourDreamTeamEntry[];
    },
    enabled: !!seasonId,
  });
}
