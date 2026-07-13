-- Run in Supabase SQL Editor if the column does not exist yet
alter table "EnglishVocaburary"
  add column if not exists "askJAorEN" text;

-- Optional: backfill nulls based on meaning_ja containing Japanese (conservative default EN)
-- Leave nulls as-is; the app resolves them at quiz time.
