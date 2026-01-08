import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserRole {
  id: string;
  user_id: string;
  role: 'owner' | 'admin';
  created_at: string;
  email?: string;
}

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at');
      if (error) throw error;
      
      // Fetch profiles separately for emails
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
      
      return roles.map(role => ({
        ...role,
        email: profileMap.get(role.user_id) || 'Unknown'
      })) as UserRole[];
    },
  });
}

export function useAssignAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (email: string) => {
      // First find the user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profile) throw new Error('Пользователь не найден');
      
      // Check if already admin
      const { data: existing } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      if (existing) throw new Error('Пользователь уже является администратором');
      
      // Assign admin role
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.user_id, role: 'admin' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Администратор назначен');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Права администратора удалены');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
