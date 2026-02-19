-- Create center_followers table to track user subscriptions to educational centers
CREATE TABLE public.center_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  center_id UUID NOT NULL REFERENCES public.educational_centers(id) ON DELETE CASCADE,
  followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, center_id)
);

-- Enable Row Level Security
ALTER TABLE public.center_followers ENABLE ROW LEVEL SECURITY;

-- Users can view all followers (for follower counts)
CREATE POLICY "Anyone can view follower counts"
ON public.center_followers
FOR SELECT
USING (true);

-- Users can follow centers (insert their own follows)
CREATE POLICY "Users can follow centers"
ON public.center_followers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unfollow centers (delete their own follows)
CREATE POLICY "Users can unfollow centers"
ON public.center_followers
FOR DELETE
USING (auth.uid() = user_id);

-- Add followers_count column to educational_centers for quick access
ALTER TABLE public.educational_centers 
ADD COLUMN followers_count INTEGER NOT NULL DEFAULT 0;

-- Create function to update followers count
CREATE OR REPLACE FUNCTION public.update_center_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.educational_centers 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.center_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.educational_centers 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.center_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update follower counts
CREATE TRIGGER update_followers_count
AFTER INSERT OR DELETE ON public.center_followers
FOR EACH ROW
EXECUTE FUNCTION public.update_center_followers_count();