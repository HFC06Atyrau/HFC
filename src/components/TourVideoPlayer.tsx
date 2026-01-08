import { extractYouTubeId } from '@/hooks/useTourVideo';

interface TourVideoPlayerProps {
  videoUrl: string;
  tourNumber: number;
}

export function TourVideoPlayer({ videoUrl, tourNumber }: TourVideoPlayerProps) {
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) {
    return null;
  }

  return (
    <div className="stat-card">
      <h2 className="text-xl font-bold text-foreground font-mono mb-4">
        Видео тура {tourNumber}
      </h2>
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`Видео тура ${tourNumber}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
