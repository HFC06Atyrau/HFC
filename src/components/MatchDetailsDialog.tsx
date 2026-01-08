import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayerStatsByMatch, useCreatePlayerStat, useUpdatePlayerStat, useDeletePlayerStat } from '@/hooks/usePlayerStats';
import { usePlayers } from '@/hooks/usePlayers';
import { useRecalculateMatchScore } from '@/hooks/useUpdateMatchScore';
import { useAuth } from '@/lib/auth';
import { MatchWithTeams } from '@/hooks/useMatches';
import { Trash2, Plus, Edit2, X, Check, Goal } from 'lucide-react';
import { toast } from 'sonner';

interface MatchDetailsDialogProps {
  match: MatchWithTeams | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchDetailsDialog({ match, isOpen, onClose }: MatchDetailsDialogProps) {
  const { isAdmin } = useAuth();
  const { data: stats = [], refetch: refetchStats } = usePlayerStatsByMatch(match?.id ?? null);
  const { data: players = [] } = usePlayers();
  const createStat = useCreatePlayerStat();
  const updateStat = useUpdatePlayerStat();
  const deleteStat = useDeletePlayerStat();
  const recalculateScore = useRecalculateMatchScore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ goals: 0, own_goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayerId, setNewPlayerId] = useState('');
  const [newForm, setNewForm] = useState({ goals: 0, own_goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 });

  if (!match) return null;

  const matchTeamIds = [match.home_team_id, match.away_team_id];
  const matchPlayers = players.filter((p: any) => matchTeamIds.includes(p.team_id));
  const existingPlayerIds = stats.map(s => s.player_id);
  const availablePlayers = matchPlayers.filter((p: any) => !existingPlayerIds.includes(p.id));

  const homeStats = stats.filter(s => s.player?.team_id === match.home_team_id);
  const awayStats = stats.filter(s => s.player?.team_id === match.away_team_id);

