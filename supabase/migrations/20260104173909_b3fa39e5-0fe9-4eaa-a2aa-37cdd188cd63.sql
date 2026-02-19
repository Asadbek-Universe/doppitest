-- Create game_scores table for storing game results
CREATE TABLE public.game_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  game_type text NOT NULL DEFAULT 'math_challenge',
  score integer NOT NULL DEFAULT 0,
  questions_answered integer NOT NULL DEFAULT 0,
  max_streak integer NOT NULL DEFAULT 0,
  difficulty_reached integer NOT NULL DEFAULT 1,
  time_played_seconds integer NOT NULL DEFAULT 60,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own scores
CREATE POLICY "Users can insert their own scores"
ON public.game_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own scores
CREATE POLICY "Users can view their own scores"
ON public.game_scores
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Everyone can view leaderboard (top scores are public)
CREATE POLICY "Leaderboard scores are viewable by everyone"
ON public.game_scores
FOR SELECT
USING (true);

-- Create index for leaderboard queries
CREATE INDEX idx_game_scores_game_type_score ON public.game_scores(game_type, score DESC);
CREATE INDEX idx_game_scores_user_id ON public.game_scores(user_id);