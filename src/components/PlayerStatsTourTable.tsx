import { useMemo, useState } from 'react';
import { usePlayerStatsByTour } from '@/hooks/usePlayerStats';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PlayerTourStats {
  playerId: string;
  playerName: string;
  teamName: string;
  teamColor: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

interface PlayerStatsTourTableProps {
  tourId: string | null;
}

const INITIAL_VISIBLE_COUNT = 5;

export function PlayerStatsTourTable({ tourId }: PlayerStatsTourTableProps) {
  const { data: playerStats = [] } = usePlayerStatsByTour(tourId);
  const { data: players = [] } = usePlayers();
  const { data: teams = [] } = useTeams();
  const [isExpanded, setIsExpanded] = useState(false);

  const aggregatedStats = useMemo(() => {
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
        const team = teams.find((t: any) => t.id === player?.team_id);
        statsMap.set(stat.player_id, {
          playerId: stat.player_id,
          playerName: player?.name ?? stat.player?.name ?? 'Unknown',
          teamName: team?.name ?? '',
          teamColor: team?.color ?? 'black',
          goals: stat.goals,
          assists: stat.assists,
          yellowCards: stat.yellow_cards,
          redCards: stat.red_cards,
        });
      }
    });

    return Array.from(statsMap.values())
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  }, [playerStats, players, teams]);

  const visibleStats = isExpanded ? aggregatedStats : aggregatedStats.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = aggregatedStats.length > INITIAL_VISIBLE_COUNT;

  const getTeamNameClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-team-red';
      case 'blue': return 'text-team-blue';
      case 'green': return 'text-team-green';
      case 'black': return 'text-foreground';
      default: return 'text-muted-foreground';
    }
  };

  if (!tourId || aggregatedStats.length === 0) {
    return (
      <div className="stat-card">
        <h2 className="text-xl font-bold text-foreground font-mono mb-4">
          Статистика игроков
        </h2>
        <p className="text-muted-foreground text-center py-8">
          Нет данных для отображения
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h2 className="text-xl font-bold text-foreground font-mono mb-4">
        Статистика игроков
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Игрок</th>
              <th className="text-left py-2 px-2">Команда</th>
              <th className="text-center py-2 px-1">⚽</th>
              <th className="text-center py-2 px-1">🅰️</th>
              <th className="text-center py-2 px-1">🟨</th>
              <th className="text-center py-2 px-1">🟥</th>
            </tr>
          </thead>
          <tbody>
            {visibleStats.map((player, idx) => (
              <tr
                key={player.playerId}
                className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                <td className="py-2 px-2 font-medium">{player.playerName}</td>
                <td className={`py-2 px-2 ${getTeamNameClass(player.teamColor)}`}>
                  {player.teamName}
                </td>
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
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 border-t border-border/50"
        >
          {isExpanded ? (
            <>Свернуть <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Показать все ({aggregatedStats.length}) <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </div>
  );
}
