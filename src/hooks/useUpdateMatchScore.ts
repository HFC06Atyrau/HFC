import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to recalculate match score based on player stats (including own goals)
// Legionnaire goals are counted for the team of the player they substitute
export function useRecalculateMatchScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      // First get the match to know the teams and tour
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, tour_id')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Get all player stats for this match
      const { data: stats, error: statsError } = await supabase
        .from('player_stats')
        .select('goals, own_goals, player_id, player:players(team_id)')
        .eq('match_id', matchId);

      if (statsError) throw statsError;

      // Get substitutions for this tour to determine legionnaire team assignments
      const { data: substitutions, error: subsError } = await supabase
        .from('tour_player_substitutions')
        .select('original_player_id, substitute_player_id, original_player:players!tour_player_substitutions_original_player_id_fkey(team_id)')
        .eq('tour_id', match.tour_id);

      if (subsError) throw subsError;

      // Build a map of substitute_player_id -> team_id (from original player)
      const substituteTeamMap = new Map<string, string>();
      substitutions?.forEach((sub: any) => {
        if (sub.original_player?.team_id) {
          substituteTeamMap.set(sub.substitute_player_id, sub.original_player.team_id);
        }
      });

      // Calculate goals for each team (own goals count for opponent)
      let homeScore = 0;
      let awayScore = 0;

      stats?.forEach((stat: any) => {
        const goals = stat.goals || 0;
        const ownGoals = stat.own_goals || 0;
        
        // Determine the effective team for this player
        // If player has no team (legionnaire), check if they're a substitute
        let effectiveTeamId = stat.player?.team_id;
        if (!effectiveTeamId) {
          effectiveTeamId = substituteTeamMap.get(stat.player_id);
        }
        
        if (effectiveTeamId === match.home_team_id) {
          // Home team player: goals for home, own_goals for away
          homeScore += goals;
          awayScore += ownGoals;
        } else if (effectiveTeamId === match.away_team_id) {
          // Away team player: goals for away, own_goals for home
          awayScore += goals;
          homeScore += ownGoals;
        }
      });

      // Update match score
      const { error: updateError } = await supabase
        .from('matches')
        .update({ home_score: homeScore, away_score: awayScore })
        .eq('id', matchId);

      if (updateError) throw updateError;

      return { homeScore, awayScore };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['all-matches'] });
    },
  });
}
