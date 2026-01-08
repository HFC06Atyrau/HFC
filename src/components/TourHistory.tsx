import { useState, useMemo } from 'react';
import { useTours, Tour } from '@/hooks/useTours';
import { useTourTeams } from '@/hooks/useTourTeams';
import { useMatchesByTour, MatchWithTeams } from '@/hooks/useMatches';
import { usePlayerStatsByTour } from '@/hooks/usePlayerStats';
import { usePlayers } from '@/hooks/usePlayers';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';

interface TeamStats {
  teamId: string;
  teamName: string;
  color: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface PlayerTourStats {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

function calculateTeamStats(
  teamId: string,
  teamName: string,
  color: string,
  matches: MatchWithTeams[]
): TeamStats {
  let won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

  matches.forEach(match => {
    if (match.home_team_id === teamId) {
      goalsFor += match.home_score;
      goalsAgainst += match.away_score;
      if (match.home_score > match.away_score) won++;
      else if (match.home_score === match.away_score) drawn++;
      else lost++;
    } else if (match.away_team_id === teamId) {
      goalsFor += match.away_score;
      goalsAgainst += match.home_score;
      if (match.away_score > match.home_score) won++;
      else if (match.away_score === match.home_score) drawn++;
      else lost++;
    }
  });

  return {
    teamId,
    teamName,
    color,
    played: won + drawn + lost,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    points: won * 3 + drawn,
  };
}

function TourDetails({ tour }: { tour: Tour }) {
  const { data: tourTeams = [] } = useTourTeams(tour.id);
  const { data: matches = [] } = useMatchesByTour(tour.id);
  const { data: playerStats = [] } = usePlayerStatsByTour(tour.id);
  const { data: players = [] } = usePlayers();

  const teamStats = useMemo(() => {
    return tourTeams
      .map(tt => calculateTeamStats(tt.team_id, tt.team.name, tt.color, matches))
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);
  }, [tourTeams, matches]);

  const aggregatedPlayerStats = useMemo(() => {
    const statsMap = new Map<string, PlayerTourStats>();

    playerStats.forEach((stat: any) => {
      const existing = statsMap.get(stat.player_id);
      if (existing) {
        existing.goals += stat.goals;
        existing.assists += stat.assists;
        existing.yellowCards += stat.yellow_cards;
        existing.redCards += stat.red_cards;
      } else {
        const player = players.find((p: any) => p.id === stat.player_id);
        statsMap.set(stat.player_id, {
          playerId: stat.player_id,
          playerName: player?.name ?? 'Unknown',
          goals: stat.goals,
          assists: stat.assists,
          yellowCards: stat.yellow_cards,
          redCards: stat.red_cards,
        });
      }
    });

    return Array.from(statsMap.values())
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  }, [playerStats, players]);

  const getRowClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-team-red';
      case 'blue': return 'bg-team-blue';
      case 'green': return 'bg-team-green';
      case 'black': return 'bg-team-black text-foreground';
      default: return '';
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Team Table */}
      <div className="stat-card">
        <h3 className="text-lg font-bold text-foreground font-mono mb-3">
          Таблица
        </h3>
        {teamStats.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2">Команда</th>
                  <th className="text-center py-2 px-1">И</th>
                  <th className="text-center py-2 px-1">В</th>
                  <th className="text-center py-2 px-1">Н</th>
                  <th className="text-center py-2 px-1">П</th>
                  <th className="text-center py-2 px-1">ГЗ</th>
                  <th className="text-center py-2 px-1">ГП</th>
                  <th className="text-center py-2 px-1">Разн</th>
                  <th className="text-center py-2 px-1 text-primary">Очки</th>
                </tr>
              </thead>
              <tbody>
                {teamStats.map(team => (
                  <tr
                    key={team.teamId}
                    className={`border-b border-border/50 ${getRowClass(team.color)} transition-colors`}
                  >
                    <td className="py-2 px-2 font-medium">{team.teamName}</td>
                    <td className="text-center py-2 px-1 font-mono">{team.played}</td>
                    <td className="text-center py-2 px-1 font-mono">{team.won}</td>
                    <td className="text-center py-2 px-1 font-mono">{team.drawn}</td>
                    <td className="text-center py-2 px-1 font-mono">{team.lost}</td>
                    <td className="text-center py-2 px-1 font-mono">{team.goalsFor}</td>
                    <td className="text-center py-2 px-1 font-mono">{team.goalsAgainst}</td>
                    <td className="text-center py-2 px-1 font-mono">
                      {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                    </td>
                    <td className="text-center py-2 px-1 font-mono font-bold text-primary">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Matches */}
        {matches.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Матчи</h4>
            <div className="space-y-1">
              {matches.map(match => (
                <div
                  key={match.id}
                  className="flex items-center justify-between py-1 px-2 bg-secondary/30 rounded text-xs"
                >
                  <span className="flex-1 text-right truncate">{match.home_team.name}</span>
                  <span className="mx-2 font-mono font-bold text-primary">
                    {match.home_score}:{match.away_score}
                  </span>
                  <span className="flex-1 text-left truncate">{match.away_team.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player Stats */}
      <div className="stat-card">
        <h3 className="text-lg font-bold text-foreground font-mono mb-3">
          Статистика игроков
        </h3>
        {aggregatedPlayerStats.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Игрок</th>
                  <th className="text-center py-2 px-1">⚽</th>
                  <th className="text-center py-2 px-1">🅰️</th>
                  <th className="text-center py-2 px-1">🟨</th>
                  <th className="text-center py-2 px-1">🟥</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedPlayerStats.map((player, idx) => (
                  <tr
                    key={player.playerId}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium">{player.playerName}</td>
                    <td className="text-center py-2 px-1 font-mono font-bold text-primary">
                      {player.goals}
                    </td>
                    <td className="text-center py-2 px-1 font-mono">{player.assists}</td>
                    <td className="text-center py-2 px-1 font-mono">{player.yellowCards}</td>
                    <td className="text-center py-2 px-1 font-mono">{player.redCards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function TourHistory() {
  const { data: tours = [], isLoading } = useTours();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Skip the current (latest) tour, show only history
  const historicalTours = useMemo(() => {
    return tours.slice(1); // First tour is the current one (sorted desc)
  }, [tours]);

  if (isLoading) {
    return <div className="stat-card animate-pulse h-48" />;
  }

  if (historicalTours.length === 0) {
    return null;
  }

  const selectedTour = historicalTours[selectedIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground font-mono">
            История туров
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedIndex(prev => Math.min(prev + 1, historicalTours.length - 1))}
            disabled={selectedIndex >= historicalTours.length - 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="font-mono text-lg font-bold text-primary min-w-[80px] text-center">
            Тур {selectedTour?.number}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedIndex(prev => Math.max(prev - 1, 0))}
            disabled={selectedIndex <= 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {selectedTour && <TourDetails tour={selectedTour} />}
    </div>
  );
}
