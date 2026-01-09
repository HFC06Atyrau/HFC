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
import { Badge } from '@/components/ui/badge';
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

export default function Players() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const { data: players = [] } = usePlayers();
  const { data: teams = [] } = useTeams();
  const { data: statsData } = usePlayerStatsWithSubstitutions();
  const allStats = statsData?.stats || [];
  const substitutions = statsData?.substitutions || [];
  const { data: seasons = [] } = useSeasons();

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

  // --- ЛОГИКА РАНЖИРОВАНИЯ (СОРТИРОВКА) ---
  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const statsA = getPlayerStats(a.id);
      const statsB = getPlayerStats(b.id);
      
      const pointsA = statsA.reduce((sum: number, s: any) => sum + (s.goals || 0) + (s.assists || 0), 0);
      const pointsB = statsB.reduce((sum: number, s: any) => sum + (s.goals || 0) + (s.assists || 0), 0);

      if (pointsB !== pointsA) return pointsB - pointsA;
      
      const goalsA = statsA.reduce((sum: number, s: any) => sum + (s.goals || 0), 0);
      const goalsB = statsB.reduce((sum: number, s: any) => sum + (s.goals || 0), 0);
      return goalsB - goalsA;
    });
  }, [players, allStats, substitutions]);

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

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {rankedPlayers.map((player: any, index: number) => {
                const team = teams.find((t: any) => t.id === player.team_id);
                const playerStatsForCard = getPlayerStats(player.id);
                const pointsForCard = playerStatsForCard.reduce((sum: number, s: any) => sum + (s.goals || 0) + (s.assists || 0), 0);
                
                return (
                  <Card 
                    key={player.id} 
                    className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    onClick={() => setSelectedPlayerId(player.id)}
                  >
                    {/* Метка с местом в рейтинге */}
                    <div className="absolute top-0 left-0 bg-primary text-primary-foreground px-3 py-1 rounded-br-lg font-bold text-sm z-10">
                      #{index + 1}
                    </div>
                    
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <Avatar className="h-20 w-20 border-2 border-primary/30">
                        <AvatarImage src={player.photo_url} alt={player.name} />
                        <AvatarFallback className="text-2xl bg-primary/20 font-display">
                          {player.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-display font-bold text-foreground tracking-wide">{player.name}</p>
                        {team && (
                          <p className={`text-sm font-medium ${getTeamTextClass(team.color)}`}>
                            {team.name}
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary mt-2">{pointsForCard} Г+П</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
}

function PlayerProfile({ player, team, onBack, getTeamTextClass, getPlayerStats }: PlayerProfileProps) {
  const { data: statsData } = usePlayerStatsWithSubstitutions();
  const allStats = statsData?.stats || [];
  const substitutions = statsData?.substitutions || [];
  const { data: seasons = [] } = useSeasons();
  const { data: allTourDreamTeams = [] } = useTourDreamTeamsBySeason(null);
  const { data: allMatches = [] } = useAllMatches();
  const { data: players = [] } = usePlayers();
  const { data: allTours = [] } = useToursBySeason(null);

  const skippedTours = useMemo(() => {
    const set = new Set<string>();
    substitutions.forEach((sub: any) => {
      if (sub.original_player_id === player.id) {
        set.add(sub.tour_id);
      }
    });
    return set;
  }, [substitutions, player.id]);

  const totalGames = useMemo(() => {
    let gamesCount = 0;
    if (player.team_id) {
      allMatches.forEach((match: any) => {
        if ((match.home_team_id === player.team_id || match.away_team_id === player.team_id) && !skippedTours.has(match.tour_id)) {
          gamesCount++;
        }
      });
    }
    substitutions.forEach((sub: any) => {
      if (sub.substitute_player_id === player.id) {
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
  }, [player.id, player.team_id, allMatches, skippedTours, substitutions, players]);

  // --- РАСЧЕТ Г+П В ПРОФИЛЕ (с использованием единой функции) ---
  const stats = useMemo(() => {
    const playerStats = getPlayerStats(player.id);
    
    const goals = playerStats.reduce((sum: number, s: any) => sum + (s.goals || 0), 0);
    const assists = playerStats.reduce((sum: number, s: any) => sum + (s.assists || 0), 0);

    return {
      totalGoals: goals,
      totalAssists: assists,
      totalPoints: goals + assists, // Г + П
      totalYellowCards: playerStats.reduce((sum: number, s: any) => sum + (s.yellow_cards || 0), 0),
      totalRedCards: playerStats.reduce((sum: number, s: any) => sum + (s.red_cards || 0), 0),
    };
  }, [player.id, getPlayerStats]);

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