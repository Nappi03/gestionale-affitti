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

const isUUID = (str?: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export function getCurrentLicenseKey(): string | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlLic = params.get('licenza') || params.get('key') || params.get('license');
    if (urlLic) return urlLic.trim().toUpperCase();
  }
  return null;
}

function getScopedKey(baseKey: string): string {
  const licenseKey = getCurrentLicenseKey();
  if (licenseKey) {
    return `${baseKey}_${licenseKey}`;
  }
  return `${baseKey}_unauthorized`;
}

function cleanRowForSupabase(row: any): any {
  const clean = { ...row };
  // La colonna user_id in Supabase è di tipo UUID.
  // Se non è un UUID valido (es. stringa licenza 'DOMUS-FRANCESCO-NAPPI'), rimuovila per evitare errore 22P02!
  if (clean.user_id !== undefined && !isUUID(clean.user_id)) {
    delete clean.user_id;
  }
  return clean;
}

async function safeInsert(table: string, rawRow: any): Promise<{ data: any; error: any }> {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase non disponibile') };
  const row = cleanRowForSupabase(rawRow);
  let { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) {
    console.warn(`safeInsert su ${table} fallito:`, error);
    if (row.user_id) {
      const { user_id, ...fallbackRow } = row;
      const retry = await supabase.from(table).insert(fallbackRow).select().single();
      if (!retry.error) return retry;
    }
  }
  return { data, error };
}

async function safeUpdate(table: string, id: string, rawRow: any): Promise<{ data: any; error: any }> {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase non disponibile') };
  const row = cleanRowForSupabase(rawRow);
  let { data, error } = await supabase.from(table).update(row).eq('id', id).select().single();
  if (error) {
    console.warn(`safeUpdate su ${table} fallito:`, error);
    if (row.user_id) {
      const { user_id, ...fallbackRow } = row;
      const retry = await supabase.from(table).update(fallbackRow).eq('id', id).select().single();
      if (!retry.error) return retry;
    }
  }
  return { data, error };
}

export class StorageService {
  // Scoped localStorage Helpers: bloccati rigorosamente se non c'è una licenza attiva
  static getLocalTenants(): Tenant[] {
    const key = getCurrentLicenseKey();
    if (!key) return [];
    const scopedKey = getScopedKey(LOCAL_STORAGE_TENANTS_KEY);
    let raw = localStorage.getItem(scopedKey);
    // Solo per DOMUS-FRANCESCO-NAPPI recupera la cache legacy iniziale se non ancora migrata
    if (!raw && key === 'DOMUS-FRANCESCO-NAPPI') {
      raw = localStorage.getItem(LOCAL_STORAGE_TENANTS_KEY);
    }
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static setLocalTenants(data: Tenant[]): void {
    const key = getCurrentLicenseKey();
    if (!key) return;
    const scopedKey = getScopedKey(LOCAL_STORAGE_TENANTS_KEY);
    localStorage.setItem(scopedKey, JSON.stringify(data));
  }

  static getLocalPayments(): Payment[] {
    const key = getCurrentLicenseKey();
    if (!key) return [];
    const scopedKey = getScopedKey(LOCAL_STORAGE_PAYMENTS_KEY);
    let raw = localStorage.getItem(scopedKey);
    if (!raw && key === 'DOMUS-FRANCESCO-NAPPI') {
      raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
    }
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static setLocalPayments(data: Payment[]): void {
    const key = getCurrentLicenseKey();
    if (!key) return;
    const scopedKey = getScopedKey(LOCAL_STORAGE_PAYMENTS_KEY);
    localStorage.setItem(scopedKey, JSON.stringify(data));
  }

  static getLocalExpenses(): HouseExpense[] {
    const key = getCurrentLicenseKey();
    if (!key) return [];
    const scopedKey = getScopedKey(LOCAL_STORAGE_EXPENSES_KEY);
    let raw = localStorage.getItem(scopedKey);
    if (!raw && key === 'DOMUS-FRANCESCO-NAPPI') {
      raw = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    }
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static setLocalExpenses(data: HouseExpense[]): void {
    const key = getCurrentLicenseKey();
    if (!key) return;
    const scopedKey = getScopedKey(LOCAL_STORAGE_EXPENSES_KEY);
    localStorage.setItem(scopedKey, JSON.stringify(data));
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
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) return [];

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && data) {
          // Filtro multi-tenant rigoroso per licenza
          const userRows = data.filter((row: any) => {
            if (currentKey === 'DOMUS-ADMIN' || currentKey === 'ADMIN') return true;
            const rowLic = (row.platform || row.user_id || '').trim().toUpperCase();
            return rowLic === currentKey;
          });

          const list: Tenant[] = userRows.map((row: any) => ({
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

          this.setLocalTenants(list);
          return list;
        }
      } catch (e) {
        console.warn('Errore lettura tenant da Supabase:', e);
      }
    }

    return this.getLocalTenants();
  }

  static async saveTenant(tenant: Tenant): Promise<Tenant> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) throw new Error('Operazione non autorizzata: nessuna licenza attiva.');

    const supabase = getSupabase();
    const isExistingRecord = isUUID(tenant.id);

    if (supabase) {
      try {
        const row: any = {
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
          platform: currentKey,
          notes: tenant.notes || '',
          ...(isUUID(currentKey) ? { user_id: currentKey } : {}),
        };

        if (!isExistingRecord) {
          const { data, error } = await safeInsert('bookings', row);
          if (!error && data) {
            const savedTenant: Tenant = { ...tenant, id: data.id };
            const list = this.getLocalTenants();
            const idx = list.findIndex(t => t.id === tenant.id);
            if (idx >= 0) list[idx] = savedTenant;
            else list.push(savedTenant);
            this.setLocalTenants(list);
            return savedTenant;
          } else {
            console.error('Errore insert tenant Supabase:', error);
          }
        } else {
          const { data, error } = await safeUpdate('bookings', tenant.id, row);
          if (!error && data) {
            const list = this.getLocalTenants();
            const idx = list.findIndex(t => t.id === tenant.id);
            if (idx >= 0) list[idx] = tenant;
            else list.push(tenant);
            this.setLocalTenants(list);
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
    this.setLocalTenants(list);
    return saved;
  }

  static async archiveTenant(tenantId: string): Promise<boolean> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) return false;
    const list = await this.getTenants();
    const tenant = list.find(t => t.id === tenantId);
    if (!tenant) return false;
    tenant.is_active = false;
    tenant.end_date = new Date().toISOString().split('T')[0];
    await this.saveTenant(tenant);
    return true;
  }

  static async deleteTenant(tenantId: string): Promise<boolean> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) return false;
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
    this.setLocalTenants(filtered);
    return true;
  }

