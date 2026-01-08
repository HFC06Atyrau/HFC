import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { useSetTourMVP } from '@/hooks/useTourMVP';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Edit2, Check, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MVPDisplayProps {
  tourId: string | null;
  mvpPlayerId: string | null;
  tourNumber?: number;
}

export function MVPDisplay({ tourId, mvpPlayerId, tourNumber }: MVPDisplayProps) {
  const { isAdmin } = useAuth();
  const { data: players = [] } = usePlayers();
  const { data: teams = [] } = useTeams();
  const setMVP = useSetTourMVP();
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const mvpPlayer = mvpPlayerId ? players.find((p: any) => p.id === mvpPlayerId) : null;
  const mvpTeam = mvpPlayer ? teams.find(t => t.id === mvpPlayer.team_id) : null;

  const getTeamTextClass = (color: string | null | undefined) => {
    switch (color) {
      case 'red': return 'text-team-red';
      case 'blue': return 'text-team-blue';
      case 'green': return 'text-team-green';
      case 'black': return 'text-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const handleStartEdit = () => {
    setSelectedPlayerId(mvpPlayerId || 'none');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tourId) {
      setMVP.mutate({ tourId, playerId: selectedPlayerId === 'none' ? null : selectedPlayerId || null });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedPlayerId(mvpPlayerId || '');
    setIsEditing(false);
  };

  if (!tourId) return null;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 mvp-card rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-7 h-7 text-accent trophy-glow" />
        <span className="text-xl font-display font-bold text-foreground tracking-wide">MVP Тура {tourNumber}</span>
        {isAdmin && !isEditing && (
          <Button size="icon" variant="ghost" onClick={handleStartEdit} className="h-7 w-7">
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={handleSave} disabled={setMVP.isPending} className="h-7 w-7">
              <Check className="w-4 h-4 text-green-500" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel} className="h-7 w-7">
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Выберите MVP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Не выбран</SelectItem>
            {players.map((p: any) => {
              const pTeam = teams.find(t => t.id === p.team_id);
              return (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={p.photo_url} alt={p.name} />
                      <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{p.name}</span>
                    {pTeam && (
                      <span className={`text-xs ${getTeamTextClass(pTeam.color)}`}>
                        ({pTeam.name})
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ) : mvpPlayer ? (
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-28 w-28 border-4 border-accent/60 shadow-xl">
            <AvatarImage src={mvpPlayer.photo_url} alt={mvpPlayer.name} />
            <AvatarFallback className="text-3xl bg-accent/20 font-display">{mvpPlayer.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground tracking-wide">{mvpPlayer.name}</p>
            {mvpTeam && (
              <p className={`text-sm font-medium ${getTeamTextClass(mvpTeam.color)}`}>{mvpTeam.name}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">MVP не выбран</p>
      )}
    </div>
  );
}
