import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUpdateTourVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tourId, videoUrl }: { tourId: string; videoUrl: string | null }) => {
      const { error } = await supabase
        .from('tours')
        .update({ video_url: videoUrl })
        .eq('id', tourId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      queryClient.invalidateQueries({ queryKey: ['current-tour'] });
      toast.success('Видео обновлено');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Helper to extract YouTube video ID from various URL formats
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
