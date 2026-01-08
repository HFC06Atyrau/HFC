import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { useSeasons, useSetCurrentSeason, Season } from '@/hooks/useSeasons';
import { useToursBySeason, Tour } from '@/hooks/useTours';
import { useTourTeams } from '@/hooks/useTourTeams';
import { useTeams } from '@/hooks/useTeams';
import { useMatchesByTour, MatchWithTeams } from '@/hooks/useMatches';
import { usePlayerStatsByTour } from '@/hooks/usePlayerStats';
import { usePlayers } from '@/hooks/usePlayers';
import { useTourDreamTeam, useSeasonDreamTeam, useSetTourDreamTeam, useSetSeasonDreamTeam } from '@/hooks/useDreamTeams';
import { DreamTeamSelector } from '@/components/DreamTeamSelector';
import { SeasonOverallTeamStats } from '@/components/SeasonOverallTeamStats';
import { History as HistoryIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  teamName: string;
  teamColor: string;
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

function TourDreamTeamsHistory({ tour }: { tour: Tour }) {
  const { data: dreamTeam = [] } = useTourDreamTeam(tour.id, 'dream');
  const { data: antiTeam = [] } = useTourDreamTeam(tour.id, 'anti');
  const setDreamTeam = useSetTourDreamTeam();

  const dreamPlayerIds = useMemo(() => {
    const ids = new Array(5).fill('');
    dreamTeam.forEach(dt => {
      if (dt.position >= 1 && dt.position <= 5) {
        ids[dt.position - 1] = dt.player_id;
      }
    });
    return ids;
  }, [dreamTeam]);

  const antiPlayerIds = useMemo(() => {
    const ids = new Array(5).fill('');
    antiTeam.forEach(dt => {
      if (dt.position >= 1 && dt.position <= 5) {
        ids[dt.position - 1] = dt.player_id;
      }
    });
    return ids;
  }, [antiTeam]);

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-6">
      <DreamTeamSelector
        title="Сборная тура"
        type="dream"
        selectedPlayerIds={dreamPlayerIds}
        onSave={(playerIds) => setDreamTeam.mutate({ 
          tourId: tour.id, 
          teamType: 'dream', 
          playerIds: playerIds.filter(Boolean) 
        })}
        isPending={setDreamTeam.isPending}
      />
      <DreamTeamSelector
        title="Антисборная тура"
        type="anti"
        selectedPlayerIds={antiPlayerIds}
        onSave={(playerIds) => setDreamTeam.mutate({ 
          tourId: tour.id, 
          teamType: 'anti', 
          playerIds: playerIds.filter(Boolean) 
        })}
        isPending={setDreamTeam.isPending}
      />
    </div>
  );
}

function SeasonDreamTeamsHistory({ season }: { season: Season }) {
  const { data: dreamTeam = [] } = useSeasonDreamTeam(season.id, 'dream');
  const { data: antiTeam = [] } = useSeasonDreamTeam(season.id, 'anti');
  const setDreamTeam = useSetSeasonDreamTeam();

  const dreamPlayerIds = useMemo(() => {
    const ids = new Array(5).fill('');
    dreamTeam.forEach(dt => {
      if (dt.position >= 1 && dt.position <= 5) {
        ids[dt.position - 1] = dt.player_id;
      }
    });
    return ids;
  }, [dreamTeam]);

  const antiPlayerIds = useMemo(() => {
    const ids = new Array(5).fill('');
    antiTeam.forEach(dt => {
      if (dt.position >= 1 && dt.position <= 5) {
        ids[dt.position - 1] = dt.player_id;
      }
    });
    return ids;
  }, [antiTeam]);

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-6">
      <DreamTeamSelector
        title="Сборная сезона"
        type="dream"
        selectedPlayerIds={dreamPlayerIds}
        onSave={(playerIds) => setDreamTeam.mutate({ 
          seasonId: season.id, 
          teamType: 'dream', 
          playerIds: playerIds.filter(Boolean) 
        })}
        isPending={setDreamTeam.isPending}
      />
      <DreamTeamSelector
        title="Антисборная сезона"
        type="anti"
        selectedPlayerIds={antiPlayerIds}
        onSave={(playerIds) => setDreamTeam.mutate({ 
          seasonId: season.id, 
          teamType: 'anti', 
          playerIds: playerIds.filter(Boolean) 
        })}
        isPending={setDreamTeam.isPending}
      />
    </div>
  );
}

