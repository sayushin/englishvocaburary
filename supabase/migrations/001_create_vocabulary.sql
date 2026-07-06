create table if not exists "EnglishVocabulary" (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  meaning_ja text not null default '',
  meaning_en text not null default '',
  sample_sentence text not null default '',
  sample_sentence_ja text not null default '',
  pronunciation text not null default '',
  part_of_speech text not null default '',
  difficulty text not null default '',
  provider text not null default '',
  created_at timestamptz not null default now()
);

alter table "EnglishVocabulary" enable row level security;

create policy "Allow public read on EnglishVocabulary"
  on "EnglishVocabulary" for select
  using (true);

create policy "Allow public insert on EnglishVocabulary"
  on "EnglishVocabulary" for insert
  with check (true);
