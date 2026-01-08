import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUploadPlayerPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, file }: { playerId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${playerId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath);

      // Update player record with photo URL
      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: publicUrl })
        .eq('id', playerId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Фото загружено');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePlayerPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, photoUrl }: { playerId: string; photoUrl: string }) => {
      // Extract file name from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('player-photos')
        .remove([fileName]);

      if (deleteError) {
        console.warn('Could not delete file from storage:', deleteError);
      }

      // Update player record to remove photo URL
      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: null })
        .eq('id', playerId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Фото удалено');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePlayerPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, file, oldPhotoUrl }: { playerId: string; file: File; oldPhotoUrl?: string | null }) => {
      // If there's an old photo, try to delete it
      if (oldPhotoUrl) {
        const urlParts = oldPhotoUrl.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from('player-photos')
          .remove([oldFileName])
          .catch(() => {}); // Ignore errors
      }

      // Upload new file
      const fileExt = file.name.split('.').pop();
      const fileName = `${playerId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath);

      // Update player record
      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: publicUrl })
        .eq('id', playerId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Фото обновлено');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
