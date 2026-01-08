import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FutsalFormationProps {
  playerIds: string[];
  title: string;
  type: 'dream' | 'anti';
}

const POSITIONS = [
  { label: 'ВР', row: 0 },
  { label: 'ЗАЩ', row: 1 },
  { label: 'ЗАЩ', row: 1 },
  { label: 'НАП', row: 2 },
  { label: 'НАП', row: 2 },
];

export function FutsalFormation({ playerIds, title, type }: FutsalFormationProps) {
  const { data: players = [] } = usePlayers();
  const { data: teams = [] } = useTeams();

  const getTeamTextClass = (color: string | null | undefined) => {
    switch (color) {
      case 'red': return 'text-team-red';
      case 'blue': return 'text-team-blue';
      case 'green': return 'text-team-green';
      case 'black': return 'text-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPlayer = (playerId: string) => {
    const player = players.find((p: any) => p.id === playerId);
    if (!player) return null;
    const team = teams.find(t => t.id === player.team_id);
    return { ...player, team };
  };

  // Group by rows: 0 = GK, 1 = DEF, 2 = FWD
  const gkPlayer = getPlayer(playerIds[0]);
  const defPlayers = [getPlayer(playerIds[1]), getPlayer(playerIds[2])];
  const fwdPlayers = [getPlayer(playerIds[3]), getPlayer(playerIds[4])];

  const borderColor = type === 'dream' ? 'border-yellow-500/50' : 'border-destructive/50';
  const bgColor = type === 'dream' ? 'bg-yellow-500/10' : 'bg-destructive/10';

  const PlayerCard = ({ player, position }: { player: any; position: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-xs font-bold text-muted-foreground mb-1`}>{position}</div>
      {player ? (
        <>
          <Avatar className={`h-14 w-14 border-2 ${borderColor}`}>
            <AvatarImage src={player.photo_url} alt={player.name} />
            <AvatarFallback className={`${bgColor} text-sm`}>{player.name[0]}</AvatarFallback>
          </Avatar>
          <p className="text-xs font-medium text-center max-w-[80px] truncate">{player.name}</p>
          {player.team && (
            <p className={`text-[10px] ${getTeamTextClass(player.team.color)}`}>{player.team.name}</p>
          )}
        </>
      ) : (
        <>
          <Avatar className={`h-14 w-14 border-2 border-dashed border-muted-foreground/30`}>
            <AvatarFallback className="bg-muted/30 text-muted-foreground text-sm">?</AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground">Не выбран</p>
        </>
      )}
    </div>
  );

  return (
    <div className="relative py-4">
      {/* Field background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 to-green-800/10 rounded-xl border border-green-800/30" />
      
      <div className="relative space-y-4 py-4">
        {/* Forwards (top) */}
        <div className="flex justify-center gap-8">
          <PlayerCard player={fwdPlayers[0]} position="НАП" />
          <PlayerCard player={fwdPlayers[1]} position="НАП" />
        </div>

        {/* Defenders (middle) */}
        <div className="flex justify-center gap-8">
          <PlayerCard player={defPlayers[0]} position="ЗАЩ" />
          <PlayerCard player={defPlayers[1]} position="ЗАЩ" />
        </div>

        {/* Goalkeeper (bottom) */}
        <div className="flex justify-center">
          <PlayerCard player={gkPlayer} position="ВР" />
        </div>
      </div>
    </div>
  );
}
