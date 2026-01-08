import { useMemo } from 'react';
import { useMatchesBySeason } from '@/hooks/useMatchesBySeason';
import { useTeams, Team } from '@/hooks/useTeams';
import { MatchWithTeams } from '@/hooks/useMatches';

interface OverallTeamStats {
  teamId: string;
  teamName: string;
  teamColor: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

function calculateOverallStats(team: Team, matches: MatchWithTeams[]): OverallTeamStats {
  let won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

  matches.forEach(match => {
    if (match.home_team_id === team.id) {
      goalsFor += match.home_score;
      goalsAgainst += match.away_score;
      if (match.home_score > match.away_score) won++;
      else if (match.home_score === match.away_score) drawn++;
      else lost++;
    } else if (match.away_team_id === team.id) {
      goalsFor += match.away_score;
      goalsAgainst += match.home_score;
      if (match.away_score > match.home_score) won++;
      else if (match.away_score === match.home_score) drawn++;
      else lost++;
    }
  });

  return {
    teamId: team.id,
    teamName: team.name,
    teamColor: team.color ?? 'black',
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

const getTeamNameClass = (color: string) => {
  switch (color) {
    case 'red': return 'text-team-red';
    case 'blue': return 'text-team-blue';
    case 'green': return 'text-team-green';
    case 'black': return 'text-foreground';
    default: return 'text-muted-foreground';
  }
};

interface Props {
  seasonId: string;
}

export function SeasonOverallTeamStats({ seasonId }: Props) {
  const { data: teams = [] } = useTeams();
  const { data: matches = [], isLoading } = useMatchesBySeason(seasonId);

  const overallStats = useMemo(() => {
    return teams
      .map(team => calculateOverallStats(team, matches))
      .filter(stat => stat.played > 0)
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);
  }, [teams, matches]);

  if (isLoading) {
    return (
      <div className="stat-card animate-pulse h-48" />
    );
  }

  if (overallStats.length === 0) {
    return (
      <div className="stat-card">
        <h3 className="text-lg font-bold text-foreground font-mono mb-4">
          Общая статистика команд сезона
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Нет данных для отображения
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h3 className="text-lg font-bold text-foreground font-mono mb-4">
        Общая статистика команд сезона
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-2">#</th>
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
            {overallStats.map((team, idx) => (
              <tr
                key={team.teamId}
                className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                <td className={`py-2 px-2 font-medium ${getTeamNameClass(team.teamColor)}`}>
                  {team.teamName}
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
    </div>
  );
}
