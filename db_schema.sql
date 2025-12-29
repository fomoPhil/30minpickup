-- 1. Create the table
create table pickups (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  latitude float not null,
  longitude float not null,
  description text,
  photo_url text,
  status text default 'pending'
);

-- 2. Security (Allow anyone to submit, everyone to read)
alter table pickups enable row level security;
create policy "Public read" on pickups for select using (true);
create policy "Public insert" on pickups for insert with check (true);

-- 3. Storage for Photos
insert into storage.buckets (id, name, public) values ('pickup-photos', 'pickup-photos', true);
create policy "Public Image Read" on storage.objects for select using ( bucket_id = 'pickup-photos' );
create policy "Public Image Upload" on storage.objects for insert with check ( bucket_id = 'pickup-photos' );
