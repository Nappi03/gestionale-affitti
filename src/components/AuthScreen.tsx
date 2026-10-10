import { useState, type FC } from 'react';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Receipt,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: FC = () => {
  const { signIn, signUp, enableGuestMode } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Inserisci sia l\'email che la password.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error);
        }
      } else {
        const { error, needsEmailConfirmation } = await signUp(email, password);
        if (error) {
          setErrorMsg(error);
        } else if (needsEmailConfirmation) {
          setSuccessMsg('Account creato! Controlla la tua email per confermare l\'indirizzo.');
        } else {
          setSuccessMsg('Account creato con successo! Accesso in corso...');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(16, 185, 129, 0.1) 0%, transparent 60%), var(--bg-app)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(14, 22, 38, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #10b981 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            marginBottom: 12,
          }}>
            <Building2 size={28} />
          </div>

          <h1 style={{ fontSize: '1.6rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
            DomusRent
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4 }}>
            Il gestionale personale per affitti stanze & studenti
          </p>
        </div>

        {/* Mode Switch (Accedi / Registrati) */}
        <div style={{
          display: 'flex',
          background: 'rgba(9, 14, 26, 0.7)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'signin' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Accedi
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Crea Account
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 16,
            color: '#fb7185',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={16} flex-shrink={0} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 16,
            color: '#34d399',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle2 size={16} flex-shrink={0} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Email Proprietario</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="nome@email.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 22 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === 'signup' && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Minimo 6 caratteri.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.92rem', justifyContent: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Elaborazione...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Entra nel Gestionale' : 'Crea il tuo Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Feature Points */}
        <div style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span>Controllo canoni & insoluti mese per mese</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Receipt size={13} color="#818cf8" />
            <span>Ripartizione bollette con quote studenti</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={13} color="#38bdf8" />
            <span>Solleciti WhatsApp automatici in 1 click</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={13} color="#10b981" />
            <span>Dati salvati in cloud privati con crittografia</span>
          </div>
        </div>

        {/* Demo Mode Button */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            type="button"
            onClick={enableGuestMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.76rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={13} color="#f59e0b" />
            <span>Oppure esplora subito in Modalità Demo Locale</span>
          </button>
        </div>
      </div>
    </div>
  );
};
