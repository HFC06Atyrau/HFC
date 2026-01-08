import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MatchWithTeams } from './useMatches';

export function useMatchesBySeason(seasonId: string | null) {
  return useQuery({
    queryKey: ['matches-by-season', seasonId],
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
      
      // Then get all matches for these tours
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, color),
          away_team:teams!matches_away_team_id_fkey(id, name, color)
        `)
        .in('tour_id', tourIds)
        .order('created_at');
      
      if (error) throw error;
      return data as MatchWithTeams[];
    },
    enabled: !!seasonId,
  });
}
