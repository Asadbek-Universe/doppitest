-- Saved items (bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicates per user/type/item
CREATE UNIQUE INDEX IF NOT EXISTS saved_items_user_type_item_unique
  ON public.saved_items (user_id, item_type, item_id);

CREATE INDEX IF NOT EXISTS saved_items_user_created_at_idx
  ON public.saved_items (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS saved_items_type_item_idx
  ON public.saved_items (item_type, item_id);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- RLS
DO $$ BEGIN
  -- SELECT
  CREATE POLICY "Users can view their saved items"
  ON public.saved_items
  FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- INSERT
  CREATE POLICY "Users can save items"
  ON public.saved_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- DELETE
  CREATE POLICY "Users can unsave items"
  ON public.saved_items
  FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Guardrail: restrict to known item types
CREATE OR REPLACE FUNCTION public.validate_saved_item_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type NOT IN ('test','course','reel','center') THEN
    RAISE EXCEPTION 'Invalid item_type: %', NEW.item_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_saved_item_type ON public.saved_items;
CREATE TRIGGER trg_validate_saved_item_type
BEFORE INSERT OR UPDATE ON public.saved_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_saved_item_type();
