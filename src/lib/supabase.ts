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

export const SUPABASE_SQL_SCHEMA = `-- SCHEMA SQL PER SUPABASE (GESTIONALE AFFITTI 2 CAMERE)
-- Copia e incolla questo script nel SQL Editor del tuo progetto Supabase

-- 1. Tabella Prenotazioni
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  guest_name text not null,
  guest_phone text default '',
  guest_email text default '',
  guest_document text default '',
  room_id text not null, -- 'room-1', 'room-2', 'both'
  check_in date not null,
  check_out date not null,
  guests_count integer default 1,
  total_price numeric not null default 0,
  deposit_paid numeric not null default 0,
  payment_status text default 'pending', -- 'paid', 'deposit_only', 'pending'
  booking_status text default 'confirmed', -- 'confirmed', 'checked_in', 'checked_out', 'cancelled'
  platform text default 'direct', -- 'direct', 'airbnb', 'booking', 'other'
  notes text default '',
  cleaning_status text default 'pending' -- 'pending', 'in_progress', 'completed'
);

-- 2. Tabella Spese
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null, -- 'bills', 'cleaning', 'maintenance', 'supplies', 'taxes', 'other'
  title text not null,
  amount numeric not null default 0,
  date date not null,
  notes text default ''
);

-- 3. Abilita Row Level Security (RLS) & Politiche di accesso anonimo (se non usi login)
alter table public.bookings enable row level security;
alter table public.expenses enable row level security;

-- Consentire lettura e scrittura per il client anonimo (senza login)
create policy "Accesso pubblico completo bookings" on public.bookings
  for all using (true) with check (true);

create policy "Accesso pubblico completo expenses" on public.expenses
  for all using (true) with check (true);
`;
