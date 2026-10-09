export type RoomId = 'room-1' | 'room-2';

export interface Room {
  id: RoomId;
  name: string;
  defaultRent: number; // canone indicativo base a studente
  color: string;
  accentHex: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  room_id: RoomId;
  monthly_rent: number; // canone individuale al mese a persona (€)
  deposit_amount: number; // cauzione individuale versata (€)
  start_date: string; // inizio permanenza (YYYY-MM-DD)
  end_date: string; // fine prevista (YYYY-MM-DD)
  is_active: boolean; // true = abita attualmente; false = ex-inquilino archiviato
  notes?: string; // facoltà, genitore, note personali
  created_at?: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  tenant_name: string;
  room_id: RoomId;
  month_key: string; // "2026-10"
  month_label: string; // "Ottobre 2026"
  year: number; // 2026
  amount: number; // importo pagato dal singolo studente (€)
  payment_date: string; // data effettivo incasso (YYYY-MM-DD)
  payment_method: 'bonifico' | 'contanti' | 'altro';
  notes?: string;
  created_at?: string;
}

export interface HouseExpense {
  id: string;
  title: string;
  category: 'luce' | 'gas' | 'internet' | 'condominio' | 'tari' | 'manutenzione' | 'altro';
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  created_at?: string;
}
