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

// Seed Data
const SEED_TENANTS: Tenant[] = [];
const SEED_PAYMENTS: Payment[] = [];
const SEED_EXPENSES: HouseExpense[] = [];

const isUUID = (str?: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export class StorageService {
  // Helpers for local storage cache
  static getLocalTenants(): Tenant[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_TENANTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static getLocalPayments(): Payment[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static getLocalExpenses(): HouseExpense[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

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
          if (data.length > 0) {
            const list: Tenant[] = data.map((row: any) => ({
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
            localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(list));
            return list;
          }

          // Se Supabase ha 0 righe, controlla se ci sono inquilini salvati in precedenza in localStorage da sincronizzare
          const localTenants = this.getLocalTenants();
          if (localTenants.length > 0) {
            console.log('Migrazione automatica inquilini locali su Supabase...', localTenants.length);
            const migrated: Tenant[] = [];
            for (const t of localTenants) {
              const row = {
                guest_name: t.name,
                guest_phone: t.phone || '',
                guest_email: t.email || '',
                guest_document: '',
                room_id: t.room_id,
                check_in: t.start_date,
                check_out: t.end_date,
                guests_count: 1,
                total_price: t.monthly_rent,
                deposit_paid: t.deposit_amount,
                payment_status: 'paid',
                booking_status: t.is_active ? 'confirmed' : 'checked_out',
                platform: 'student',
                notes: t.notes || '',
              };
              const { data: insData } = await supabase.from('bookings').insert(row).select().single();
              if (insData) {
                migrated.push({ ...t, id: insData.id });
              }
            }
            if (migrated.length > 0) {
              localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(migrated));
              return migrated;
            }
          }

          return [];
        }
      } catch (e) {
        console.warn('Errore lettura tenant da Supabase:', e);
      }
    }

    const local = this.getLocalTenants();
    return local.length > 0 ? local : SEED_TENANTS;
  }

  static async saveTenant(tenant: Tenant): Promise<Tenant> {
    const supabase = getSupabase();
    const isExistingRecord = isUUID(tenant.id);

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

        if (!isExistingRecord) {
          const { data, error } = await supabase.from('bookings').insert(row).select().single();
          if (!error && data) {
            const savedTenant: Tenant = { ...tenant, id: data.id };
            const list = this.getLocalTenants();
            const idx = list.findIndex(t => t.id === tenant.id);
            if (idx >= 0) list[idx] = savedTenant;
            else list.push(savedTenant);
            localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(list));
            return savedTenant;
          } else {
            console.error('Errore insert tenant Supabase:', error);
          }
        } else {
          const { data, error } = await supabase.from('bookings').update(row).eq('id', tenant.id).select().single();
          if (!error && data) {
            const list = this.getLocalTenants();
            const idx = list.findIndex(t => t.id === tenant.id);
            if (idx >= 0) list[idx] = tenant;
            else list.push(tenant);
            localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(list));
            return tenant;
          } else {
            console.error('Errore update tenant Supabase:', error);
          }
        }
      } catch (e) {
        console.warn('Errore salvataggio tenant Supabase:', e);
      }
    }

    const list = this.getLocalTenants();
    let saved: Tenant;
    if (!tenant.id || !isExistingRecord) {
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
    if (supabase && isUUID(tenantId)) {
      try {
        await supabase.from('bookings').delete().eq('id', tenantId);
      } catch (e) {
        console.warn('Errore cancellazione tenant da Supabase:', e);
      }
    }

    const list = this.getLocalTenants();
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
          if (data.length > 0) {
            const list: Payment[] = data.map((row: any) => {
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
            localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(list));
            return list;
          }

          // Se Supabase ha 0 pagamenti, sincronizza quelli locali se presenti
          const localPayments = this.getLocalPayments();
          if (localPayments.length > 0) {
            console.log('Migrazione automatica pagamenti locali su Supabase...');
            const migrated: Payment[] = [];
            for (const p of localPayments) {
              const meta = {
                tenant_id: p.tenant_id,
                tenant_name: p.tenant_name,
                room_id: p.room_id,
                month_key: p.month_key,
                month_label: p.month_label,
                year: p.year,
                payment_method: p.payment_method,
                notes: p.notes || '',
              };
              const row = {
                category: 'canone_affitto',
                title: `Canone ${p.month_label} - ${p.tenant_name}`,
                amount: p.amount,
                date: p.payment_date,
                notes: JSON.stringify(meta),
              };
              const { data: insData } = await supabase.from('expenses').insert(row).select().single();
              if (insData) {
                migrated.push({ ...p, id: insData.id });
              }
            }
            if (migrated.length > 0) {
              localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(migrated));
              return migrated;
            }
          }

          return [];
        }
      } catch (e) {
        console.warn('Errore fetch pagamenti Supabase:', e);
      }
    }

    const local = this.getLocalPayments();
    return local.length > 0 ? local : SEED_PAYMENTS;
  }

  static async recordPayment(payment: Payment): Promise<Payment> {
    const supabase = getSupabase();
    const isExistingRecord = isUUID(payment.id);

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

        if (!isExistingRecord) {
          const { data, error } = await supabase.from('expenses').insert(row).select().single();
          if (!error && data) {
            const savedPayment: Payment = { ...payment, id: data.id };
            const list = this.getLocalPayments();
            list.unshift(savedPayment);
            localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(list));
            return savedPayment;
          }
        } else {
          await supabase.from('expenses').update(row).eq('id', payment.id);
          const list = this.getLocalPayments();
          const idx = list.findIndex(p => p.id === payment.id);
          if (idx >= 0) list[idx] = payment;
          localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(list));
          return payment;
        }
      } catch (e) {
        console.warn('Errore salvataggio pagamento Supabase:', e);
      }
    }

    const list = this.getLocalPayments();
    let saved: Payment;
    if (!isExistingRecord) {
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
    if (supabase && isUUID(paymentId)) {
      try {
        await supabase.from('expenses').delete().eq('id', paymentId);
      } catch (e) {
        console.warn('Errore cancellazione pagamento da Supabase:', e);
      }
    }

    const list = this.getLocalPayments();
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
          const list: HouseExpense[] = data.map((row: any) => {
            let noteText = row.notes || '';
            let splits = undefined;
            if (typeof noteText === 'string' && noteText.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(noteText);
                noteText = parsed.text || '';
                if (Array.isArray(parsed.splits)) {
                  splits = parsed.splits;
                }
              } catch {
                // fallback a testo puro
              }
            }

            return {
              id: row.id,
              title: row.title,
              category: row.category as any,
              amount: Number(row.amount),
              date: row.date,
              notes: noteText,
              splits: splits,
              created_at: row.created_at,
            };
          });
          localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(list));
          return list;
        }
      } catch (e) {
        console.warn('Errore fetch spese Supabase:', e);
      }
    }

    const local = this.getLocalExpenses();
    return local.length > 0 ? local : SEED_EXPENSES;
  }

  static async saveExpense(expense: HouseExpense): Promise<HouseExpense> {
    const supabase = getSupabase();
    const isExistingRecord = isUUID(expense.id);

    const serializedNotes = (expense.splits && expense.splits.length > 0)
      ? JSON.stringify({ text: expense.notes || '', splits: expense.splits })
      : (expense.notes || '');

    if (supabase) {
      try {
        const row = {
          category: expense.category,
          title: expense.title,
          amount: expense.amount,
          date: expense.date,
          notes: serializedNotes,
        };
        if (!isExistingRecord) {
          const { data, error } = await supabase.from('expenses').insert(row).select().single();
          if (!error && data) {
            const savedExpense: HouseExpense = { ...expense, id: data.id };
            const list = this.getLocalExpenses();
            list.unshift(savedExpense);
            localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(list));
            return savedExpense;
          }
        } else {
          await supabase.from('expenses').update(row).eq('id', expense.id);
          const list = this.getLocalExpenses();
          const idx = list.findIndex(e => e.id === expense.id);
          if (idx >= 0) list[idx] = expense;
          localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(list));
          return expense;
        }
      } catch (e) {
        console.warn('Errore salvataggio spesa su Supabase:', e);
      }
    }

    const list = this.getLocalExpenses();
    let saved: HouseExpense;
    if (!isExistingRecord) {
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
    if (supabase && isUUID(expenseId)) {
      try {
        await supabase.from('expenses').delete().eq('id', expenseId);
      } catch (e) {
        console.warn('Errore delete spesa Supabase:', e);
      }
    }

    const list = this.getLocalExpenses();
    const filtered = list.filter(e => e.id !== expenseId);
    localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(filtered));
    return true;
  }
}
