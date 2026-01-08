-- Add video_url column to tours table for YouTube videos
ALTER TABLE public.tours
ADD COLUMN video_url TEXT DEFAULT NULL;