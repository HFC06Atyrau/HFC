import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useTeams, useCreateTeam, useDeleteTeam } from '@/hooks/useTeams';
import { useTourTeams, useAddTeamToTour, useRemoveTeamFromTour } from '@/hooks/useTourTeams';
import { usePlayers, useCreatePlayer, useDeletePlayer, useUpdatePlayer } from '@/hooks/usePlayers';
import { useMatchesByTour, useCreateMatch, useDeleteMatch } from '@/hooks/useMatches';
import { useCreatePlayerStat } from '@/hooks/usePlayerStats';
import { useRecalculateMatchScore } from '@/hooks/useUpdateMatchScore';
import { useUpdateTourVideo } from '@/hooks/useTourVideo';
import { useUploadPlayerPhoto, useDeletePlayerPhoto, useUpdatePlayerPhoto } from '@/hooks/usePlayerPhotoManagement';
import { useToursBySeason } from '@/hooks/useTours';
import { useCurrentSeason } from '@/hooks/useSeasons';
import { useTourSubstitutions, useCreateTourSubstitution, useDeleteTourSubstitution } from '@/hooks/useTourSubstitutions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Users, Target, UserPlus, Video, Camera, Edit2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schemas
const teamNameSchema = z.string()
  .trim()
  .min(2, 'Название команды должно содержать минимум 2 символа')
  .max(50, 'Название команды не должно превышать 50 символов')
  .regex(/^[a-zA-Zа-яА-ЯёЁ0-9\s\-]+$/, 'Только буквы, цифры, пробелы и дефисы');

const playerNameSchema = z.string()
  .trim()
  .min(2, 'Имя игрока должно содержать минимум 2 символа')
  .max(50, 'Имя игрока не должно превышать 50 символов')
  .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-\.]+$/, 'Только буквы, пробелы, дефисы и точки');

const playerStatSchema = z.object({
  goals: z.number().min(0).max(2, 'Максимум 2 гола'),
  own_goals: z.number().min(0).max(2, 'Максимум 2 автогола'),
  assists: z.number().min(0).max(5, 'Максимум 5 ассистов'),
  yellow_cards: z.number().min(0).max(2, 'Максимум 2 жёлтые карточки'),
  red_cards: z.number().min(0).max(1, 'Максимум 1 красная карточка'),
});

const youtubeUrlSchema = z.string()
  .trim()
  .refine(
    (val) => val === '' || /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/.test(val),
    'Некорректная ссылка на YouTube'
  )
  .optional()
  .or(z.literal(''));

interface AdminPanelProps {
  tourId: string | null;
}

