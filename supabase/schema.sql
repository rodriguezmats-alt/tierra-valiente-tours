create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null check (char_length(btrim(name)) between 1 and 60),
  destination varchar(100) not null check (char_length(btrim(destination)) between 1 and 100),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 1 and 500),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.reviews
  add column if not exists status text not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_status_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end
$$;

create index if not exists reviews_approved_created_at_idx
  on public.reviews (created_at desc)
  where status = 'approved';

alter table public.reviews enable row level security;

drop policy if exists "Anyone can read reviews" on public.reviews;
drop policy if exists "Anyone can publish reviews" on public.reviews;
drop policy if exists "Anyone can read approved reviews" on public.reviews;
drop policy if exists "Anyone can submit pending reviews" on public.reviews;

create policy "Anyone can read reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (status = 'approved');

create policy "Anyone can submit pending reviews"
  on public.reviews
  for insert
  to anon, authenticated
  with check (status = 'pending');

revoke all on public.reviews from anon, authenticated;
grant select, insert on public.reviews to anon, authenticated;
