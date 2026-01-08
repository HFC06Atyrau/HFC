-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'admin')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete roles" ON public.user_roles
FOR DELETE USING (public.has_role(auth.uid(), 'owner'));

-- Teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT 'black',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins can insert teams" ON public.teams FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can update teams" ON public.teams FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE USING (public.is_admin_or_owner(auth.uid()));

-- Tours table
CREATE TABLE public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tours" ON public.tours FOR SELECT USING (true);
CREATE POLICY "Admins can insert tours" ON public.tours FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can update tours" ON public.tours FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can delete tours" ON public.tours FOR DELETE USING (public.is_admin_or_owner(auth.uid()));

-- Tour teams (teams participating in a tour with their color)
CREATE TABLE public.tour_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    color TEXT DEFAULT 'black',
    UNIQUE (tour_id, team_id)
);

ALTER TABLE public.tour_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tour_teams" ON public.tour_teams FOR SELECT USING (true);
CREATE POLICY "Admins can insert tour_teams" ON public.tour_teams FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can update tour_teams" ON public.tour_teams FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can delete tour_teams" ON public.tour_teams FOR DELETE USING (public.is_admin_or_owner(auth.uid()));

-- Players table
CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Admins can insert players" ON public.players FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can update players" ON public.players FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can delete players" ON public.players FOR DELETE USING (public.is_admin_or_owner(auth.uid()));

-- Matches table
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE USING (public.is_admin_or_owner(auth.uid()));

-- Player stats table (goals, assists, cards per match)
CREATE TABLE public.player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player_stats" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Admins can insert player_stats" ON public.player_stats FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can update player_stats" ON public.player_stats FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can delete player_stats" ON public.player_stats FOR DELETE USING (public.is_admin_or_owner(auth.uid()));

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger for new user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();