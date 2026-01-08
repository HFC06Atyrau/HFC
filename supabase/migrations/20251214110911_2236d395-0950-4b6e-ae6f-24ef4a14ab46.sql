-- Create table for tour dream teams (team of the tour / anti-team of the tour)
CREATE TABLE public.tour_dream_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL CHECK (team_type IN ('dream', 'anti')),
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (tour_id, team_type, position),
  UNIQUE (tour_id, team_type, player_id)
);

-- Create table for season dream teams
CREATE TABLE public.season_dream_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL CHECK (team_type IN ('dream', 'anti')),
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (season_id, team_type, position),
  UNIQUE (season_id, team_type, player_id)
);

-- Enable RLS
ALTER TABLE public.tour_dream_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_dream_teams ENABLE ROW LEVEL SECURITY;

-- RLS policies for tour_dream_teams
CREATE POLICY "Anyone can view tour_dream_teams" 
ON public.tour_dream_teams FOR SELECT USING (true);

CREATE POLICY "Admins can insert tour_dream_teams" 
ON public.tour_dream_teams FOR INSERT 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update tour_dream_teams" 
ON public.tour_dream_teams FOR UPDATE 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete tour_dream_teams" 
ON public.tour_dream_teams FOR DELETE 
USING (is_admin_or_owner(auth.uid()));

-- RLS policies for season_dream_teams
CREATE POLICY "Anyone can view season_dream_teams" 
ON public.season_dream_teams FOR SELECT USING (true);

CREATE POLICY "Admins can insert season_dream_teams" 
ON public.season_dream_teams FOR INSERT 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update season_dream_teams" 
ON public.season_dream_teams FOR UPDATE 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete season_dream_teams" 
ON public.season_dream_teams FOR DELETE 
USING (is_admin_or_owner(auth.uid()));

-- Add unique constraint for tour number within season
CREATE UNIQUE INDEX idx_tours_season_number ON public.tours(season_id, number);