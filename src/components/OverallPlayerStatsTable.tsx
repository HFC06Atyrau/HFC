import { useMemo, useState } from 'react';
import { usePlayerStatsWithSubstitutions } from '@/hooks/usePlayerStats';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { useCurrentSeason } from '@/hooks/useSeasons';
import { useTourDreamTeamsBySeason } from '@/hooks/useTourDreamTeamsBySeason';
import { useMVPCountsBySeason } from '@/hooks/useMVPStats';
import { useAllMatches } from '@/hooks/useMatches';
import { ArrowUpDown, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'; // Добавил Trash2
import { useAuth } from '@/lib/auth'; // Добавил проверку авторизации
import { supabase } from "@/integrations/supabase/client";  // Добавил клиент базы данных
import { useToast } from '@/hooks/use-toast'; // Для уведомлений

const INITIAL_VISIBLE_COUNT = 6;

// ... (интерфейс OverallPlayerStats остается прежним)
interface OverallPlayerStats {
  playerId: string;
  playerName: string;
  teamName: string;
  teamColor: string;
  games: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  dreamTeamCount: number;
  mvpCount: number;
}

export function OverallPlayerStatsTable() {
  const { isAdmin } = useAuth(); // Получаем статус админа
  const { toast } = useToast();
  const { data: statsData } = usePlayerStatsWithSubstitutions();
  const playerStats = statsData?.stats || [];
  const substitutions = statsData?.substitutions || [];
  const { data: players = [], refetch: refetchPlayers } = usePlayers(); // Добавил refetch
  const { data: teams = [] } = useTeams();
  const { data: allMatches = [] } = useAllMatches();
  const { data: currentSeason } = useCurrentSeason();
  const { data: tourDreamTeams = [] } = useTourDreamTeamsBySeason(currentSeason?.id ?? null);
  const { data: mvpCounts = new Map() } = useMVPCountsBySeason(currentSeason?.id ?? null);

  const [sortBy, setSortBy] = useState<'points' | 'goals' | 'assists' | 'yellowCards' | 'redCards' | 'ownGoals' | 'games'>('points');
  const [isExpanded, setIsExpanded] = useState(false);

  // ФУНКЦИЯ УДАЛЕНИЯ
  const handleDeletePlayer = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить игрока ${name}? Все его данные будут стерты.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: "Игрок удален",
        description: `${name} успешно удален из базы.`,
      });
      
      refetchPlayers(); // Обновляем список мгновенно
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description: error.message,
      });
    }
  };

  // ... (useMemo для dreamTeamCounts, skippedTours, playerGamesMap и aggregatedStats остаются без изменений)
  // [ЗДЕСЬ ВАШ ПРЕЖНИЙ КОД useMemo ДОaggregatedStats]
  
  const dreamTeamCounts = useMemo(() => {
    const counts = new Map<string, number>();
    tourDreamTeams.forEach(dt => {
      if (dt.team_type === 'dream') {
        counts.set(dt.player_id, (counts.get(dt.player_id) || 0) + 1);
      }
    });
    return counts;
  }, [tourDreamTeams]);

  const skippedTours = useMemo(() => {
    const set = new Set<string>();
    substitutions.forEach((sub: any) => {
      set.add(`${sub.original_player_id}_${sub.tour_id}`);
    });
    return set;
  }, [substitutions]);

  const playerGamesMap = useMemo(() => {
    const gamesMap = new Map<string, number>();
    players.forEach((player: any) => {
      if (!player.team_id) return;
      let gamesCount = 0;
      allMatches.forEach((match: any) => {
        if (match.home_team_id === player.team_id || match.away_team_id === player.team_id) {
          if (!skippedTours.has(`${player.id}_${match.tour_id}`)) {
            gamesCount++;
          }
        }
      });
      gamesMap.set(player.id, gamesCount);
    });
    substitutions.forEach((sub: any) => {
      const substituteId = sub.substitute_player_id;
      const tourId = sub.tour_id;
      const originalPlayer = players.find((p: any) => p.id === sub.original_player_id);
      if (originalPlayer?.team_id) {
        const matchesInTour = allMatches.filter((match: any) => 
          match.tour_id === tourId && 
          (match.home_team_id === originalPlayer.team_id || match.away_team_id === originalPlayer.team_id)
        );
        const currentGames = gamesMap.get(substituteId) || 0;
        gamesMap.set(substituteId, currentGames + matchesInTour.length);
      }
    });
    return gamesMap;
  }, [players, allMatches, skippedTours, substitutions]);

  const aggregatedStats = useMemo(() => {
    const statsMap = new Map<string, OverallPlayerStats>();
    playerStats.forEach((stat: any) => {
      const tourId = stat.match?.tour_id;
      if (tourId && skippedTours.has(`${stat.player_id}_${tourId}`)) return;
      const existing = statsMap.get(stat.player_id);
      if (existing) {
        existing.goals += stat.goals || 0;
        existing.assists += stat.assists || 0;
        existing.yellowCards += stat.yellow_cards || 0;
        existing.redCards += stat.red_cards || 0;
        existing.ownGoals += stat.own_goals || 0;
      } else {
        const player = players.find((p: any) => p.id === stat.player_id);
        const team = player?.team_id ? teams.find((t: any) => t.id === player.team_id) : null;
        statsMap.set(stat.player_id, {
          playerId: stat.player_id,
          playerName: player?.name ?? stat.player?.name ?? 'Unknown',
          teamName: team?.name ?? 'Легионер',
          teamColor: team?.color ?? 'muted',
          games: playerGamesMap.get(stat.player_id) || 0,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          yellowCards: stat.yellow_cards || 0,
          redCards: stat.red_cards || 0,
          ownGoals: stat.own_goals || 0,
          dreamTeamCount: dreamTeamCounts.get(stat.player_id) || 0,
          mvpCount: mvpCounts.get(stat.player_id) || 0,
        });
      }
    });
    statsMap.forEach((stats, playerId) => {
      stats.games = playerGamesMap.get(playerId) || 0;
      stats.dreamTeamCount = dreamTeamCounts.get(playerId) || 0;
      stats.mvpCount = mvpCounts.get(playerId) || 0;
    });
    const sorted = Array.from(statsMap.values());
    sorted.sort((a, b) => {
      if (sortBy === 'points') {
        const pointsA = a.goals + a.assists;
        const pointsB = b.goals + b.assists;
        if (pointsB !== pointsA) return pointsB - pointsA;
        return b.goals - a.goals;
      }
      const sortableColumns: Record<string, keyof OverallPlayerStats> = {
        'goals': 'goals', 'assists': 'assists', 'yellowCards': 'yellowCards',
        'redCards': 'redCards', 'ownGoals': 'ownGoals', 'games': 'games',
      };
      const column = sortableColumns[sortBy];
      if (column) {
        const primary = (b[column] as number) - (a[column] as number);
        if (primary !== 0) return primary;
      }
      return b.goals - a.goals || b.assists - a.assists;
    });
    return sorted;
  }, [playerStats, players, teams, dreamTeamCounts, mvpCounts, sortBy, skippedTours, playerGamesMap]);

  const visibleStats = isExpanded ? aggregatedStats : aggregatedStats.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = aggregatedStats.length > INITIAL_VISIBLE_COUNT;

  const getTeamNameClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-team-red';
      case 'blue': return 'text-team-blue';
      case 'green': return 'text-team-green';
      case 'black': return 'text-foreground';
      case 'muted': return 'text-muted-foreground italic';
      default: return 'text-muted-foreground';
    }
  };

  const SortableHeader = ({ column, label }: { column: typeof sortBy; label: string }) => (
    <th 
      className={`text-center py-2 px-1 cursor-pointer hover:text-primary transition-colors ${sortBy === column ? 'text-primary' : ''}`}
      onClick={() => setSortBy(column)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {sortBy === column && <ArrowUpDown className="w-3 h-3" />}
      </span>
    </th>
  );

  return (
    <div className="stat-card">
      <h2 className="text-xl font-bold text-foreground font-mono mb-4">
        Общая статистика игроков
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Игрок</th>
              <th className="text-left py-2 px-2 hidden sm:table-cell">Команда</th>
              <SortableHeader column="games" label="🎮" />
              <SortableHeader column="goals" label="⚽" />
              <SortableHeader column="assists" label="🅰️" />
              <SortableHeader column="points" label="Г+П" />
              <SortableHeader column="ownGoals" label="🔄" />
              <SortableHeader column="yellowCards" label="🟨" />
              <SortableHeader column="redCards" label="🟥" />
              <th className="text-center py-2 px-1">⭐</th>
              <th className="text-center py-2 px-1">🏆</th>
              {isAdmin && <th className="text-center py-2 px-1">⚙️</th>} {/* Колонка админа */}
            </tr>
          </thead>
          <tbody>
            {visibleStats.map((player, idx) => (
              <tr
                key={player.playerId}
                className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <td className="py-2 px-2 text-muted-foreground text-xs font-bold">{idx + 1}</td>
                <td className="py-2 px-2 font-medium text-sm">
                  <span className="block">{player.playerName}</span>
                  <span className={`sm:hidden text-xs ${getTeamNameClass(player.teamColor)}`}>
                    {player.teamName}
                  </span>
                </td>
                <td className={`py-2 px-2 hidden sm:table-cell ${getTeamNameClass(player.teamColor)}`}>
                  {player.teamName}
                </td>
                <td className="text-center py-2 px-1 font-mono text-sm text-muted-foreground">{player.games}</td>
                <td className="text-center py-2 px-1 font-mono font-bold text-primary text-sm">{player.goals}</td>
                <td className="text-center py-2 px-1 font-mono text-sm">{player.assists}</td>
                <td className="text-center py-2 px-1 font-mono font-bold text-primary text-sm">{player.goals + player.assists}</td>
                <td className="text-center py-2 px-1 font-mono text-sm text-orange-500">{player.ownGoals > 0 ? player.ownGoals : '-'}</td>
                <td className="text-center py-2 px-1 font-mono text-sm">{player.yellowCards}</td>
                <td className="text-center py-2 px-1 font-mono text-sm">{player.redCards}</td>
                <td className="text-center py-2 px-1 font-mono text-yellow-500 text-sm">{player.dreamTeamCount > 0 ? player.dreamTeamCount : '-'}</td>
                <td className="text-center py-2 px-1 font-mono text-amber-500 text-sm">{player.mvpCount > 0 ? player.mvpCount : '-'}</td>
                
                {/* Кнопка удаления ТОЛЬКО для админа */}
                {isAdmin && (
                  <td className="text-center py-2 px-1">
                    <button 
                      onClick={() => handleDeletePlayer(player.playerId, player.playerName)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                      title="Удалить игрока"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ... (Кнопка "Показать все" остается прежней) */}
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