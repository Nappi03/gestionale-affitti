import { getSupabase } from '../lib/supabase';
import type { Tenant, Payment, HouseExpense, Room } from '../types';

export const ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Camera A',
    defaultRent: 300,
    color: 'emerald',
    accentHex: '#10b981',
  },
  {
    id: 'room-2',
    name: 'Camera B',
    defaultRent: 300,
    color: 'indigo',
    accentHex: '#6366f1',
  },
];

const LOCAL_STORAGE_TENANTS_KEY = 'domus_landlord_tenants_v3';
const LOCAL_STORAGE_PAYMENTS_KEY = 'domus_landlord_payments_v3';
const LOCAL_STORAGE_EXPENSES_KEY = 'domus_landlord_expenses_v3';

// Seed Data (inizializzati vuoti per iniziare da zero)
const SEED_TENANTS: Tenant[] = [];
const SEED_PAYMENTS: Payment[] = [];
const SEED_EXPENSES: HouseExpense[] = [];

export class StorageService {
  // Test Supabase Connection
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, message: 'Supabase non configurato.' };
    try {
      const { error } = await supabase.from('bookings').select('id').limit(1);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Database Supabase collegato e attivo!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Errore di connessione' };
    }
  }

  // --- TENANTS (I Ragazzi) ---
  static async getTenants(): Promise<Tenant[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            name: row.guest_name,
            phone: row.guest_phone || '',
            email: row.guest_email || '',
            room_id: (row.room_id as any) || 'room-1',
            monthly_rent: Number(row.total_price) || 300,
            deposit_amount: Number(row.deposit_paid) || 100,
            start_date: row.check_in,
            end_date: row.check_out,
            is_active: row.booking_status === 'confirmed',
            notes: row.notes || '',
            created_at: row.created_at,
          }));
        }
      } catch (e) {
        console.warn('Errore lettura tenant da Supabase:', e);
      }
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_TENANTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(SEED_TENANTS));
      return SEED_TENANTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_TENANTS;
    }
  }

  static async saveTenant(tenant: Tenant): Promise<Tenant> {
    const supabase = getSupabase();
    const isLocalSeed = tenant.id.startsWith('tenant-');

    if (supabase) {
      try {
        const row = {
          guest_name: tenant.name,
          guest_phone: tenant.phone || '',
          guest_email: tenant.email || '',
          guest_document: '',
          room_id: tenant.room_id,
          check_in: tenant.start_date,
          check_out: tenant.end_date,
          guests_count: 1,
          total_price: tenant.monthly_rent,
          deposit_paid: tenant.deposit_amount,
          payment_status: 'paid',
          booking_status: tenant.is_active ? 'confirmed' : 'checked_out',
          platform: 'student',
          notes: tenant.notes || '',
        };

        if (isLocalSeed || !tenant.id) {
          const { data, error } = await supabase.from('bookings').insert(row).select().single();
          if (!error && data) {
            return { ...tenant, id: data.id };
          }
        } else {
          const { data, error } = await supabase.from('bookings').update(row).eq('id', tenant.id).select().single();
          if (!error && data) {
            return tenant;
          }
        }
      } catch (e) {
        console.warn('Errore salvataggio tenant Supabase:', e);
      }
    }

    const list = await this.getTenants();
    let saved: Tenant;
    if (isLocalSeed && !list.some(t => t.id === tenant.id)) {
      saved = tenant;
      list.push(saved);
    } else if (!tenant.id || isLocalSeed) {
      saved = { ...tenant, id: `t-${Date.now()}` };
      const idx = list.findIndex(t => t.id === tenant.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
    } else {
      saved = tenant;
      const idx = list.findIndex(t => t.id === tenant.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
    }
    localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(list));
    return saved;
  }

  static async archiveTenant(tenantId: string): Promise<boolean> {
    const list = await this.getTenants();
    const tenant = list.find(t => t.id === tenantId);
    if (!tenant) return false;
    tenant.is_active = false;
    tenant.end_date = new Date().toISOString().split('T')[0];
    await this.saveTenant(tenant);
    return true;
  }

  static async deleteTenant(tenantId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('bookings').delete().eq('id', tenantId);
      } catch (e) {
        console.warn('Errore cancellazione tenant da Supabase:', e);
      }
    }

    const list = await this.getTenants();
    const filtered = list.filter(t => t.id !== tenantId);
    localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(filtered));
    return true;
  }

  // --- PAYMENTS ARCHIVE (Archivio Storico Pagamenti Negli Anni) ---
  static async getPayments(): Promise<Payment[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('category', 'canone_affitto')
          .order('date', { ascending: false });

        if (!error && data) {
          return data.map((row: any) => {
            let meta: any = {};
            try {
              if (row.notes && row.notes.startsWith('{')) meta = JSON.parse(row.notes);
            } catch { meta = {}; }

            return {
              id: row.id,
              tenant_id: meta.tenant_id || '',
              tenant_name: meta.tenant_name || row.title.replace('Canone ', ''),
              room_id: meta.room_id || 'room-1',
              month_key: meta.month_key || row.date.slice(0, 7),
              month_label: meta.month_label || row.title,
              year: Number(meta.year) || new Date(row.date).getFullYear(),
              amount: Number(row.amount),
              payment_date: row.date,
              payment_method: meta.payment_method || 'bonifico',
              notes: meta.notes || '',
              created_at: row.created_at,
            };
          });
        }
      } catch (e) {
        console.warn('Errore fetch pagamenti Supabase:', e);
      }
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(SEED_PAYMENTS));
      return SEED_PAYMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_PAYMENTS;
    }
  }

  static async recordPayment(payment: Payment): Promise<Payment> {
    const supabase = getSupabase();
    const isNew = !payment.id || payment.id.startsWith('pay-seed-') || payment.id.startsWith('p-temp-');

    const meta = {
      tenant_id: payment.tenant_id,
      tenant_name: payment.tenant_name,
      room_id: payment.room_id,
      month_key: payment.month_key,
      month_label: payment.month_label,
      year: payment.year,
      payment_method: payment.payment_method,
      notes: payment.notes || '',
    };

    if (supabase) {
      try {
        const row = {
          category: 'canone_affitto',
          title: `Canone ${payment.month_label} - ${payment.tenant_name}`,
          amount: payment.amount,
          date: payment.payment_date,
          notes: JSON.stringify(meta),
        };

        if (isNew) {
          const { data, error } = await supabase.from('expenses').insert(row).select().single();
          if (!error && data) {
            return { ...payment, id: data.id };
          }
        } else {
          await supabase.from('expenses').update(row).eq('id', payment.id);
          return payment;
        }
      } catch (e) {
        console.warn('Errore salvataggio pagamento Supabase:', e);
      }
    }

    const list = await this.getPayments();
    let saved: Payment;
    if (isNew) {
      saved = { ...payment, id: `p-${Date.now()}` };
      list.unshift(saved);
    } else {
      saved = payment;
      const idx = list.findIndex(p => p.id === payment.id);
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
    }
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(list));
    return saved;
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', paymentId);
      } catch (e) {
        console.warn('Errore cancellazione pagamento da Supabase:', e);
      }
    }

    const list = await this.getPayments();
    const filtered = list.filter(p => p.id !== paymentId);
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(filtered));
    return true;
  }

  // --- HOUSE EXPENSES (Bollette & Spese) ---
  static async getExpenses(): Promise<HouseExpense[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .neq('category', 'canone_affitto')
          .order('date', { ascending: false });

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            title: row.title,
            category: row.category as any,
            amount: Number(row.amount),
            date: row.date,
            notes: row.notes || '',
            created_at: row.created_at,
          }));
        }
      } catch (e) {
        console.warn('Errore fetch spese Supabase:', e);
      }
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(SEED_EXPENSES));
      return SEED_EXPENSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_EXPENSES;
    }
  }

  static async saveExpense(expense: HouseExpense): Promise<HouseExpense> {
    const supabase = getSupabase();
    const isNew = !expense.id || expense.id.startsWith('exp-seed-') || expense.id.startsWith('e-');

    if (supabase) {
      try {
        const row = {
          category: expense.category,
          title: expense.title,
          amount: expense.amount,
          date: expense.date,
          notes: expense.notes || '',
        };
        if (isNew) {
          const { data, error } = await supabase.from('expenses').insert(row).select().single();
          if (!error && data) return { ...expense, id: data.id };
        } else {
          await supabase.from('expenses').update(row).eq('id', expense.id);
          return expense;
        }
      } catch (e) {
        console.warn('Errore salvataggio spesa su Supabase:', e);
      }
    }

    const list = await this.getExpenses();
    let saved: HouseExpense;
    if (isNew) {
      saved = { ...expense, id: `e-${Date.now()}` };
      list.unshift(saved);
    } else {
      saved = expense;
      const idx = list.findIndex(e => e.id === expense.id);
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
    }
    localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(list));
    return saved;
  }

  static async deleteExpense(expenseId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', expenseId);
      } catch (e) {
        console.warn('Errore delete spesa Supabase:', e);
      }
    }

    const list = await this.getExpenses();
    const filtered = list.filter(e => e.id !== expenseId);
    localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(filtered));
    return true;
  }
}
