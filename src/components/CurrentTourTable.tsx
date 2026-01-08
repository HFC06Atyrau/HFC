import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useTourTeams } from '@/hooks/useTourTeams';
import { useTeams, useUpdateTeamColor } from '@/hooks/useTeams';
import { useMatchesByTour, MatchWithTeams } from '@/hooks/useMatches';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamStats {
  teamId: string;
  teamName: string;
  color: string;
  tourTeamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

function calculateTeamStats(
  teamId: string,
  teamName: string,
  color: string,
  tourTeamId: string,
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
    tourTeamId,
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

const COLORS = [
  { value: 'red', label: 'Красный', className: 'bg-team-red' },
  { value: 'blue', label: 'Синий', className: 'bg-team-blue' },
  { value: 'green', label: 'Зелёный', className: 'bg-team-green' },
  { value: 'black', label: 'Чёрный', className: 'bg-team-black' },
];

interface CurrentTourTableProps {
  tourId: string | null;
}

export function CurrentTourTable({ tourId }: CurrentTourTableProps) {
  const { isAdmin } = useAuth();
  const { data: tourTeams = [] } = useTourTeams(tourId);
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatchesByTour(tourId);
  const updateColor = useUpdateTeamColor();

  const teamStats = useMemo(() => {
    return tourTeams
      .map(tt => {
        const team = teams.find(t => t.id === tt.team_id);
        const color = team?.color ?? 'black';
        return calculateTeamStats(tt.team_id, tt.team.name, color, tt.id, matches);
      })
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);
  }, [tourTeams, matches, teams]);

  const getTeamNameClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-team-red px-2 py-0.5 rounded';
      case 'blue': return 'bg-team-blue px-2 py-0.5 rounded';
      case 'green': return 'bg-team-green px-2 py-0.5 rounded';
      case 'black': return 'bg-team-black text-foreground px-2 py-0.5 rounded';
      default: return '';
    }
  };

  if (!tourId) {
    return (
      <div className="stat-card">
        <h2 className="text-xl font-display font-bold text-foreground tracking-wide mb-4">
          Таблица тура
        </h2>
        <p className="text-muted-foreground text-center py-8">
          Создайте или выберите тур
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h2 className="text-xl font-display font-bold text-foreground tracking-wide mb-4">
        Таблица тура
      </h2>

      {teamStats.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Добавьте команды в тур
        </p>
      ) : (
        <div className="overflow-x-auto football-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 px-3 font-display tracking-wide">Команда</th>
                <th className="text-center py-3 px-1 font-display">И</th>
                <th className="text-center py-3 px-1 font-display">В</th>
                <th className="text-center py-3 px-1 font-display">Н</th>
                <th className="text-center py-3 px-1 font-display">П</th>
                <th className="text-center py-3 px-1 font-display">ГЗ</th>
                <th className="text-center py-3 px-1 font-display">ГП</th>
                <th className="text-center py-3 px-1 font-display">Разн</th>
                <th className="text-center py-3 px-1 font-display text-primary">Очки</th>
                {isAdmin && <th className="w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {teamStats.map((team) => (
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
                  {isAdmin && (
                    <td className="py-2 px-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Palette className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {COLORS.map(color => (
                            <DropdownMenuItem
                              key={color.value}
                              onClick={() => updateColor.mutate({ id: team.teamId, color: color.value })}
                              className="gap-2"
                            >
                              <div className={`w-4 h-4 rounded ${color.className}`} />
                              {color.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
