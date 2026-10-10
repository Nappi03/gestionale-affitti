import { getSupabase } from '../lib/supabase';
import type { AppLicense } from '../types';

const LOCAL_LICENSES_CACHE_KEY = 'domus_licenses_local_cache';

export type LicenseVerifyResult = {
  valid: boolean;
  status: 'active' | 'suspended' | 'expired' | 'not_found' | 'demo' | 'admin';
  license?: AppLicense;
  message?: string;
};

export class LicenseService {
  /**
   * Recupera tutte le licenze registrate (per il pannello Amministratore).
   */
  static async getLicenses(): Promise<AppLicense[]> {
    const supabase = getSupabase();
    if (supabase) {
      // 1. Prova prima dalla tabella dedicata app_licenses
      try {
        const { data, error } = await supabase.from('app_licenses').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          localStorage.setItem(LOCAL_LICENSES_CACHE_KEY, JSON.stringify(data));
          return data as AppLicense[];
        }
      } catch {
        // Tabella app_licenses non ancora creata, procedi con fallback
      }

      // 2. Fallback trasparente: tabella expenses con category = 'system_license'
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('category', 'system_license')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const parsed: AppLicense[] = [];
          for (const row of data) {
            try {
              const meta = JSON.parse(row.notes || '{}');
              parsed.push({
                id: row.id,
                license_key: meta.license_key || 'LIC-UNKNOWN',
                client_name: meta.client_name || row.title,
                property_name: meta.property_name || 'Appartamento',
                is_active: meta.is_active !== false,
                expires_at: meta.expires_at || undefined,
                contact_phone: meta.contact_phone || '',
                notes: meta.notes || '',
                created_at: row.created_at,
              });
            } catch {
              // skip invalid notes
            }
          }
          localStorage.setItem(LOCAL_LICENSES_CACHE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      } catch (e) {
        console.warn('Errore lettura licenze fallback:', e);
      }
    }

    // Lettura da cache locale
    const cached = localStorage.getItem(LOCAL_LICENSES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  /**
   * Verifica se una chiave licenza è valida, attiva o sospesa.
   */
  static async verifyLicense(rawKey: string): Promise<LicenseVerifyResult> {
    const key = (rawKey || '').trim().toUpperCase();
    if (!key) {
      return { valid: false, status: 'not_found', message: 'Nessuna chiave licenza specificata.' };
    }

    const all = await this.getLicenses();
    const found = all.find((l) => l.license_key.toUpperCase() === key);

    if (!found) {
      return {
        valid: false,
        status: 'not_found',
        message: 'Chiave licenza non riconosciuta. Controlla il codice o contatta il supporto.',
      };
    }

    // Controllo Kill Switch (Attiva / Sospesa)
    if (!found.is_active) {
      return {
        valid: false,
        status: 'suspended',
        license: found,
        message: 'Licenza momentaneamente sospesa. Contatta l\'amministratore per rinnovare il piano.',
      };
    }

    // Controllo Data di Scadenza
    if (found.expires_at) {
      const today = new Date().toISOString().split('T')[0];
      if (found.expires_at < today) {
        return {
          valid: false,
          status: 'expired',
          license: found,
          message: `Licenza scaduta in data ${found.expires_at}. Contatta l'amministratore per il rinnovo.`,
        };
      }
    }

    return {
      valid: true,
      status: 'active',
      license: found,
    };
  }

  /**
   * Crea una nuova licenza per un cliente
   */
  static async createLicense(licenseData: Omit<AppLicense, 'id' | 'created_at'>): Promise<AppLicense> {
    const cleanKey = licenseData.license_key.trim().toUpperCase();
    const supabase = getSupabase();

    // 1. Prova tabella app_licenses
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('app_licenses')
          .insert({
            license_key: cleanKey,
            client_name: licenseData.client_name,
            property_name: licenseData.property_name || 'Appartamento 2 Camere',
            is_active: licenseData.is_active !== false,
            expires_at: licenseData.expires_at || null,
            contact_phone: licenseData.contact_phone || '',
            notes: licenseData.notes || '',
          })
          .select()
          .single();

        if (!error && data) {
          const created = data as AppLicense;
          await this.getLicenses(); // ricarica cache
          return created;
        }
      } catch {
        // prosegui con fallback
      }

      // 2. Fallback in tabella expenses
      try {
        const meta = {
          license_key: cleanKey,
          client_name: licenseData.client_name,
          property_name: licenseData.property_name || 'Appartamento 2 Camere',
          is_active: licenseData.is_active !== false,
          expires_at: licenseData.expires_at || null,
          contact_phone: licenseData.contact_phone || '',
          notes: licenseData.notes || '',
        };

        const { data, error } = await supabase
          .from('expenses')
          .insert({
            category: 'system_license',
            title: licenseData.client_name,
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            notes: JSON.stringify(meta),
          })
          .select()
          .single();

        if (!error && data) {
          const created: AppLicense = {
            id: data.id,
            ...meta,
            created_at: data.created_at,
          };
          await this.getLicenses();
          return created;
        }
      } catch (e) {
        console.error('Errore fallback salvataggio licenza:', e);
      }
    }

