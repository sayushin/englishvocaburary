-- Run in Supabase SQL Editor if columns don't exist yet
alter table "EnglishVocaburary"
  add column if not exists memorized integer not null default 0,
  add column if not exists "notMemorized" integer not null default 0;

create policy "Allow public update on EnglishVocaburary"
  on "EnglishVocaburary" for update
  using (true);
