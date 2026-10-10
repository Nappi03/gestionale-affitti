import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react';
import type { AppLicense } from '../types';
import { LicenseService } from '../services/licenseService';

interface LicenseContextType {
  license: AppLicense | null;
  licenseKey: string | null;
  status: 'active' | 'suspended' | 'expired' | 'not_found' | 'demo' | 'admin' | null;
  loading: boolean;
  isAdmin: boolean;
  errorMessage: string | null;
  loginWithKey: (key: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshLicenseStatus: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<AppLicense | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'suspended' | 'expired' | 'not_found' | 'demo' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkLicense = async (key: string): Promise<boolean> => {
    try {
      const res = await LicenseService.verifyLicense(key);
      setStatus(res.status);
      setLicense(res.license || null);
      setLicenseKey(key.trim().toUpperCase());

      if (res.valid) {
        setErrorMessage(null);
        return true;
      } else {
        setErrorMessage(res.message || 'Licenza non valida.');
        return false;
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Errore durante la verifica della licenza.');
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      // Pulizia immediata e totale: nessuna credenziale/licenza deve persistere in localStorage tra sessioni/URL
      try {
        localStorage.removeItem('domus_active_license_key');
        localStorage.removeItem('domus_guest_mode_active');
        localStorage.removeItem('domus_current_auth_user_id');
        localStorage.removeItem('domus_current_auth_user_email');
      } catch {}

      // 1. Controlla parametri URL (es. ?licenza=DOMUS-... oppure ?admin)
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('licenza') || urlParams.get('key') || urlParams.get('license');

      if (urlParams.has('admin') || urlParams.has('master') || urlParams.has('gestione')) {
        setStatus('admin');
        setLicense(null);
        setLicenseKey(null);
        setLoading(false);
        return;
      }

      if (urlKey) {
        await checkLicense(urlKey);
        setLoading(false);
        return;
      }

      // 2. Se l'URL non ha licenza e non è admin (es. http://localhost:5173/ o rimozione di /?admin):
      // Accesso rigorosamente bloccato, nessun dato o studente caricato.
      setStatus('not_found');
      setLicense(null);
      setLicenseKey(null);
      setLoading(false);
    };

    init();
  }, []);

  const loginWithKey = async (rawKey: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setErrorMessage(null);
    const success = await checkLicense(rawKey);
    setLoading(false);
    return {
      success,
      error: errorMessage || undefined,
    };
  };

  const logout = () => {
    setLicense(null);
    setLicenseKey(null);
    setStatus('not_found');
    setErrorMessage(null);
  };

  const refreshLicenseStatus = async () => {
    if (licenseKey) {
      await checkLicense(licenseKey);
    }
  };

  const isAdmin = status === 'admin';

  return (
    <LicenseContext.Provider
      value={{
        license,
        licenseKey,
        status,
        loading,
        isAdmin,
        errorMessage,
        loginWithKey,
        logout,
        refreshLicenseStatus,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense deve essere utilizzato all\'interno di un LicenseProvider');
  }
  return context;
};
