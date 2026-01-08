import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useSeasons, useCurrentSeason, useCreateSeason, useUpdateSeasonName, useSetCurrentSeason, Season } from '@/hooks/useSeasons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Check, X, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SeasonManager() {
  const { isAdmin } = useAuth();
  const { data: seasons = [] } = useSeasons();
  const { data: currentSeason, isLoading } = useCurrentSeason();
  const createSeason = useCreateSeason();
  const updateSeasonName = useUpdateSeasonName();
  const setCurrentSeason = useSetCurrentSeason();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const handleStartEdit = () => {
    setEditName(currentSeason?.name ?? '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (currentSeason && editName.trim()) {
      updateSeasonName.mutate({ id: currentSeason.id, name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleCreateSeason = () => {
    createSeason.mutate('Новый сезон');
  };

  const handleSeasonChange = (seasonId: string) => {
    if (seasonId !== currentSeason?.id) {
      setCurrentSeason.mutate(seasonId);
    }
  };

  if (isLoading) {
    return <div className="h-10 bg-secondary/50 rounded animate-pulse" />;
  }

  if (!currentSeason) {
    return (
      <div className="flex items-center justify-center gap-4 py-4 bg-secondary/30 rounded-lg">
        <p className="text-muted-foreground">Сезон не создан</p>
        {isAdmin && (
          <Button onClick={handleCreateSeason} disabled={createSeason.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            Создать сезон
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 flex-wrap">
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-secondary border-border text-xl font-bold max-w-xs"
            autoFocus
          />
          <Button size="icon" variant="ghost" onClick={handleSave} disabled={updateSeasonName.isPending}>
            <Check className="w-4 h-4 text-green-500" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel}>
            <X className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <>
          {isAdmin && seasons.length > 1 ? (
            <Select value={currentSeason.id} onValueChange={handleSeasonChange}>
              <SelectTrigger className="w-auto min-w-[200px] text-2xl font-bold text-primary border-none bg-transparent h-auto py-0 px-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} {season.is_current && '(текущий)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <h2 className="text-2xl font-bold text-primary">{currentSeason.name}</h2>
          )}
          {isAdmin && (
            <Button size="icon" variant="ghost" onClick={handleStartEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </>
      )}
      
      {isAdmin && !isEditing && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCreateSeason} 
          disabled={createSeason.isPending}
          className="ml-auto"
        >
          <Plus className="w-4 h-4 mr-1" />
          Новый сезон
        </Button>
      )}
    </div>
  );
}
