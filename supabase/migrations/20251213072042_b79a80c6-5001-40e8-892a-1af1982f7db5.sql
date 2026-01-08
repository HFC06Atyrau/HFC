-- Create seasons table
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Новый сезон',
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- RLS policies for seasons
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Admins can insert seasons" ON public.seasons FOR INSERT WITH CHECK (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can update seasons" ON public.seasons FOR UPDATE USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can delete seasons" ON public.seasons FOR DELETE USING (is_admin_or_owner(auth.uid()));

-- Add season_id to tours table
ALTER TABLE public.tours ADD COLUMN season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_tours_season_id ON public.tours(season_id);