export function AdminPanel({ tourId }: AdminPanelProps) {
  const { isAdmin } = useAuth();
  const { data: currentSeason } = useCurrentSeason();
  const { data: tours = [] } = useToursBySeason(currentSeason?.id ?? null);
  const { data: teams = [] } = useTeams();
  const { data: tourTeams = [] } = useTourTeams(tourId);
  const { data: players = [] } = usePlayers();
  const { data: matches = [] } = useMatchesByTour(tourId);
  const { data: substitutions = [] } = useTourSubstitutions(tourId);

  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const addTeamToTour = useAddTeamToTour();
  const removeTeamFromTour = useRemoveTeamFromTour();
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const updatePlayer = useUpdatePlayer();
  const createMatch = useCreateMatch();
  const deleteMatch = useDeleteMatch();
  const createPlayerStat = useCreatePlayerStat();
  const recalculateScore = useRecalculateMatchScore();
  const updateTourVideo = useUpdateTourVideo();
  const uploadPlayerPhoto = useUploadPlayerPhoto();
  const deletePlayerPhoto = useDeletePlayerPhoto();
  const updatePlayerPhoto = useUpdatePlayerPhoto();
  const createSubstitution = useCreateTourSubstitution();
  const deleteSubstitution = useDeleteTourSubstitution();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalPlayerId, setOriginalPlayerId] = useState('');
  const [substitutePlayerId, setSubstitutePlayerId] = useState('');
  const [selectedPlayerForPhoto, setSelectedPlayerForPhoto] = useState('');
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState('');
  const [editPlayerTeam, setEditPlayerTeam] = useState('');

  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState('');
  const [selectedTeamForTour, setSelectedTeamForTour] = useState('');
  
  // Match form (no score - auto-calculated)
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  
  // Player stat form
  const [statMatchId, setStatMatchId] = useState('');
  const [statPlayerId, setStatPlayerId] = useState('');
  const [statGoals, setStatGoals] = useState('0');
  const [statOwnGoals, setStatOwnGoals] = useState('0');
  const [statAssists, setStatAssists] = useState('0');
  const [statYellow, setStatYellow] = useState('0');
  const [statRed, setStatRed] = useState('0');

  // Video URL
  const [videoUrl, setVideoUrl] = useState('');
  const currentTour = tours.find(t => t.id === tourId);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPlayerForPhoto) {
      const player = players.find((p: any) => p.id === selectedPlayerForPhoto);
      if (player?.photo_url) {
        updatePlayerPhoto.mutate({ playerId: selectedPlayerForPhoto, file, oldPhotoUrl: player.photo_url });
      } else {
        uploadPlayerPhoto.mutate({ playerId: selectedPlayerForPhoto, file });
      }
      setSelectedPlayerForPhoto('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = () => {
    const player = players.find((p: any) => p.id === selectedPlayerForPhoto);
    if (player?.photo_url) {
      deletePlayerPhoto.mutate({ playerId: selectedPlayerForPhoto, photoUrl: player.photo_url });
      setSelectedPlayerForPhoto('');
    }
  };

  const selectedPlayerHasPhoto = players.find((p: any) => p.id === selectedPlayerForPhoto)?.photo_url;

  if (!isAdmin) return null;

  const handleCreateTeam = () => {
    const result = teamNameSchema.safeParse(newTeamName);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    createTeam.mutate(result.data);
    setNewTeamName('');
  };

  const handleCreatePlayer = () => {
    if (!selectedTeamForPlayer) {
      toast.error('Выберите команду или "Легионер"');
      return;
    }
    const result = playerNameSchema.safeParse(newPlayerName);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    const teamId = selectedTeamForPlayer === 'legioner' ? null : selectedTeamForPlayer;
    createPlayer.mutate({ name: result.data, teamId });
    setNewPlayerName('');
    setSelectedTeamForPlayer('');
  };

  const handleAddTeamToTour = () => {
    if (!selectedTeamForTour || !tourId) return;
    addTeamToTour.mutate({ tourId, teamId: selectedTeamForTour });
    setSelectedTeamForTour('');
  };

  const handleCreateMatch = () => {
    if (!homeTeamId || !awayTeamId || !tourId) {
      toast.error('Выберите обе команды');
      return;
    }
    if (homeTeamId === awayTeamId) {
      toast.error('Команды должны быть разными');
      return;
    }
    // Create match with 0:0 score - will be auto-calculated from player stats
    createMatch.mutate({
      tour_id: tourId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_score: 0,
      away_score: 0,
    });
    setHomeTeamId('');
    setAwayTeamId('');
  };

  const handleCreatePlayerStat = async () => {
    if (!statMatchId || !statPlayerId) {
      toast.error('Выберите матч и игрока');
      return;
    }
    const statData = {
      goals: parseInt(statGoals) || 0,
      own_goals: parseInt(statOwnGoals) || 0,
      assists: parseInt(statAssists) || 0,
      yellow_cards: parseInt(statYellow) || 0,
      red_cards: parseInt(statRed) || 0,
    };
    const result = playerStatSchema.safeParse(statData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    await createPlayerStat.mutateAsync({
      match_id: statMatchId,
      player_id: statPlayerId,
      goals: result.data.goals,
      own_goals: result.data.own_goals,
      assists: result.data.assists,
      yellow_cards: result.data.yellow_cards,
      red_cards: result.data.red_cards,
    });
    // Auto-recalculate match score after adding player stat
    await recalculateScore.mutateAsync(statMatchId);
    setStatGoals('0');
    setStatOwnGoals('0');
    setStatAssists('0');
    setStatYellow('0');
    setStatRed('0');
  };

  const handleUpdateVideo = () => {
    if (!tourId) return;
    const result = youtubeUrlSchema.safeParse(videoUrl);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    updateTourVideo.mutate({ tourId, videoUrl: videoUrl || null });
  };

  const handleAddSubstitution = () => {
    if (!tourId || !originalPlayerId || !substitutePlayerId) {
      toast.error('Выберите игрока и легионера');
      return;
    }
    if (originalPlayerId === substitutePlayerId) {
      toast.error('Игроки должны быть разными');
      return;
    }
    createSubstitution.mutate({
      tour_id: tourId,
      original_player_id: originalPlayerId,
      substitute_player_id: substitutePlayerId,
    });
    setOriginalPlayerId('');
    setSubstitutePlayerId('');
  };

  const tourTeamIds = tourTeams.map(tt => tt.team_id);
  const availableTeamsForTour = teams.filter(t => !tourTeamIds.includes(t.id));

  // Filter players to only show those from teams in the current match + legionnaires
  const selectedMatch = matches.find(m => m.id === statMatchId);
  const matchTeamIds = selectedMatch ? [selectedMatch.home_team_id, selectedMatch.away_team_id] : [];
  const availablePlayers = matchTeamIds.length > 0 
    ? players.filter((p: any) => matchTeamIds.includes(p.team_id) || p.team_id === null)
    : players;

  // Players with teams (for substitution - original player)
  const teamPlayers = players.filter((p: any) => p.team_id !== null);
  // Legionnaires (for substitution - substitute player)
  const legionnaires = players.filter((p: any) => p.team_id === null);
  // Already substituted players in this tour
  const substitutedPlayerIds = substitutions.map(s => s.original_player_id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground font-mono flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Панель администратора
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Teams Management */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Команды
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Название команды"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
              <Button size="sm" onClick={handleCreateTeam} disabled={createTeam.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between text-sm py-1">
                  <span>{team.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => deleteTeam.mutate(team.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Team to Tour */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Добавить команду в тур
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedTeamForTour} onValueChange={setSelectedTeamForTour}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Выберите команду" />
              </SelectTrigger>
              <SelectContent>
                {availableTeamsForTour.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="w-full"
              onClick={handleAddTeamToTour}
              disabled={!selectedTeamForTour || !tourId}
            >
              Добавить в тур
            </Button>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {tourTeams.map(tt => (
                <div key={tt.id} className="flex items-center justify-between text-sm py-1">
                  <span>{tt.team.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeTeamFromTour.mutate(tt.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Players Management */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Игроки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedTeamForPlayer} onValueChange={setSelectedTeamForPlayer}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Команда игрока" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="legioner">⚡ Легионер (без команды)</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                placeholder="Имя игрока"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
              <Button size="sm" onClick={handleCreatePlayer} disabled={createPlayer.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Player Photo Upload/Edit/Delete */}
            <div className="border-t border-border pt-3 mt-3">
              <Label className="text-xs text-muted-foreground mb-2 block">Управление фото игрока</Label>
              <p className="text-[10px] text-muted-foreground/70 mb-2">
                📷 Рекомендуемый размер: 300×300px, формат JPG/PNG, квадратное фото для идеального отображения в круге
              </p>
              <div className="flex gap-2 items-center">
                <Select value={selectedPlayerForPhoto} onValueChange={setSelectedPlayerForPhoto}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Выберите игрока" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={p.photo_url} alt={p.name} />
                            <AvatarFallback className="text-[10px]">{p.name[0]}</AvatarFallback>
                          </Avatar>
                          {p.name}
                          {p.photo_url && <span className="text-xs text-green-500">✓</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedPlayerForPhoto || uploadPlayerPhoto.isPending || updatePlayerPhoto.isPending}
                  title={selectedPlayerHasPhoto ? "Заменить фото" : "Загрузить фото"}
                >
                  {selectedPlayerHasPhoto ? <Edit2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </Button>
                {selectedPlayerHasPhoto && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleDeletePhoto}
                    disabled={deletePlayerPhoto.isPending}
                    title="Удалить фото"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Edit Player Team */}
            <div className="border-t border-border pt-3 mt-3">
              <Label className="text-xs text-muted-foreground mb-2 block">Редактировать команду игрока</Label>
              <div className="flex gap-2 items-center">
                <Select value={selectedPlayerForEdit} onValueChange={(val) => {
                  setSelectedPlayerForEdit(val);
                  const player = players.find((p: any) => p.id === val);
                  setEditPlayerTeam(player?.team_id || 'legioner');
                }}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Выберите игрока" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((p: any) => {
                      const team = teams.find(t => t.id === p.team_id);
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({team?.name || 'Легионер'})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlayerForEdit && (
                <div className="flex gap-2 mt-2">
                  <Select value={editPlayerTeam} onValueChange={setEditPlayerTeam}>
                    <SelectTrigger className="bg-secondary border-border flex-1">
                      <SelectValue placeholder="Новая команда" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legioner">⚡ Легионер (без команды)</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm"
                    onClick={() => {
                      const newTeamId = editPlayerTeam === 'legioner' ? null : editPlayerTeam;
                      updatePlayer.mutate({ id: selectedPlayerForEdit, teamId: newTeamId });
                      setSelectedPlayerForEdit('');
                      setEditPlayerTeam('');
                    }}
                    disabled={updatePlayer.isPending}
                  >
                    Сохранить
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Match Creation - no score input */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Добавить матч</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Хозяева" />
                </SelectTrigger>
                <SelectContent>
                  {tourTeams.map(tt => (
                    <SelectItem key={tt.team_id} value={tt.team_id}>
                      {tt.team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Гости" />
                </SelectTrigger>
                <SelectContent>
                  {tourTeams.map(tt => (
                    <SelectItem key={tt.team_id} value={tt.team_id}>
                      {tt.team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Счёт рассчитается автоматически из статистики игроков
            </p>
            <Button size="sm" className="w-full" onClick={handleCreateMatch}>
              Добавить матч
            </Button>
          </CardContent>
        </Card>

        {/* Player Stats */}
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Статистика игрока</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={statMatchId} onValueChange={setStatMatchId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Матч" />
                </SelectTrigger>
                <SelectContent>
                  {matches.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.home_team.name} vs {m.away_team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statPlayerId} onValueChange={setStatPlayerId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Игрок" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">⚽ Голы (макс. 2)</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  value={statGoals}
                  onChange={e => setStatGoals(e.target.value)}
                  className="bg-secondary border-border text-foreground text-center"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">🔄 Автогол</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  value={statOwnGoals}
                  onChange={e => setStatOwnGoals(e.target.value)}
                  className="bg-secondary border-border text-foreground text-center"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">👟 Пасы</Label>
                <Input
                  type="number"
                  min="0"
                  value={statAssists}
                  onChange={e => setStatAssists(e.target.value)}
                  className="bg-secondary border-border text-foreground text-center"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">🟨 ЖК</Label>
                <Input
                  type="number"
                  min="0"
                  value={statYellow}
                  onChange={e => setStatYellow(e.target.value)}
                  className="bg-secondary border-border text-foreground text-center"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">🟥 КК</Label>
                <Input
                  type="number"
                  min="0"
                  value={statRed}
                  onChange={e => setStatRed(e.target.value)}
                  className="bg-secondary border-border text-foreground text-center"
                />
              </div>
            </div>
            <Button 
              size="sm" 
              className="w-full" 
              onClick={handleCreatePlayerStat}
              disabled={createPlayerStat.isPending || recalculateScore.isPending}
            >
              Добавить статистику
            </Button>
          </CardContent>
        </Card>

        {/* YouTube Video */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              Видео тура
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="YouTube URL"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
            {currentTour?.video_url && (
              <p className="text-xs text-muted-foreground truncate">
                Текущее: {currentTour.video_url}
              </p>
            )}
            <Button 
              size="sm" 
              className="w-full" 
              onClick={handleUpdateVideo}
              disabled={!tourId || updateTourVideo.isPending}
            >
              Сохранить видео
            </Button>
          </CardContent>
        </Card>

        {/* Player Substitutions */}
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              Замены игроков (легионеры)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Укажите, какого игрока заменяет легионер в этом туре. Пропускающему игроку не будут засчитываться игры.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Select value={originalPlayerId} onValueChange={setOriginalPlayerId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Пропускает тур" />
                </SelectTrigger>
                <SelectContent>
                  {teamPlayers
                    .filter((p: any) => !substitutedPlayerIds.includes(p.id))
                    .map((p: any) => {
                      const team = teams.find(t => t.id === p.team_id);
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({team?.name || 'Без команды'})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              <Select value={substitutePlayerId} onValueChange={setSubstitutePlayerId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Легионер" />
                </SelectTrigger>
                <SelectContent>
                  {legionnaires.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      ⚡ {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleAddSubstitution}
              disabled={!tourId || !originalPlayerId || !substitutePlayerId || createSubstitution.isPending}
            >
              Добавить замену
            </Button>
            {substitutions.length > 0 && (
              <div className="border-t border-border pt-3 mt-3 space-y-2">
                <Label className="text-xs text-muted-foreground">Текущие замены:</Label>
                {substitutions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between text-sm py-1 bg-secondary/50 px-2 rounded">
                    <span>
                      <span className="text-muted-foreground">{sub.original_player.name}</span>
                      <span className="mx-2">→</span>
                      <span className="text-primary font-medium">⚡ {sub.substitute_player.name}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteSubstitution.mutate({ id: sub.id, tourId: tourId! })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
