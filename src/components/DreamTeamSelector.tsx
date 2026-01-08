import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Star, ThumbsDown, Edit2 } from 'lucide-react';
import { FutsalFormation } from '@/components/FutsalFormation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const POSITION_LABELS = ['ВР', 'ЗАЩ', 'ЗАЩ', 'НАП', 'НАП'];

interface DreamTeamSelectorProps {
  title: string;
  type: 'dream' | 'anti';
  selectedPlayerIds: string[];
  onSave: (playerIds: string[]) => void;
  isPending?: boolean;
}

export function DreamTeamSelector({
  title,
  type,
  selectedPlayerIds,
  onSave,
  isPending,
}: DreamTeamSelectorProps) {
  const { isAdmin } = useAuth();
  const { data: players = [] } = usePlayers();
  const { data: teams = [] } = useTeams();
  
  const [isEditing, setIsEditing] = useState(false);
  const [localSelection, setLocalSelection] = useState<string[]>([]);

  useEffect(() => {
    setLocalSelection(selectedPlayerIds);
  }, [selectedPlayerIds]);

  const handleStartEdit = () => {
    setLocalSelection(selectedPlayerIds);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(localSelection);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalSelection(selectedPlayerIds);
    setIsEditing(false);
  };

  const handleSelectPlayer = (position: number, playerId: string) => {
    const newSelection = [...localSelection];
    // Remove player if already selected at different position
    const existingIndex = newSelection.indexOf(playerId);
    if (existingIndex !== -1 && existingIndex !== position) {
      newSelection[existingIndex] = '';
    }
    newSelection[position] = playerId;
    setLocalSelection(newSelection);
  };

  const getTeamTextClass = (color: string | null | undefined) => {
    switch (color) {
      case 'red': return 'text-team-red';
      case 'blue': return 'text-team-blue';
      case 'green': return 'text-team-green';
      case 'black': return 'text-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const icon = type === 'dream' ? (
    <Star className="w-5 h-5 text-yellow-500" />
  ) : (
    <ThumbsDown className="w-5 h-5 text-destructive" />
  );

  const displayPlayers = isEditing ? localSelection : selectedPlayerIds;

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-bold text-foreground font-mono">{title}</h3>
        </div>
        
        {isAdmin && !isEditing && (
          <Button size="sm" variant="ghost" onClick={handleStartEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSave} 
              disabled={isPending}
            >
              <Check className="w-4 h-4 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((position) => {
            const playerId = localSelection[position];
            const player = playerId ? players.find((p: any) => p.id === playerId) : null;

            return (
              <div 
                key={position} 
                className="flex items-center gap-3 py-2 px-3 bg-secondary/30 rounded-lg"
              >
                <span className="w-10 text-center font-mono text-muted-foreground font-bold">
                  {POSITION_LABELS[position]}
                </span>
                
                <Select
                  value={localSelection[position] || ''}
                  onValueChange={(value) => handleSelectPlayer(position, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите игрока" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((p: any) => {
                      const pTeam = teams.find(t => t.id === p.team_id);
                      const isSelected = localSelection.includes(p.id) && localSelection[position] !== p.id;
                      return (
                        <SelectItem 
                          key={p.id} 
                          value={p.id}
                          disabled={isSelected}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={p.photo_url} alt={p.name} />
                              <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className={isSelected ? 'text-muted-foreground' : ''}>
                              {p.name}
                            </span>
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
              </div>
            );
          })}
        </div>
      ) : (
        <FutsalFormation 
          playerIds={displayPlayers} 
          title={title} 
          type={type} 
        />
      )}
    </div>
  );
}
