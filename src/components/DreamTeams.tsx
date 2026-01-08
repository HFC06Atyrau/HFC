import { useMemo } from 'react';
import { useTourDreamTeam, useSetTourDreamTeam } from '@/hooks/useDreamTeams';
import { DreamTeamSelector } from '@/components/DreamTeamSelector';

interface TourDreamTeamsProps {
  tourId: string | null;
}

export function TourDreamTeams({ tourId }: TourDreamTeamsProps) {
  const { data: dreamTeam = [] } = useTourDreamTeam(tourId, 'dream');
  const { data: antiTeam = [] } = useTourDreamTeam(tourId, 'anti');
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

  if (!tourId) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DreamTeamSelector
        title="Сборная тура"
        type="dream"
        selectedPlayerIds={dreamPlayerIds}
        onSave={(playerIds) => setDreamTeam.mutate({ 
          tourId, 
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
          tourId, 
          teamType: 'anti', 
          playerIds: playerIds.filter(Boolean) 
        })}
        isPending={setDreamTeam.isPending}
      />
    </div>
  );
}
