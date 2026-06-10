-- ============================================================
-- T-STORE — Supabase Database Schema
-- ============================================================
-- Run this in your Supabase SQL Editor after creating the project.
-- This creates all tables, RLS policies, and the storage bucket.
-- ============================================================

-- ── Enable UUID extension ──
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- ── Profiles (extends auth.users) ──
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  skool_name text,
  templario_name text unique,
  avatar text,
  player_class text,
  level int default 1,
  xp int default 0,
  cristales int default 0,
  rank text default 'Bronce',
  is_active boolean default true,
  role text default 'templario',  -- 'templario' | 'admin'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Products ──
create table products (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  name text not null,
  description text,
  price_cristales int default 0,
  category text default 'consumable',  -- skin | weapon | consumable | mount | spell | armor
  rarity text default 'common',       -- common | rare | epic | legendary
  asset_url text,
  metadata jsonb default '{}',
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ── Orders ──
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  items jsonb,
  total_cristales int default 0,
  status text default 'completed',    -- pending | completed | refunded
  created_at timestamptz default now()
);

-- ── Inventory Items ──
create table inventory_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id),
  slot text,                          -- weapon | armor | accessory
  is_equipped boolean default false,
  acquired_at timestamptz default now()
);

-- ── Missions ──
create table missions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type text default 'daily',          -- daily | weekly | story | event
  xp_reward int default 0,
  coin_reward int default 0,
  gem_reward int default 0,
  requirements jsonb default '{}',
  is_active boolean default true,
  sort_order int default 0,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ── User Missions (progress tracking) ──
create table user_missions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  mission_id uuid references missions(id) on delete cascade,
  progress int default 0,
  completed_at timestamptz,
  reward_claimed boolean default false,
  created_at timestamptz default now()
);

-- ── Access Codes ──
create table access_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  is_used boolean default false,
  used_by uuid references profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- ── Asset Manifest ──
create table asset_manifest (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  category text,                      -- background | character | overlay | panel | icon | avatar | product
  url text not null,
  alt text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- ── Content Blocks (editable text from admin) ──
create table content_blocks (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table inventory_items enable row level security;
alter table missions enable row level security;
alter table user_missions enable row level security;
alter table access_codes enable row level security;
alter table asset_manifest enable row level security;
alter table content_blocks enable row level security;

-- ── Profiles ──
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Products ──
create policy "Products are viewable by everyone"
  on products for select using (is_active = true);

create policy "Admins can manage products"
  on products for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Orders ──
create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on orders for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can create orders"
  on orders for insert with check (auth.uid() = user_id);

-- ── Inventory ──
create policy "Users can view own inventory"
  on inventory_items for select using (auth.uid() = user_id);

create policy "Admins can view all inventory"
  on inventory_items for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Missions ──
create policy "Active missions are viewable by everyone"
  on missions for select using (is_active = true);

create policy "Admins can manage missions"
  on missions for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── User Missions ──
create policy "Users can view/update own missions"
  on user_missions for all using (auth.uid() = user_id);

create policy "Admins can view all user missions"
  on user_missions for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Access Codes ──
create policy "Admins can manage access codes"
  on access_codes for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Asset Manifest ──
create policy "Assets are viewable by everyone"
  on asset_manifest for select using (true);

create policy "Admins can manage assets"
  on asset_manifest for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Content Blocks ──
create policy "Content blocks are viewable by everyone"
  on content_blocks for select using (true);

create policy "Admins can manage content blocks"
  on content_blocks for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

-- Create storage bucket for assets
insert into storage.buckets (id, name, public)
values ('t-store-assets', 't-store-assets', true)
on conflict (id) do nothing;

-- Allow public read access to assets
create policy "Assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 't-store-assets');

-- Allow admins to upload assets
create policy "Admins can upload assets"
  on storage.objects for insert
  with check (
    bucket_id = 't-store-assets'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, templario_name, avatar)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'templario_name',
    new.raw_user_meta_data->>'avatar'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_missions_updated_at before update on missions
  for each row execute procedure update_updated_at_column();

create trigger update_asset_manifest_updated_at before update on asset_manifest
  for each row execute procedure update_updated_at_column();

create trigger update_content_blocks_updated_at before update on content_blocks
  for each row execute procedure update_updated_at_column();

-- ============================================================
-- SEED DATA (optional — remove in production)
-- ============================================================

-- Sample missions
insert into missions (title, description, type, xp_reward, coin_reward, is_active, sort_order) values
  ('Completar perfil en Skool', 'El templario completa su perfil con foto y bio en la comunidad Skool.', 'daily', 100, 500, true, 1),
  ('Top 10 — 100 Templarios', 'Terminar en el Top 10 del juego 100 Templarios en la semana.', 'weekly', 300, 1500, true, 2),
  ('Participar en dinámica', 'Participar activamente en la dinámica semanal de la comunidad.', 'weekly', 150, 800, true, 3),
  ('Referir a un miembro', 'Traer a un nuevo miembro que se una activamente a la membresía.', 'event', 500, 2000, true, 4);

-- Sample products
insert into products (slug, name, description, price_cristales, category, rarity, is_active, sort_order) values
  ('skin-fuego', 'Skin del Fuego Eterno', 'Transforma tu avatar con llamas doradas.', 500, 'skin', 'rare', true, 1),
  ('arma-excalibur', 'Excalibur Templaria', 'Espada legendaria de los antiguos caballeros.', 2000, 'weapon', 'legendary', true, 2),
  ('pocion-vida', 'Poción de Vida', 'Restaura energía vital al instante.', 100, 'consumable', 'common', true, 3),
  ('montura-grifo', 'Grifo de las Sombras', 'Surca los cielos con esta bestia majestuosa.', 3000, 'mount', 'epic', true, 4);

-- Sample content blocks
insert into content_blocks (key, value, is_active) values
  ('hub_welcome_text', 'Bienvenido al Templo del Propósito. Tu camino como Templario comienza aquí.', true),
  ('store_banner', '¡Nuevos items legendarios disponibles!', true);
