-- Create subscription tiers enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');

-- Create center subscriptions table
CREATE TABLE public.center_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.educational_centers(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  max_courses INTEGER NOT NULL DEFAULT 3,
  max_tests INTEGER NOT NULL DEFAULT 5,
  max_videos INTEGER NOT NULL DEFAULT 10,
  can_create_olympiads BOOLEAN NOT NULL DEFAULT false,
  seo_boost_level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(center_id)
);

-- Create center analytics table for tracking views and engagement
CREATE TABLE public.center_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.educational_centers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_views INTEGER NOT NULL DEFAULT 0,
  course_views INTEGER NOT NULL DEFAULT 0,
  test_views INTEGER NOT NULL DEFAULT 0,
  video_views INTEGER NOT NULL DEFAULT 0,
  enrollments INTEGER NOT NULL DEFAULT 0,
  test_completions INTEGER NOT NULL DEFAULT 0,
  revenue INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(center_id, date)
);

-- Create center SEO settings table
CREATE TABLE public.center_seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.educational_centers(id) ON DELETE CASCADE,
  keywords TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  boost_enabled BOOLEAN NOT NULL DEFAULT false,
  boost_expires_at TIMESTAMPTZ,
  visibility_score INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(center_id)
);

-- Create olympiads table
CREATE TABLE public.olympiads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES public.educational_centers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_code TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  prize_description TEXT,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create olympiad registrations table
CREATE TABLE public.olympiad_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olympiad_id UUID NOT NULL REFERENCES public.olympiads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered',
  score INTEGER,
  rank INTEGER,
  UNIQUE(olympiad_id, user_id)
);

-- Create short videos (reels) table
CREATE TABLE public.center_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.educational_centers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  subject_id UUID REFERENCES public.subjects(id),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.center_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olympiads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olympiad_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_reels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for center_subscriptions
CREATE POLICY "Centers can view their own subscription"
ON public.center_subscriptions FOR SELECT
USING (center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()));

CREATE POLICY "Admins can manage all subscriptions"
ON public.center_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for center_analytics
CREATE POLICY "Centers can view their own analytics"
ON public.center_analytics FOR SELECT
USING (center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()));

CREATE POLICY "System can insert analytics"
ON public.center_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all analytics"
ON public.center_analytics FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for center_seo_settings
CREATE POLICY "Centers can view their own SEO settings"
ON public.center_seo_settings FOR SELECT
USING (center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()));

CREATE POLICY "Centers can update their own SEO settings"
ON public.center_seo_settings FOR UPDATE
USING (center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()));

CREATE POLICY "Centers can insert their own SEO settings"
ON public.center_seo_settings FOR INSERT
WITH CHECK (center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()));

CREATE POLICY "Admins can manage all SEO settings"
ON public.center_seo_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for olympiads
CREATE POLICY "Public olympiads are viewable by everyone"
ON public.olympiads FOR SELECT
USING (is_public = true OR center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Centers can manage their own olympiads"
ON public.olympiads FOR ALL
USING (center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- RLS Policies for olympiad_registrations
CREATE POLICY "Users can view their own registrations"
ON public.olympiad_registrations FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR 
  olympiad_id IN (SELECT id FROM public.olympiads WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())));

CREATE POLICY "Users can register themselves"
ON public.olympiad_registrations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Centers can update registrations for their olympiads"
ON public.olympiad_registrations FOR UPDATE
USING (olympiad_id IN (SELECT id FROM public.olympiads WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())) OR has_role(auth.uid(), 'admin'));

-- RLS Policies for center_reels
CREATE POLICY "Published reels are viewable by everyone"
ON public.center_reels FOR SELECT
USING (is_published = true OR center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()));

CREATE POLICY "Centers can manage their own reels"
ON public.center_reels FOR ALL
USING (center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Create function to auto-create subscription for new centers
CREATE OR REPLACE FUNCTION public.handle_new_center()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.center_subscriptions (center_id, tier)
  VALUES (NEW.id, 'free');
  
  INSERT INTO public.center_seo_settings (center_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new centers
CREATE TRIGGER on_center_created
  AFTER INSERT ON public.educational_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_center();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_center_subscriptions_updated_at
  BEFORE UPDATE ON public.center_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_center_seo_settings_updated_at
  BEFORE UPDATE ON public.center_seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_olympiads_updated_at
  BEFORE UPDATE ON public.olympiads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_center_reels_updated_at
  BEFORE UPDATE ON public.center_reels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();