  // --- PAYMENTS ARCHIVE (Archivio Storico Pagamenti Negli Anni) ---
  static async getPayments(): Promise<Payment[]> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) return [];

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('category', 'canone_affitto')
          .order('date', { ascending: false });

        if (!error && data) {
          const userRows = data.filter((row: any) => {
            if (currentKey === 'DOMUS-ADMIN' || currentKey === 'ADMIN') return true;
            let meta: any = {};
            try {
              if (row.notes && row.notes.startsWith('{')) meta = JSON.parse(row.notes);
            } catch {}
            const lic = (meta.license_key || row.user_id || '').trim().toUpperCase();
            return lic === currentKey;
          });

          const list: Payment[] = userRows.map((row: any) => {
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

          this.setLocalPayments(list);
          return list;
        }
      } catch (e) {
        console.warn('Errore fetch pagamenti Supabase:', e);
      }
    }

    return this.getLocalPayments();
  }

  static async recordPayment(payment: Payment): Promise<Payment> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) throw new Error('Operazione non autorizzata: nessuna licenza attiva.');

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
      license_key: currentKey,
    };

    if (supabase) {
      try {
        const row: any = {
          category: 'canone_affitto',
          title: `Canone ${payment.month_label} - ${payment.tenant_name}`,
          amount: payment.amount,
          date: payment.payment_date,
          notes: JSON.stringify(meta),
          ...(isUUID(currentKey) ? { user_id: currentKey } : {}),
        };

        if (!isExistingRecord) {
          const { data, error } = await safeInsert('expenses', row);
          if (!error && data) {
            const savedPayment: Payment = { ...payment, id: data.id };
            const list = this.getLocalPayments();
            list.unshift(savedPayment);
            this.setLocalPayments(list);
            return savedPayment;
          }
        } else {
          await safeUpdate('expenses', payment.id, row);
          const list = this.getLocalPayments();
          const idx = list.findIndex(p => p.id === payment.id);
          if (idx >= 0) list[idx] = payment;
          this.setLocalPayments(list);
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
    this.setLocalPayments(list);
    return saved;
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) return false;

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
    this.setLocalPayments(filtered);
    return true;
  }

  // --- HOUSE EXPENSES (Bollette & Spese) ---
  static async getExpenses(): Promise<HouseExpense[]> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) return [];

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .neq('category', 'canone_affitto')
          .neq('category', 'system_license')
          .order('date', { ascending: false });

        if (!error && data) {
          const userRows = data.filter((row: any) => {
            if (currentKey === 'DOMUS-ADMIN' || currentKey === 'ADMIN') return true;
            let parsedMeta: any = {};
            try {
              if (row.notes && row.notes.startsWith('{')) parsedMeta = JSON.parse(row.notes);
            } catch {}
            const lic = (parsedMeta.license_key || row.user_id || '').trim().toUpperCase();
            return lic === currentKey;
          });

          const list: HouseExpense[] = userRows.map((row: any) => {
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
                // fallback
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

          this.setLocalExpenses(list);
          return list;
        }
      } catch (e) {
        console.warn('Errore fetch spese Supabase:', e);
      }
    }

    return this.getLocalExpenses();
  }

  static async saveExpense(expense: HouseExpense): Promise<HouseExpense> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) throw new Error('Operazione non autorizzata: nessuna licenza attiva.');

    const supabase = getSupabase();
    const isExistingRecord = isUUID(expense.id);

    const metaObj = {
      text: expense.notes || '',
      splits: (expense.splits && expense.splits.length > 0) ? expense.splits : undefined,
      license_key: currentKey,
    };
    const serializedNotes = JSON.stringify(metaObj);

    if (supabase) {
      try {
        const row: any = {
          category: expense.category,
          title: expense.title,
          amount: expense.amount,
          date: expense.date,
          notes: serializedNotes,
          ...(isUUID(currentKey) ? { user_id: currentKey } : {}),
        };

        if (!isExistingRecord) {
          const { data, error } = await safeInsert('expenses', row);
          if (!error && data) {
            const savedExpense: HouseExpense = { ...expense, id: data.id };
            const list = this.getLocalExpenses();
            list.unshift(savedExpense);
            this.setLocalExpenses(list);
            return savedExpense;
          }
        } else {
          await safeUpdate('expenses', expense.id, row);
          const list = this.getLocalExpenses();
          const idx = list.findIndex(e => e.id === expense.id);
          if (idx >= 0) list[idx] = expense;
          this.setLocalExpenses(list);
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
    this.setLocalExpenses(list);
    return saved;
  }

  static async deleteExpense(expenseId: string): Promise<boolean> {
    const currentKey = (getCurrentLicenseKey() || '').trim().toUpperCase();
    if (!currentKey) return false;

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
    this.setLocalExpenses(filtered);
    return true;
  }
}
