import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Season {
  id: string;
  name: string;
  is_current: boolean;
  created_at: string;
}

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Season[];
    },
  });
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ['current-season'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_current', true)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string = 'Новый сезон') => {
      // Set all other seasons to not current
      await supabase
        .from('seasons')
        .update({ is_current: false })
        .eq('is_current', true);
      
      const { data, error } = await supabase
        .from('seasons')
        .insert({ name, is_current: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['current-season'] });
      toast.success('Сезон создан');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSeasonName() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('seasons')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['current-season'] });
      toast.success('Название сезона обновлено');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSetCurrentSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Set all other seasons to not current
      await supabase
        .from('seasons')
        .update({ is_current: false })
        .eq('is_current', true);
      
      const { data, error } = await supabase
        .from('seasons')
        .update({ is_current: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['current-season'] });
      toast.success('Текущий сезон изменён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['current-season'] });
      toast.success('Сезон удалён');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