    // Fallback esclusivamente locale
    const localId = `lic-${Date.now()}`;
    const newLic: AppLicense = {
      id: localId,
      ...licenseData,
      license_key: cleanKey,
      created_at: new Date().toISOString(),
    };
    const list = await this.getLicenses();
    list.unshift(newLic);
    localStorage.setItem(LOCAL_LICENSES_CACHE_KEY, JSON.stringify(list));
    return newLic;
  }

  /**
   * KILL SWITCH: Attiva o sospende istantaneamente una licenza
   */
  static async toggleLicenseActive(licenseId: string, isActive: boolean): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      // Prova tabella app_licenses
      try {
        const { error } = await supabase
          .from('app_licenses')
          .update({ is_active: isActive })
          .eq('id', licenseId);
        if (!error) {
          await this.getLicenses();
          return true;
        }
      } catch {
        // fallback
      }

      // Fallback tabella expenses
      try {
        const { data } = await supabase.from('expenses').select('*').eq('id', licenseId).single();
        if (data && data.notes) {
          const meta = JSON.parse(data.notes);
          meta.is_active = isActive;
          await supabase.from('expenses').update({ notes: JSON.stringify(meta) }).eq('id', licenseId);
          await this.getLicenses();
          return true;
        }
      } catch (e) {
        console.warn('Errore toggle licenza fallback:', e);
      }
    }

    // Cache locale
    const list = await this.getLicenses();
    const item = list.find((l) => l.id === licenseId);
    if (item) {
      item.is_active = isActive;
      localStorage.setItem(LOCAL_LICENSES_CACHE_KEY, JSON.stringify(list));
      return true;
    }
    return false;
  }

  /**
   * Modifica i dati di una licenza cliente esistente
   */
  static async updateLicense(licenseId: string, updates: Partial<Omit<AppLicense, 'id' | 'created_at'>>): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      // 1. Tabella app_licenses
      try {
        const payload: any = {};
        if (updates.client_name !== undefined) payload.client_name = updates.client_name.trim();
        if (updates.property_name !== undefined) payload.property_name = updates.property_name.trim();
        if (updates.contact_phone !== undefined) payload.contact_phone = updates.contact_phone.trim();
        if (updates.expires_at !== undefined) payload.expires_at = updates.expires_at || null;
        if (updates.is_active !== undefined) payload.is_active = updates.is_active;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        if (updates.license_key !== undefined) payload.license_key = updates.license_key.trim().toUpperCase();

        const { error } = await supabase
          .from('app_licenses')
          .update(payload)
          .eq('id', licenseId);
        if (!error) {
          await this.getLicenses();
          return true;
        }
      } catch (e) {
        console.warn('Errore update app_licenses:', e);
      }

      // 2. Fallback tabella expenses (category: system_license)
      try {
        const { data } = await supabase.from('expenses').select('*').eq('id', licenseId).single();
        if (data && data.notes) {
          let meta: any = {};
          try {
            meta = JSON.parse(data.notes);
          } catch {}
          const updatedMeta = { ...meta, ...updates };
          if (updates.license_key) updatedMeta.license_key = updates.license_key.trim().toUpperCase();

          await supabase.from('expenses').update({
            title: updates.client_name || data.title,
            notes: JSON.stringify(updatedMeta),
          }).eq('id', licenseId);
          await this.getLicenses();
          return true;
        }
      } catch (e) {
        console.warn('Errore update licenza fallback expenses:', e);
      }
    }

    // Cache locale
    const list = await this.getLicenses();
    const idx = list.findIndex((l) => l.id === licenseId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...updates,
        ...(updates.license_key ? { license_key: updates.license_key.trim().toUpperCase() } : {}),
      };
      localStorage.setItem(LOCAL_LICENSES_CACHE_KEY, JSON.stringify(list));
      return true;
    }
    return false;
  }

  /**
   * Elimina una licenza
   */
  static async deleteLicense(licenseId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('app_licenses').delete().eq('id', licenseId);
      } catch {}
      try {
        await supabase.from('expenses').delete().eq('id', licenseId);
      } catch {}
    }

    const list = await this.getLicenses();
    const filtered = list.filter((l) => l.id !== licenseId);
    localStorage.setItem(LOCAL_LICENSES_CACHE_KEY, JSON.stringify(filtered));
    return true;
  }
}
