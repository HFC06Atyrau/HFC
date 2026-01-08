-- Make team_id nullable to allow players without a team (Legionnaires)
ALTER TABLE public.players 
ALTER COLUMN team_id DROP NOT NULL;