-- Run in Supabase SQL Editor if the column does not exist yet
-- Synonyms are stored as a comma-separated list, e.g. "brief, fleeting, transient"
alter table "EnglishVocaburary"
  add column if not exists synonyms text not null default '';
