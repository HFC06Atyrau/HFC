import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSetTourMVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tourId, playerId }: { tourId: string; playerId: string | null }) => {
      const { error } = await supabase
        .from('tours')
        .update({ mvp_player_id: playerId })
        .eq('id', tourId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast.success('MVP тура обновлён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
