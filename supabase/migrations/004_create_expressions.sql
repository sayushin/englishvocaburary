create table if not exists expressions (
  id uuid primary key default gen_random_uuid(),
  "englishSentence" text not null,
  "japaneseMeaning" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table expressions enable row level security;

create policy "Allow public read on expressions"
  on expressions for select
  using (true);

create policy "Allow public insert on expressions"
  on expressions for insert
  with check (true);

create policy "Allow public update on expressions"
  on expressions for update
  using (true)
  with check (true);

create policy "Allow public delete on expressions"
  on expressions for delete
  using (true);
