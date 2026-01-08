-- Create table to track player substitutions per tour
-- When a legionnaire replaces a team player for a tour
CREATE TABLE public.tour_player_substitutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  original_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  substitute_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tour_id, original_player_id)
);

-- Enable RLS
ALTER TABLE public.tour_player_substitutions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view tour_player_substitutions"
ON public.tour_player_substitutions
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert tour_player_substitutions"
ON public.tour_player_substitutions
FOR INSERT
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update tour_player_substitutions"
ON public.tour_player_substitutions
FOR UPDATE
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete tour_player_substitutions"
ON public.tour_player_substitutions
FOR DELETE
USING (is_admin_or_owner(auth.uid()));