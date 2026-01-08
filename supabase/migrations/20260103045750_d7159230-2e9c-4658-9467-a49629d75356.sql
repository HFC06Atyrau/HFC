-- Add own_goals column to player_stats table
ALTER TABLE public.player_stats ADD COLUMN own_goals integer DEFAULT 0;