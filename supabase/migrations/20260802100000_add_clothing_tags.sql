-- Optional tags on clothing items (e.g. AI, season, style labels)
ALTER TABLE public.clothing_items
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
