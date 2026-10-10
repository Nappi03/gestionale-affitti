import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react';
import type { AppLicense } from '../types';
import { LicenseService } from '../services/licenseService';

interface LicenseContextType {
  license: AppLicense | null;
  licenseKey: string | null;
  status: 'active' | 'suspended' | 'expired' | 'not_found' | 'demo' | 'admin' | null;
  loading: boolean;
  isAdmin: boolean;
  isGuestMode: boolean;
  errorMessage: string | null;
  loginWithKey: (key: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  enableGuestMode: () => void;
  refreshLicenseStatus: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

const STORAGE_KEY_ACTIVE_LICENSE = 'domus_active_license_key';
const STORAGE_KEY_GUEST_MODE = 'domus_guest_mode_active';

export const LicenseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<AppLicense | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'suspended' | 'expired' | 'not_found' | 'demo' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_GUEST_MODE) === 'true';
  });

  const checkLicense = async (key: string): Promise<boolean> => {
    try {
      const res = await LicenseService.verifyLicense(key);
      setStatus(res.status);
      setLicense(res.license || null);
      setLicenseKey(key.trim().toUpperCase());

      if (res.valid) {
        setErrorMessage(null);
        localStorage.setItem(STORAGE_KEY_ACTIVE_LICENSE, key.trim().toUpperCase());
        localStorage.removeItem(STORAGE_KEY_GUEST_MODE);
        setIsGuestMode(false);
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
      // 1. Controlla parametri URL (es. ?licenza=DOMUS-ROSSI o ?key=... oppure ?admin)
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('licenza') || urlParams.get('key') || urlParams.get('license');

      if (urlParams.has('admin') || urlParams.has('master')) {
        await checkLicense('DOMUS-ADMIN');
        setLoading(false);
        return;
      }

      if (urlKey) {
        await checkLicense(urlKey);
        setLoading(false);
        return;
      }

      // 2. Controlla chiave salvata precedentemente in localStorage
      const savedKey = localStorage.getItem(STORAGE_KEY_ACTIVE_LICENSE);
      if (savedKey) {
        await checkLicense(savedKey);
        setLoading(false);
        return;
      }

      // 3. Controlla modalità demo salvata
      if (localStorage.getItem(STORAGE_KEY_GUEST_MODE) === 'true') {
        setIsGuestMode(true);
        setStatus('demo');
      }

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
    localStorage.removeItem(STORAGE_KEY_ACTIVE_LICENSE);
    localStorage.removeItem(STORAGE_KEY_GUEST_MODE);
    setLicense(null);
    setLicenseKey(null);
    setStatus(null);
    setIsGuestMode(false);
    setErrorMessage(null);
  };

  const enableGuestMode = () => {
    localStorage.setItem(STORAGE_KEY_GUEST_MODE, 'true');
    localStorage.removeItem(STORAGE_KEY_ACTIVE_LICENSE);
    setIsGuestMode(true);
    setStatus('demo');
    setLicense({
      id: 'demo-local',
      license_key: 'DEMO',
      client_name: 'Proprietario Demo',
      property_name: 'Appartamento 2 Camere (Test Locale)',
      is_active: true,
    });
    setLicenseKey('DEMO');
  };

  const refreshLicenseStatus = async () => {
    if (licenseKey && status !== 'demo') {
      await checkLicense(licenseKey);
    }
  };

  const isAdmin = status === 'admin' || licenseKey === 'DOMUS-ADMIN' || licenseKey === 'ADMIN';

  return (
    <LicenseContext.Provider
      value={{
        license,
        licenseKey,
        status,
        loading,
        isAdmin,
        isGuestMode,
        errorMessage,
        loginWithKey,
        logout,
        enableGuestMode,
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
