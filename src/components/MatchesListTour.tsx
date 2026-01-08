import { useState } from 'react';
import { useMatchesByTour } from '@/hooks/useMatches';
import { MatchDetailsDialog } from './MatchDetailsDialog';
import { MatchWithTeams } from '@/hooks/useMatches';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchesListTourProps {
  tourId: string | null;
  tourNumber?: number;
}

export function MatchesListTour({ tourId, tourNumber }: MatchesListTourProps) {
  const { data: matches = [] } = useMatchesByTour(tourId);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!tourId || matches.length === 0) {
    return null;
  }

  const visibleMatches = isExpanded ? matches : matches.slice(0, 3);
  const hasMoreMatches = matches.length > 3;

  return (
    <>
      <div className="stat-card">
        <h2 className="text-xl font-display font-bold text-foreground tracking-wide mb-4">
          Матчи{tourNumber ? ` тура ${tourNumber}` : ''}
        </h2>
        <div className="space-y-2">
          {visibleMatches.map((match, index) => (
            <div
              key={match.id}
              onClick={() => setSelectedMatch(match)}
              className="flex items-center gap-2 sm:gap-4 py-3 px-3 sm:px-4 bg-secondary/50 rounded-lg text-sm hover:bg-secondary/70 transition-colors cursor-pointer group"
            >
              <span className="text-muted-foreground font-mono text-xs shrink-0">
                #{index + 1}
              </span>
              <span className="flex-1 text-right font-medium text-xs sm:text-sm truncate">{match.home_team.name}</span>
              <span className="shrink-0 font-display font-bold text-base sm:text-lg match-score whitespace-nowrap">
                {match.home_score}:{match.away_score}
              </span>
              <span className="flex-1 text-left font-medium text-xs sm:text-sm truncate">{match.away_team.name}</span>
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                →
              </span>
            </div>
          ))}
        </div>
        
        {hasMoreMatches && (
          <Button
            variant="ghost"
            className="w-full mt-3 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Свернуть
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Показать все ({matches.length} матчей)
              </>
            )}
          </Button>
        )}
      </div>

      <MatchDetailsDialog
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </>
  );
}