function TourDetails({ tour }: { tour: Tour }) {
  const { data: tourTeams = [] } = useTourTeams(tour.id);
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatchesByTour(tour.id);
  const { data: playerStats = [] } = usePlayerStatsByTour(tour.id);
  const { data: players = [] } = usePlayers();

  const teamStats = useMemo(() => {
    return tourTeams
      .map(tt => {
        const team = teams.find(t => t.id === tt.team_id);
        const color = team?.color ?? 'black';
        return calculateTeamStats(tt.team_id, tt.team.name, color, matches);
      })
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);
  }, [tourTeams, matches, teams]);

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
        const team = teams.find((t: any) => t.id === player?.team_id);
        statsMap.set(stat.player_id, {
          playerId: stat.player_id,
          playerName: player?.name ?? 'Unknown',
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

  const getTeamNameClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-team-red px-2 py-0.5 rounded';
      case 'blue': return 'bg-team-blue px-2 py-0.5 rounded';
      case 'green': return 'bg-team-green px-2 py-0.5 rounded';
      case 'black': return 'bg-team-black text-foreground px-2 py-0.5 rounded';
      default: return '';
    }
  };

  const getTeamTextClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-team-red';
      case 'blue': return 'text-team-blue';
      case 'green': return 'text-team-green';
      case 'black': return 'text-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Table */}
        <div className="stat-card">
          <h3 className="text-lg font-bold text-foreground font-mono mb-4">
            Таблица команд
          </h3>
          {teamStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет данных</p>
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
                      className="border-b border-border/50 transition-colors"
                    >
                      <td className="py-2 px-2 font-medium">
                        <span className={getTeamNameClass(team.color)}>{team.teamName}</span>
                      </td>
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
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Матчи тура</h4>
              <div className="space-y-2">
                {matches.map(match => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg text-sm"
                  >
                    <span className="flex-1 text-right truncate font-medium">{match.home_team.name}</span>
                    <span className="mx-3 font-mono font-bold text-primary text-lg">
                      {match.home_score}:{match.away_score}
                    </span>
                    <span className="flex-1 text-left truncate font-medium">{match.away_team.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player Stats */}
        <div className="stat-card">
          <h3 className="text-lg font-bold text-foreground font-mono mb-4">
            Статистика игроков
          </h3>
          {aggregatedPlayerStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет данных</p>
          ) : (
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
                  {aggregatedPlayerStats.map((player, idx) => (
                    <tr
                      key={player.playerId}
                      className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium">{player.playerName}</td>
                      <td className={`py-2 px-2 ${getTeamTextClass(player.teamColor)}`}>
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
          )}
        </div>
      </div>
      
      {/* Tour Dream Teams */}
      <TourDreamTeamsHistory tour={tour} />
    </div>
  );
}

function SeasonDetails({ season }: { season: Season }) {
  const { isAdmin } = useAuth();
  const { data: tours = [], isLoading: toursLoading } = useToursBySeason(season.id);
  const setCurrentSeason = useSetCurrentSeason();
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  const selectedTour = useMemo(() => {
    if (!selectedTourId) return null;
    return tours.find(t => t.id === selectedTourId) || null;
  }, [tours, selectedTourId]);

  if (toursLoading) {
    return <div className="stat-card animate-pulse h-64" />;
  }

  return (
    <div className="space-y-6">
      {/* Overall Team Stats for Season */}
      <SeasonOverallTeamStats seasonId={season.id} />

      <div className="flex flex-wrap items-center gap-4">
        {tours.length > 0 && (
          <Select
            value={selectedTourId || ''}
            onValueChange={(value) => setSelectedTourId(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите тур" />
            </SelectTrigger>
            <SelectContent>
              {tours.map(tour => (
                <SelectItem key={tour.id} value={tour.id}>
                  Тур {tour.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isAdmin && !season.is_current && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSeason.mutate(season.id)}
            disabled={setCurrentSeason.isPending}
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Сделать текущим
          </Button>
        )}
      </div>

      {tours.length === 0 ? (
        <div className="stat-card text-center py-12">
          <p className="text-muted-foreground">В этом сезоне нет туров</p>
        </div>
      ) : selectedTour ? (
        <TourDetails tour={selectedTour} />
      ) : (
        <div className="stat-card text-center py-12">
          <p className="text-muted-foreground">Выберите тур из списка</p>
        </div>
      )}
      
      {/* Season Dream Teams */}
      <SeasonDreamTeamsHistory season={season} />
    </div>
  );
}

const History = () => {
  const { data: seasons = [], isLoading } = useSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  // Show all seasons sorted by created_at (newest first)
  const allSeasons = useMemo(() => {
    return seasons.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [seasons]);

  // Find the last non-current season (completed season)
  const defaultSeasonId = useMemo(() => {
    const nonCurrentSeasons = allSeasons.filter(s => !s.is_current);
    return nonCurrentSeasons.length > 0 ? nonCurrentSeasons[0].id : (allSeasons[0]?.id ?? null);
  }, [allSeasons]);

  // Auto-select default season on load
  useEffect(() => {
    if (!selectedSeasonId && defaultSeasonId) {
      setSelectedSeasonId(defaultSeasonId);
    }
  }, [defaultSeasonId, selectedSeasonId]);

  const selectedSeason = useMemo(() => {
    if (!selectedSeasonId) return null;
    return allSeasons.find(s => s.id === selectedSeasonId) || null;
  }, [allSeasons, selectedSeasonId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-mono">
                История сезонов
              </h1>
              <p className="text-sm text-muted-foreground">
                Просмотр и редактирование всех сезонов
              </p>
            </div>
          </div>

          {/* Season Selector */}
          {!isLoading && allSeasons.length > 0 && (
            <Select
              value={selectedSeasonId || ''}
              onValueChange={(value) => setSelectedSeasonId(value)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Выберите сезон" />
              </SelectTrigger>
              <SelectContent>
                {allSeasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} {season.is_current && '(текущий)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="stat-card animate-pulse h-64" />
        ) : allSeasons.length === 0 ? (
          <div className="stat-card text-center py-12">
            <p className="text-muted-foreground">Сезонов пока нет</p>
          </div>
        ) : selectedSeason ? (
          <SeasonDetails season={selectedSeason} />
        ) : (
          <div className="stat-card text-center py-12">
            <p className="text-muted-foreground">Выберите сезон из списка выше</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>HFC Football Stats © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default History;
