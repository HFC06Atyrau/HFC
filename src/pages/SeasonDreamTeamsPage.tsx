import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useSeasons } from '@/hooks/useSeasons';
import { useSeasonDreamTeam, useSetSeasonDreamTeam } from '@/hooks/useDreamTeams';
import { DreamTeamSelector } from '@/components/DreamTeamSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SeasonDreamTeamsPage() {
  const { data: seasons = [] } = useSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  
  // Set default to last season (most recent)
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [seasons, selectedSeasonId]);

  const { data: dreamTeam = [] } = useSeasonDreamTeam(selectedSeasonId, 'dream');
  const { data: antiTeam = [] } = useSeasonDreamTeam(selectedSeasonId, 'anti');
  const setDreamTeam = useSetSeasonDreamTeam();

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground font-mono">
            Сборные сезона
          </h1>
          <Select
            value={selectedSeasonId ?? ''}
            onValueChange={setSelectedSeasonId}
          >
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="Выберите сезон" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSeasonId && (
          <div className="grid gap-4 md:grid-cols-2">
            <DreamTeamSelector
              title={`Сборная сезона${selectedSeason ? ` (${selectedSeason.name})` : ''}`}
              type="dream"
              selectedPlayerIds={dreamPlayerIds}
              onSave={(playerIds) => setDreamTeam.mutate({ 
                seasonId: selectedSeasonId, 
                teamType: 'dream', 
                playerIds: playerIds.filter(Boolean) 
              })}
              isPending={setDreamTeam.isPending}
            />
            <DreamTeamSelector
              title={`Антисборная сезона${selectedSeason ? ` (${selectedSeason.name})` : ''}`}
              type="anti"
              selectedPlayerIds={antiPlayerIds}
              onSave={(playerIds) => setDreamTeam.mutate({ 
                seasonId: selectedSeasonId, 
                teamType: 'anti', 
                playerIds: playerIds.filter(Boolean) 
              })}
              isPending={setDreamTeam.isPending}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>HFC Football Stats © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
