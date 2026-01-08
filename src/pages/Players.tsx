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

  // Compute stats for selected player across all seasons
  const playerSeasonStats = useMemo(() => {
    if (!selectedPlayerId) return [];
    
    const statsPerSeason: PlayerSeasonStats[] = [];
    
    seasons.forEach(season => {
      const seasonStats = allStats.filter((s: any) => {
        if (s.player_id !== selectedPlayerId) return false;
        // We need to check if the match's tour belongs to this season
        return s.match?.tour_id;
      });
      
      // We'll compute this properly after fetching tours
      const stats: PlayerSeasonStats = {
        seasonId: season.id,
        seasonName: season.name,
        games: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        dreamTeamCount: 0,
        mvpCount: 0,
      };
      
      statsPerSeason.push(stats);
    });
    
    return statsPerSeason;
  }, [selectedPlayerId, seasons, allStats]);

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
          />
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2 hero-gradient py-6">
              <h1 className="text-3xl font-display font-bold text-foreground tracking-wide">
                <Users className="inline w-8 h-8 mr-2 text-primary" />
                Профили игроков
              </h1>
              <p className="text-muted-foreground">
                Выберите игрока для просмотра статистики
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {players.map((player: any) => {
                const team = teams.find((t: any) => t.id === player.team_id);
                return (
                  <Card 
                    key={player.id} 
                    className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                    onClick={() => setSelectedPlayerId(player.id)}
                  >
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
}

function PlayerProfile({ player, team, onBack, getTeamTextClass }: PlayerProfileProps) {
  const { data: statsData } = usePlayerStatsWithSubstitutions();
  const allStats = statsData?.stats || [];
  const substitutions = statsData?.substitutions || [];
  const { data: seasons = [] } = useSeasons();
  const { data: allTourDreamTeams = [] } = useTourDreamTeamsBySeason(null);
  const { data: allMatches = [] } = useAllMatches();
  const { data: players = [] } = usePlayers();
  
  // Fetch all tours to count MVPs
  const allToursData = seasons.flatMap(s => s.id);
  const { data: allTours = [] } = useToursBySeason(null);

  // Build set of skipped tours for this player
  const skippedTours = useMemo(() => {
    const set = new Set<string>();
    substitutions.forEach((sub: any) => {
      if (sub.original_player_id === player.id) {
        set.add(sub.tour_id);
      }
    });
    return set;
  }, [substitutions, player.id]);

  // Calculate games count based on team matches (1 match = 1 game)
  const totalGames = useMemo(() => {
    let gamesCount = 0;

    if (player.team_id) {
      // Regular player: count matches where their team participated
      allMatches.forEach((match: any) => {
        if (match.home_team_id === player.team_id || match.away_team_id === player.team_id) {
          // Check if player was not substituted for this tour
          if (!skippedTours.has(match.tour_id)) {
            gamesCount++;
          }
        }
      });
    }

    // For legionnaires: count games where they substituted someone
    substitutions.forEach((sub: any) => {
      if (sub.substitute_player_id === player.id) {
        const originalPlayer = players.find((p: any) => p.id === sub.original_player_id);
        if (originalPlayer?.team_id) {
          const matchesInTour = allMatches.filter((match: any) => 
            match.tour_id === sub.tour_id && 
            (match.home_team_id === originalPlayer.team_id || match.away_team_id === originalPlayer.team_id)
          );
          gamesCount += matchesInTour.length;
        }
      }
    });

    return gamesCount;
  }, [player.id, player.team_id, allMatches, skippedTours, substitutions, players]);

  // Calculate other stats, excluding skipped tours
  const stats = useMemo(() => {
    const playerStats = allStats.filter((s: any) => {
      if (s.player_id !== player.id) return false;
      const tourId = s.match?.tour_id;
      // Exclude stats from tours the player skipped
      if (tourId && skippedTours.has(tourId)) return false;
      return true;
    });
    
    return {
      totalGoals: playerStats.reduce((sum: number, s: any) => sum + (s.goals || 0), 0),
      totalAssists: playerStats.reduce((sum: number, s: any) => sum + (s.assists || 0), 0),
      totalYellowCards: playerStats.reduce((sum: number, s: any) => sum + (s.yellow_cards || 0), 0),
      totalRedCards: playerStats.reduce((sum: number, s: any) => sum + (s.red_cards || 0), 0),
    };
  }, [allStats, player.id, skippedTours]);

  // Dream team appearances
  const dreamTeamCount = useMemo(() => {
    return allTourDreamTeams.filter((dt: any) => dt.player_id === player.id && dt.team_type === 'dream').length;
  }, [allTourDreamTeams, player.id]);

  // MVP count - how many times this player was MVP of a tour
  const mvpCount = useMemo(() => {
    return allTours.filter((tour: any) => tour.mvp_player_id === player.id).length;
  }, [allTours, player.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="gap-2 font-display">
        <ArrowLeft className="w-4 h-4" />
        Назад к списку
      </Button>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        {/* Player Photo */}
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-48 w-48 border-4 border-primary/50 shadow-2xl">
            <AvatarImage src={player.photo_url} alt={player.name} />
            <AvatarFallback className="text-6xl bg-primary/20 font-display">
              {player.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-4xl font-display font-bold text-foreground tracking-wide">{player.name}</h2>
            {team && (
              <p className={`text-xl font-medium ${getTeamTextClass(team.color)}`}>
                {team.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-foreground">{totalGames}</p>
              <p className="text-sm text-muted-foreground">Игр сыграно</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl">⚽</span>
              <p className="text-3xl font-bold text-foreground">{stats.totalGoals}</p>
              <p className="text-sm text-muted-foreground">Голов забито</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl">🅰️</span>
              <p className="text-3xl font-bold text-foreground">{stats.totalAssists}</p>
              <p className="text-sm text-muted-foreground">Голевых передач</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl">🟨</span>
              <p className="text-3xl font-bold text-foreground">{stats.totalYellowCards}</p>
              <p className="text-sm text-muted-foreground">Жёлтых карточек</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl">🟥</span>
              <p className="text-3xl font-bold text-foreground">{stats.totalRedCards}</p>
              <p className="text-sm text-muted-foreground">Красных карточек</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl">⭐</span>
              <p className="text-3xl font-bold text-foreground">{dreamTeamCount}</p>
              <p className="text-sm text-muted-foreground">В сборной тура</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <span className="text-3xl">🏆</span>
              <p className="text-3xl font-bold text-foreground">{mvpCount}</p>
              <p className="text-sm text-muted-foreground">MVP тура</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
