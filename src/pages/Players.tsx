import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { usePlayerStatsWithSubstitutions } from '@/hooks/usePlayerStats';
import { useTourDreamTeamsBySeason } from '@/hooks/useTourDreamTeamsBySeason';
import { useSeasons } from '@/hooks/useSeasons';
import { useToursBySeason } from '@/hooks/useTours';
import { useAllMatches } from '@/hooks/useMatches';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Target, Users, Gamepad2 } from 'lucide-react';

interface PlayerSeasonStats {
  seasonId: string;
  seasonName: string;
  games: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  dreamTeamCount: number;
  mvpCount: number;
}

interface PlayerTableData {
  playerId: string;
  name: string;
  photo_url: string;
  team_id: string;
  goals: number;
  assists: number;
  points: number;
  games: number;
  yellowCards: number;
  redCards: number;
  dreamTeamCount: number;
  mvpCount: number;
}

export default function Players() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const { data: players = [] } = usePlayers();
  const { data: teams = [] } = useTeams();
  const { data: statsData } = usePlayerStatsWithSubstitutions();
  const allStats = statsData?.stats || [];
  const substitutions = statsData?.substitutions || [];
  const { data: seasons = [] } = useSeasons();
  const { data: allTourDreamTeams = [] } = useTourDreamTeamsBySeason(null);
  const { data: allMatches = [] } = useAllMatches();
  const { data: allTours = [] } = useToursBySeason(null);

  // Вспомогательная функция для получения пропущенных туров
  const getSkippedTours = (playerId: string) => {
    const set = new Set<string>();
    substitutions.forEach((sub: any) => {
      if (sub.original_player_id === playerId) {
        set.add(sub.tour_id);
      }
    });
    return set;
  };

  // Вспомогательная функция для фильтрации статистики
  const getPlayerStats = (playerId: string) => {
    const skippedTours = getSkippedTours(playerId);
    return allStats.filter((s: any) => {
      if (s.player_id !== playerId) return false;
      const tourId = s.match?.tour_id;
      return !(tourId && skippedTours.has(tourId));
    });
  };

  // Считаем игры для игрока
  const getPlayerGames = (playerId: string) => {
    const player = players.find((p: any) => p.id === playerId);
    const skippedTours = getSkippedTours(playerId);
    
    let gamesCount = 0;
    if (player?.team_id) {
      allMatches.forEach((match: any) => {
        if ((match.home_team_id === player.team_id || match.away_team_id === player.team_id) && !skippedTours.has(match.tour_id)) {
          gamesCount++;
        }
      });
    }
    substitutions.forEach((sub: any) => {
      if (sub.substitute_player_id === playerId) {
        const originalPlayer = players.find((p: any) => p.id === sub.original_player_id);
        if (originalPlayer?.team_id) {
          const matchesInTour = allMatches.filter((match: any) => 
            match.tour_id === sub.tour_id && (match.home_team_id === originalPlayer.team_id || match.away_team_id === originalPlayer.team_id)
          );
          gamesCount += matchesInTour.length;
        }
      }
    });
    return gamesCount;
  };

  // Создаем таблицу с общей статистикой и ранжируем
  const playerTableData = useMemo(() => {
    const data: PlayerTableData[] = players.map((player: any) => {
      const playerStats = getPlayerStats(player.id);
      const goals = playerStats.reduce((sum: number, s: any) => sum + (s.goals || 0), 0);
      const assists = playerStats.reduce((sum: number, s: any) => sum + (s.assists || 0), 0);
      const yellowCards = playerStats.reduce((sum: number, s: any) => sum + (s.yellow_cards || 0), 0);
      const redCards = playerStats.reduce((sum: number, s: any) => sum + (s.red_cards || 0), 0);
      const games = getPlayerGames(player.id);
      const dreamTeamCount = allTourDreamTeams.filter((dt: any) => dt.player_id === player.id && dt.team_type === 'dream').length;
      const mvpCount = allTours.filter((tour: any) => tour.mvp_player_id === player.id).length;

      return {
        playerId: player.id,
        name: player.name,
        photo_url: player.photo_url,
        team_id: player.team_id,
        goals,
        assists,
        points: goals + assists,
        games,
        yellowCards,
        redCards,
        dreamTeamCount,
        mvpCount,
      };
    });

    // Сортируем по Г+П, потом по голам
    return data.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goals - a.goals;
    });
  }, [players, allStats, substitutions, allMatches, allTourDreamTeams, allTours]);

  const selectedPlayer = players.find((p: any) => p.id === selectedPlayerId);
  const selectedPlayerTeam = selectedPlayer ? teams.find((t: any) => t.id === selectedPlayer.team_id) : null;

  const getTeamTextClass = (color: string | null | undefined) => {
    switch (color) {
      case 'red': return 'text-team-red';
      case 'blue': return 'text-team-blue';
      case 'green': return 'text-team-green';
      case 'black': return 'text-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background field-pattern">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {selectedPlayer ? (
          <PlayerProfile 
            player={selectedPlayer} 
            team={selectedPlayerTeam}
            onBack={() => setSelectedPlayerId(null)}
            getTeamTextClass={getTeamTextClass}
            getPlayerStats={getPlayerStats}
            getPlayerGames={getPlayerGames}
          />
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2 hero-gradient py-6">
              <h1 className="text-3xl font-display font-bold text-foreground tracking-wide">
                <Users className="inline w-8 h-8 mr-2 text-primary" />
                Рейтинг игроков
              </h1>
              <p className="text-muted-foreground">
                Список отсортирован по системе Гол + Пас
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary">
                    <th className="px-4 py-3 text-left font-bold text-foreground">Место</th>
                    <th className="px-4 py-3 text-left font-bold text-foreground">Игрок</th>
                    <th className="px-4 py-3 text-left font-bold text-foreground">Команда</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">Игры</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">Голы</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">Пасы</th>
                    <th className="px-4 py-3 text-center font-bold text-primary">Г+П</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">ЖК</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">КК</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">MVP</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">⭐</th>
                  </tr>
                </thead>
                <tbody>
                  {playerTableData.map((playerData, index) => {
                    const team = teams.find((t: any) => t.id === playerData.team_id);

                    return (
                      <tr 
                        key={playerData.playerId}
                        className="border-b border-border hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedPlayerId(playerData.playerId)}
                      >
                        <td className="px-4 py-3 font-bold text-primary">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-primary/30">
                              <AvatarImage src={playerData.photo_url} alt={playerData.name} />
                              <AvatarFallback className="bg-primary/20 font-display text-sm">
                                {playerData.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{playerData.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {team && (
                            <span className={`font-medium ${getTeamTextClass(team.color)}`}>
                              {team.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {playerData.games}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {playerData.goals}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {playerData.assists}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-primary text-lg">
                          {playerData.points}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {playerData.yellowCards}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {playerData.redCards}
                        </td>
                        <td className="px-4 py-3 text-center text-yellow-500 font-bold">
                          {playerData.mvpCount}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {playerData.dreamTeamCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface PlayerProfileProps {
  player: any;
  team: any;
  onBack: () => void;
  getTeamTextClass: (color: string | null | undefined) => string;
  getPlayerStats: (playerId: string) => any[];
  getPlayerGames: (playerId: string) => number;
}

function PlayerProfile({ player, team, onBack, getTeamTextClass, getPlayerStats, getPlayerGames }: PlayerProfileProps) {
  const { data: statsData } = usePlayerStatsWithSubstitutions();
  const { data: allTourDreamTeams = [] } = useTourDreamTeamsBySeason(null);
  const { data: allTours = [] } = useToursBySeason(null);

  // --- РАСЧЕТ Г+П В ПРОФИЛЕ ---
  const stats = useMemo(() => {
    const playerStats = getPlayerStats(player.id);
    
    const goals = playerStats.reduce((sum: number, s: any) => sum + (s.goals || 0), 0);
    const assists = playerStats.reduce((sum: number, s: any) => sum + (s.assists || 0), 0);

    return {
      totalGoals: goals,
      totalAssists: assists,
      totalPoints: goals + assists,
      totalYellowCards: playerStats.reduce((sum: number, s: any) => sum + (s.yellow_cards || 0), 0),
      totalRedCards: playerStats.reduce((sum: number, s: any) => sum + (s.red_cards || 0), 0),
    };
  }, [player.id, getPlayerStats]);

  const totalGames = getPlayerGames(player.id);

  const dreamTeamCount = useMemo(() => {
    return allTourDreamTeams.filter((dt: any) => dt.player_id === player.id && dt.team_type === 'dream').length;
  }, [allTourDreamTeams, player.id]);

  const mvpCount = useMemo(() => {
    return allTours.filter((tour: any) => tour.mvp_player_id === player.id).length;
  }, [allTours, player.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="gap-2 font-display">
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Button>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-48 w-48 border-4 border-primary/50 shadow-2xl">
            <AvatarImage src={player.photo_url} alt={player.name} />
            <AvatarFallback className="text-6xl bg-primary/20 font-display">{player.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-4xl font-display font-bold text-foreground tracking-wide">{player.name}</h2>
            {team && <p className={`text-xl font-medium ${getTeamTextClass(team.color)}`}>{team.name}</p>}
          </div>
        </div>

        <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card border-border border-primary/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-primary">{stats.totalPoints}</p>
              <p className="text-sm font-bold uppercase tracking-tighter">Гол + Пас</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-3xl font-bold text-foreground">{totalGames}</p>
              <p className="text-sm text-muted-foreground">Игр</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-1">⚽</span>
              <p className="text-3xl font-bold text-foreground">{stats.totalGoals}</p>
              <p className="text-sm text-muted-foreground">Голы</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-1">🅰️</span>
              <p className="text-3xl font-bold text-foreground">{stats.totalAssists}</p>
              <p className="text-sm text-muted-foreground">Пасы</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold text-foreground">{mvpCount}</p>
              <p className="text-sm text-muted-foreground">MVP</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-1">⭐</span>
              <p className="text-3xl font-bold text-foreground">{dreamTeamCount}</p>
              <p className="text-sm text-muted-foreground">Сборная тура</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}