import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'domus_supabase_url';
const STORAGE_KEY_KEY = 'domus_supabase_anon_key';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  return {
    url: envUrl || localUrl,
    anonKey: envKey || localKey,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || url === 'https://tuo-progetto.supabase.co') {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, anonKey);
    } catch (e) {
      console.error('Errore inizializzazione Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
}

export function resetSupabaseClient() {
  clientInstance = null;
}

export const SUPABASE_SQL_SCHEMA = `-- SCHEMA SQL COMPLETO MULTI-TENANT (DOMUSRENT)
-- Copia e incolla questo script nel SQL Editor del tuo progetto Supabase

-- 1. Tabella Prenotazioni & Studenti
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  guest_name text not null,
  guest_phone text default '',
  guest_email text default '',
  guest_document text default '',
  room_id text not null, -- 'room-1', 'room-2'
  check_in date not null,
  check_out date not null,
  guests_count integer default 1,
  total_price numeric not null default 0,
  deposit_paid numeric not null default 0,
  payment_status text default 'pending', -- 'paid', 'deposit_only', 'pending'
  booking_status text default 'confirmed', -- 'confirmed', 'checked_in', 'checked_out', 'cancelled'
  platform text default 'direct', -- 'direct', 'student'
  notes text default '',
  cleaning_status text default 'pending'
);

-- 2. Tabella Spese & Incassi Canoni
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null, -- 'canone_affitto', 'bills', 'maintenance', 'supplies', 'taxes', 'other'
  title text not null,
  amount numeric not null default 0,
  date date not null,
  notes text default ''
);

-- 3. Abilita Row Level Security (RLS)
alter table public.bookings enable row level security;
alter table public.expenses enable row level security;

-- 4. Politiche di Isolamento Multi-Tenant
create policy "Proprietario isolamento bookings" on public.bookings
  for all to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create policy "Proprietario isolamento expenses" on public.expenses
  for all to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Politiche per visitatori / modalità demo senza login
create policy "Demo pubblica bookings" on public.bookings
  for all to anon
  using (user_id is null)
  with check (user_id is null);

create policy "Demo pubblica expenses" on public.expenses
  for all to anon
  using (user_id is null)
  with check (user_id is null);
`;

export const SUPABASE_MIGRATION_SQL = `-- SCRIPT DI AGGIORNAMENTO MULTI-TENANT (PER TABELLE ESISTENTI)
-- Esegui questo script nel SQL Editor di Supabase se hai già creato le tabelle in precedenza:

-- 1. Aggiungi colonna account proprietario (user_id)
alter table public.bookings add column if not exists user_id uuid references auth.users(id);
alter table public.expenses add column if not exists user_id uuid references auth.users(id);

-- 2. Rimuovi vecchie policy permissive
drop policy if exists "Accesso pubblico completo bookings" on public.bookings;
drop policy if exists "Accesso pubblico completo expenses" on public.expenses;
drop policy if exists "Proprietario isolamento bookings" on public.bookings;
drop policy if exists "Proprietario isolamento expenses" on public.expenses;
drop policy if exists "Demo pubblica bookings" on public.bookings;
drop policy if exists "Demo pubblica expenses" on public.expenses;

-- 3. Attiva Row Level Security per isolare i dati di ogni proprietario
create policy "Proprietario isolamento bookings" on public.bookings
  for all to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create policy "Proprietario isolamento expenses" on public.expenses
  for all to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create policy "Demo pubblica bookings" on public.bookings
  for all to anon
  using (user_id is null)
  with check (user_id is null);

create policy "Demo pubblica expenses" on public.expenses
  for all to anon
  using (user_id is null)
  with check (user_id is null);
`;
