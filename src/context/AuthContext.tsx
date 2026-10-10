import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuestMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  enableGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'domus_guest_mode_active';

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.setItem('domus_current_auth_user_id', session.user.id);
        localStorage.setItem('domus_current_auth_user_email', session.user.email || '');
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuestMode(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
        localStorage.setItem('domus_current_auth_user_id', session.user.id);
        localStorage.setItem('domus_current_auth_user_email', session.user.email || '');
      } else {
        localStorage.removeItem('domus_current_auth_user_id');
        localStorage.removeItem('domus_current_auth_user_email');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Database Supabase non configurato.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Email o password errati. Riprova.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Email non ancora confermata. Controlla la tua casella di posta.' };
        }
        return { error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      setIsGuestMode(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Errore imprevisto durante l\'accesso.' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Database Supabase non configurato.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'Un account con questa email esiste già. Effettua l\'accesso.' };
        }
        if (error.message.includes('at least 6 characters')) {
          return { error: 'La password deve contenere almeno 6 caratteri.' };
        }
        return { error: error.message };
      }

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        setIsGuestMode(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
        return { error: null, needsEmailConfirmation: false };
      } else {
        return { error: null, needsEmailConfirmation: true };
      }
    } catch (e: any) {
      return { error: e.message || 'Errore imprevisto durante la registrazione.' };
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsGuestMode(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem('domus_current_auth_user_id');
    localStorage.removeItem('domus_current_auth_user_email');
  };

  const enableGuestMode = () => {
    setIsGuestMode(true);
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
  };

  const exitGuestMode = () => {
    setIsGuestMode(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isGuestMode,
        signIn,
        signUp,
        signOut,
        enableGuestMode,
        exitGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};