  const handleEdit = (stat: any) => {
    setEditingId(stat.id);
    setEditForm({
      goals: stat.goals || 0,
      own_goals: stat.own_goals || 0,
      assists: stat.assists || 0,
      yellow_cards: stat.yellow_cards || 0,
      red_cards: stat.red_cards || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !match) return;
    await updateStat.mutateAsync({ id: editingId, ...editForm });
    await recalculateScore.mutateAsync(match.id);
    setEditingId(null);
    refetchStats();
  };

  const handleDelete = async (statId: string) => {
    if (!match) return;
    await deleteStat.mutateAsync(statId);
    await recalculateScore.mutateAsync(match.id);
    refetchStats();
  };

  const handleAddStat = async () => {
    if (!newPlayerId || !match) {
      toast.error('Выберите игрока');
      return;
    }
    await createStat.mutateAsync({
      match_id: match.id,
      player_id: newPlayerId,
      goals: newForm.goals,
      own_goals: newForm.own_goals,
      assists: newForm.assists,
      yellow_cards: newForm.yellow_cards,
      red_cards: newForm.red_cards,
    });
    await recalculateScore.mutateAsync(match.id);
    setIsAdding(false);
    setNewPlayerId('');
    setNewForm({ goals: 0, own_goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 });
    refetchStats();
  };

  const renderStatRow = (stat: any, isEditing: boolean) => {
    const player = stat.player;
    if (!player) return null;

    if (isEditing && isAdmin) {
      return (
        <div key={stat.id} className="flex items-center gap-2 py-2 px-3 bg-secondary/50 rounded-lg">
          <span className="flex-1 font-medium text-sm">{player.name}</span>
          <div className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <Label className="text-[10px] text-muted-foreground">⚽</Label>
              <Input type="number" min="0" max="2" value={editForm.goals} onChange={e => setEditForm({...editForm, goals: parseInt(e.target.value) || 0})} className="w-12 h-7 text-xs text-center p-1" />
            </div>
            <div className="flex flex-col items-center">
              <Label className="text-[10px] text-muted-foreground">🔄</Label>
              <Input type="number" min="0" max="2" value={editForm.own_goals} onChange={e => setEditForm({...editForm, own_goals: parseInt(e.target.value) || 0})} className="w-12 h-7 text-xs text-center p-1" />
            </div>
            <div className="flex flex-col items-center">
              <Label className="text-[10px] text-muted-foreground">👟</Label>
              <Input type="number" min="0" value={editForm.assists} onChange={e => setEditForm({...editForm, assists: parseInt(e.target.value) || 0})} className="w-12 h-7 text-xs text-center p-1" />
            </div>
            <div className="flex flex-col items-center">
              <Label className="text-[10px] text-muted-foreground">🟨</Label>
              <Input type="number" min="0" value={editForm.yellow_cards} onChange={e => setEditForm({...editForm, yellow_cards: parseInt(e.target.value) || 0})} className="w-12 h-7 text-xs text-center p-1" />
            </div>
            <div className="flex flex-col items-center">
              <Label className="text-[10px] text-muted-foreground">🟥</Label>
              <Input type="number" min="0" value={editForm.red_cards} onChange={e => setEditForm({...editForm, red_cards: parseInt(e.target.value) || 0})} className="w-12 h-7 text-xs text-center p-1" />
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 w-7 p-0 text-green-500">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 w-7 p-0 text-muted-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div key={stat.id} className="flex items-center gap-2 py-2 px-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
        <span className="flex-1 font-medium text-sm">{player.name}</span>
        <div className="flex items-center gap-3 text-xs">
          {stat.goals > 0 && <span className="flex items-center gap-1">⚽ {stat.goals}</span>}
          {stat.own_goals > 0 && <span className="flex items-center gap-1 text-destructive">🔄 {stat.own_goals}</span>}
          {stat.assists > 0 && <span className="flex items-center gap-1">👟 {stat.assists}</span>}
          {stat.yellow_cards > 0 && <span>🟨 {stat.yellow_cards}</span>}
          {stat.red_cards > 0 && <span>🟥 {stat.red_cards}</span>}
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => handleEdit(stat)} className="h-7 w-7 p-0">
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(stat.id)} className="h-7 w-7 p-0 text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTeamStats = (teamStats: any[], teamName: string, teamId: string) => (
    <div className="space-y-2">
      <h4 className="font-display text-sm font-semibold text-foreground/80">{teamName}</h4>
      {teamStats.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Нет статистики</p>
      ) : (
        <div className="space-y-1">
          {teamStats.map(stat => renderStatRow(stat, editingId === stat.id))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-4">
              <span className="font-display text-lg">{match.home_team.name}</span>
              <span className="font-display font-bold text-2xl match-score px-4 py-1 rounded-lg bg-secondary/50">
                {match.home_score} : {match.away_score}
              </span>
              <span className="font-display text-lg">{match.away_team.name}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {renderTeamStats(homeStats, match.home_team.name, match.home_team_id)}
          {renderTeamStats(awayStats, match.away_team.name, match.away_team_id)}
        </div>

        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-border">
            {!isAdding ? (
              <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Добавить статистику игрока
              </Button>
            ) : (
              <div className="space-y-3">
                <Select value={newPlayerId} onValueChange={setNewPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите игрока" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-5 gap-2">
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-1">⚽ Голы</Label>
                    <Input type="number" min="0" max="2" value={newForm.goals} onChange={e => setNewForm({...newForm, goals: parseInt(e.target.value) || 0})} className="text-center" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-1">🔄 Автогол</Label>
                    <Input type="number" min="0" max="2" value={newForm.own_goals} onChange={e => setNewForm({...newForm, own_goals: parseInt(e.target.value) || 0})} className="text-center" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-1">👟 Пасы</Label>
                    <Input type="number" min="0" value={newForm.assists} onChange={e => setNewForm({...newForm, assists: parseInt(e.target.value) || 0})} className="text-center" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-1">🟨 ЖК</Label>
                    <Input type="number" min="0" value={newForm.yellow_cards} onChange={e => setNewForm({...newForm, yellow_cards: parseInt(e.target.value) || 0})} className="text-center" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-1">🟥 КК</Label>
                    <Input type="number" min="0" value={newForm.red_cards} onChange={e => setNewForm({...newForm, red_cards: parseInt(e.target.value) || 0})} className="text-center" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddStat} className="flex-1">Добавить</Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setNewPlayerId(''); }}>Отмена</Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p>⚽ = гол, 🔄 = автогол (засчитывается сопернику), 👟 = голевой пас, 🟨 = жёлтая карточка, 🟥 = красная карточка</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
