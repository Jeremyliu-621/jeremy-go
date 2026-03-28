-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  personality_answers text[] not null default '{}',
  profile_complete boolean not null default false,
  created_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- User faces table (face descriptors for recognition)
create table if not exists public.user_faces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  face_descriptor float8[] not null default '{}',
  created_at timestamp with time zone default now() not null
);

alter table public.user_faces enable row level security;

create policy "Users can view all face descriptors"
  on public.user_faces for select
  using (true);

create policy "Users can insert own face"
  on public.user_faces for insert
  with check (auth.uid() = user_id);

create policy "Users can update own face"
  on public.user_faces for update
  using (auth.uid() = user_id);

-- Pokédex entries table
create table if not exists public.pokedex_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_user_id uuid references public.profiles(id) on delete cascade not null,
  primary_type text not null,
  secondary_type text,
  cp integer not null,
  stats jsonb not null default '{}',
  moves jsonb not null default '[]',
  description text not null default '',
  flavor_text text not null default '',
  created_at timestamp with time zone default now() not null,
  unique(user_id, target_user_id)
);

alter table public.pokedex_entries enable row level security;

create policy "Users can view own entries"
  on public.pokedex_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.pokedex_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.pokedex_entries for update
  using (auth.uid() = user_id);

-- Caught friends table
create table if not exists public.caught_friends (
  id uuid default gen_random_uuid() primary key,
  catcher_id uuid references public.profiles(id) on delete cascade not null,
  caught_user_id uuid references public.profiles(id) on delete cascade not null,
  pokedex_entry_id uuid references public.pokedex_entries(id) on delete cascade not null,
  caught_at timestamp with time zone default now() not null,
  unique(catcher_id, caught_user_id)
);

alter table public.caught_friends enable row level security;

create policy "Users can view own caught friends"
  on public.caught_friends for select
  using (auth.uid() = catcher_id);

create policy "Users can insert own catches"
  on public.caught_friends for insert
  with check (auth.uid() = catcher_id);

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, personality_answers, profile_complete)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'trainer_' || substr(new.id::text, 1, 8)),
    '{}',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
