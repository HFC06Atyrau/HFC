-- Add MVP player to tours
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS mvp_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL;

-- Add photo URL to players
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for player photos
INSERT INTO storage.buckets (id, name, public) VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for player photos
CREATE POLICY "Anyone can view player photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-photos');

CREATE POLICY "Admins can upload player photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-photos' AND is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update player photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-photos' AND is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete player photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-photos' AND is_admin_or_owner(auth.uid()));