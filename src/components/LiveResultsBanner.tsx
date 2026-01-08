import { useAllMatches } from '@/hooks/useMatches';
import { useToursBySeason } from '@/hooks/useTours';
import { useCurrentSeason } from '@/hooks/useSeasons';
import { Trophy } from 'lucide-react';

export function LiveResultsBanner() {
  const { data: currentSeason } = useCurrentSeason();
  const { data: tours = [] } = useToursBySeason(currentSeason?.id ?? null);
  const { data: allMatches = [] } = useAllMatches();

  // Get matches from the latest tour
  const latestTour = tours[0];
  const latestMatches = latestTour
    ? allMatches.filter(m => m.tour_id === latestTour.id).slice(0, 6)
    : [];

  if (latestMatches.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-pitch/20 via-pitch/10 to-pitch/20 border-y border-primary/30">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,hsl(var(--primary)/0.05)_50%,transparent_100%)] animate-shimmer" />
      
      <div className="relative py-3">
        <div className="flex items-center gap-4 animate-scroll-left">
          <div className="flex items-center gap-2 shrink-0 px-4 border-r border-primary/30">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="font-display text-sm text-accent">
              ТУР {latestTour?.number}
            </span>
          </div>
          
          <div className="flex gap-4 sm:gap-8 items-center">
            {/* Duplicate for seamless loop */}
            {[...latestMatches, ...latestMatches].map((match, idx) => (
              <div 
                key={`${match.id}-${idx}`}
                className="flex items-center gap-2 sm:gap-3 shrink-0"
              >
                <span className="text-xs sm:text-sm font-medium text-foreground/80 max-w-[60px] sm:max-w-none truncate">
                  {match.home_team.name}
                </span>
                <span className="font-display font-bold text-sm sm:text-lg match-score whitespace-nowrap">
                  {match.home_score}:{match.away_score}
                </span>
                <span className="text-xs sm:text-sm font-medium text-foreground/80 max-w-[60px] sm:max-w-none truncate">
                  {match.away_team.name}
                </span>
                <span className="text-muted-foreground/50 mx-2 sm:mx-4">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
