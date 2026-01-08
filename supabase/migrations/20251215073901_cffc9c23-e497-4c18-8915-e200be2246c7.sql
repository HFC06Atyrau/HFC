-- Drop the old unique constraint on number only
ALTER TABLE public.tours DROP CONSTRAINT IF EXISTS tours_number_key;

-- The unique index on (season_id, number) already exists from previous migration