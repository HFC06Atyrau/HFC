import { useState, useEffect, memo, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SeasonManager } from '@/components/SeasonManager';
import { TourSelector } from '@/components/TourSelector';
import { MVPDisplay } from '@/components/MVPDisplay';
import { CurrentTourTable } from '@/components/CurrentTourTable';
import { MatchesListTour } from '@/components/MatchesListTour';
import { PlayerStatsTourTable } from '@/components/PlayerStatsTourTable';
import { OverallTeamStatsTable } from '@/components/OverallTeamStatsTable';
import { OverallPlayerStatsTable } from '@/components/OverallPlayerStatsTable';
import { TourDreamTeams } from '@/components/DreamTeams';
import { TourVideoPlayer } from '@/components/TourVideoPlayer';
import { AdminPanel } from '@/components/AdminPanel';
import { OwnerPanel } from '@/components/OwnerPanel';
import { LiveResultsBanner } from '@/components/LiveResultsBanner';
import { useAuth } from '@/lib/auth';
import { useToursBySeason } from '@/hooks/useTours';
import { useCurrentSeason } from '@/hooks/useSeasons';
import futsalFieldBg from '@/assets/futsal-field-bg.jpg';

// Мемоизация компонентов для предотвращения лишних ререндеров
const MemoizedHeader = memo(Header);
const MemoizedLiveResultsBanner = memo(LiveResultsBanner);
const MemoizedSeasonManager = memo(SeasonManager);
const MemoizedTourSelector = memo(TourSelector);
const MemoizedMVPDisplay = memo(MVPDisplay);
const MemoizedCurrentTourTable = memo(CurrentTourTable);
const MemoizedMatchesListTour = memo(MatchesListTour);
const MemoizedPlayerStatsTourTable = memo(PlayerStatsTourTable);
const MemoizedOverallTeamStatsTable = memo(OverallTeamStatsTable);
const MemoizedOverallPlayerStatsTable = memo(OverallPlayerStatsTable);
const MemoizedTourDreamTeams = memo(TourDreamTeams);
const MemoizedTourVideoPlayer = memo(TourVideoPlayer);
const MemoizedAdminPanel = memo(AdminPanel);
const MemoizedOwnerPanel = memo(OwnerPanel);

const Index = () => {
  const { isAdmin, isOwner } = useAuth();
  const { data: currentSeason } = useCurrentSeason();
  const { data: tours = [] } = useToursBySeason(currentSeason?.id ?? null);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  // Set default to latest tour
  useEffect(() => {
    if (tours.length > 0 && !selectedTourId) {
      setSelectedTourId(tours[0].id);
    }
  }, [tours, selectedTourId]);

  // Reset selected tour when season changes
  useEffect(() => {
    setSelectedTourId(null);
  }, [currentSeason?.id]);

  const selectedTour = useMemo(
    () => tours.find(t => t.id === selectedTourId),
    [tours, selectedTourId]
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Futsal field background */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url(${futsalFieldBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      <div className="relative z-10">
        <MemoizedHeader />
        
        {/* Live Results Banner */}
        <MemoizedLiveResultsBanner />
        
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-3 hero-gradient py-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-wide">
              HFC <span className="gradient-text">Football Stats</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Статистика команд и игроков
            </p>
          </div>

          {/* Season Manager */}
          <section>
            <MemoizedSeasonManager />
          </section>

          {/* MVP Display - between season name and tour selector */}
          {selectedTour && (
            <section>
              <MemoizedMVPDisplay 
                tourId={selectedTourId} 
                mvpPlayerId={selectedTour.mvp_player_id} 
                tourNumber={selectedTour.number}
              />
            </section>
          )}

          {/* Tour Selector */}
          {currentSeason && (
            <section className="flex items-center justify-between">
              <MemoizedTourSelector
                selectedTourId={selectedTourId}
                onTourChange={setSelectedTourId}
              />
            </section>
          )}

          {/* Current Tour Section */}
          <section className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <MemoizedCurrentTourTable tourId={selectedTourId} />
              <div className="space-y-4">
                <MemoizedMatchesListTour tourId={selectedTourId} tourNumber={selectedTour?.number} />
                <MemoizedPlayerStatsTourTable tourId={selectedTourId} />
              </div>
            </div>
          </section>

          {/* Tour Video */}
          {selectedTour?.video_url && (
            <section>
              <MemoizedTourVideoPlayer videoUrl={selectedTour.video_url} tourNumber={selectedTour.number} />
            </section>
          )}

          {/* Tour Dream Teams */}
          <section>
            <MemoizedTourDreamTeams tourId={selectedTourId} />
          </section>

          {/* Overall Stats Section */}
          <section className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <MemoizedOverallTeamStatsTable />
              <MemoizedOverallPlayerStatsTable />
            </div>
          </section>

          {/* Admin Section */}
          {isAdmin && (
            <section className="space-y-4 pt-8 border-t border-border">
              <MemoizedAdminPanel tourId={selectedTourId} />
              {isOwner && (
                <div className="max-w-md">
                  <MemoizedOwnerPanel />
                </div>
              )}
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>HFC Football Stats © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
