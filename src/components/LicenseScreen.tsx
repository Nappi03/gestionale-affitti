import { useState, type FC } from 'react';
import { 
  Building2, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Receipt, 
  CheckCircle2, 
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

interface LicenseScreenProps {
  onOpenAdminModal?: () => void;
}

export const LicenseScreen: FC<LicenseScreenProps> = ({ onOpenAdminModal }) => {
  const { 
    license, 
    licenseKey, 
    status, 
    errorMessage, 
    loginWithKey, 
    logout, 
    enableGuestMode 
  } = useLicense();

  const [inputKey, setInputKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const clean = inputKey.trim().toUpperCase();
    if (!clean) {
      setLocalError('Inserisci una chiave licenza valida.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginWithKey(clean);
      if (!res.success && res.error) {
        setLocalError(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- STATO KILL SWITCH: LICENZA SOSPESA O SCADUTA ---
  const isSuspendedOrExpired = status === 'suspended' || status === 'expired';

  if (isSuspendedOrExpired) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'radial-gradient(ellipse at top, rgba(239, 68, 68, 0.18) 0%, transparent 60%), var(--bg-app)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 460,
          background: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 24px',
          boxShadow: '0 25px 60px rgba(239, 68, 68, 0.2)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: 16,
          }}>
            <ShieldAlert size={30} />
          </div>

          <h2 style={{ fontSize: '1.45rem', color: '#ffffff', fontWeight: 800, marginBottom: 8 }}>
            {status === 'suspended' ? 'Licenza Temporaneamente Sospesa' : 'Licenza Scaduta'}
          </h2>

          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: '0.84rem',
            color: '#fca5a5',
            lineHeight: 1.5,
          }}>
            Gentile <strong>{license?.client_name || 'Proprietario'}</strong>, l'accesso al gestionale per l'immobile <strong>{license?.property_name || 'assegnato'}</strong> (chiave: <code>{licenseKey}</code>) risulta momentaneamente bloccato per mancato rinnovo o termine del periodo attivo.
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            I tuoi dati, inquilini e pagamenti rimangono custoditi al sicuro nel database e saranno nuovamente accessibili non appena la licenza verrà riattivata dall'amministratore.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Pulsante Contatto WhatsApp / Supporto */}
            <a
              href="https://wa.me/?text=Buongiorno,%20vorrei%20riattivare%20la%20mia%20licenza%20DomusRent."
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                justifyContent: 'center',
                background: '#10b981',
                borderColor: '#10b981',
                fontSize: '0.9rem',
                gap: 8,
              }}
            >
              <MessageCircle size={18} />
              <span>Contatta l'Amministratore per Riattivare</span>
            </a>

            {/* Pulsante cambia chiave / logout */}
            <button
              type="button"
              onClick={logout}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '0.84rem' }}
            >
              <KeyRound size={15} />
              <span>Inserisci un'altra chiave licenza</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STATO NORMALE: SCHERMATA ACCESSO CON CHIAVE LICENZA ---
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.16) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(16, 185, 129, 0.12) 0%, transparent 60%), var(--bg-app)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(14, 22, 38, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        padding: '34px 26px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Brand */}
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

          <h1 style={{ fontSize: '1.65rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
            DomusRent
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4 }}>
            Accesso Riservato Proprietari Imobiliari
          </p>
        </div>

        {/* Error notification */}
        {(localError || errorMessage) && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.14)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '11px 14px',
            marginBottom: 18,
            color: '#fb7185',
            fontSize: '0.82rem',
            lineHeight: 1.4,
          }}>
            {localError || errorMessage}
          </div>
        )}

        {/* License form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Chiave Licenza Immobile</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Fornita dall'amministratore</span>
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={17} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 38, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                placeholder="ES: DOMUS-ROSSI-2026"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                required
                autoFocus
              />
            </div>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 5, display: 'block' }}>
              Hai già un link personalizzato? Aprilo direttamente per accedere senza inserire la chiave.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.92rem', justifyContent: 'center' }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Verifica Licenza in corso...</span>
              </>
            ) : (
              <>
                <span>Entra nel Gestionale</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Highlights */}
        <div style={{
          marginTop: 24,
          paddingTop: 18,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          fontSize: '0.76rem',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>Nessuna registrazione o password da memorizzare</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Receipt size={14} color="#818cf8" />
            <span>Ripartizione bollette e solleciti WhatsApp in 1 click</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ShieldCheck size={14} color="#38bdf8" />
            <span>Dati salvati in cloud privati con isolamento licenza</span>
          </div>
        </div>

        {/* Demo Button */}
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

        {/* Admin Link at the very bottom */}
        {onOpenAdminModal && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              onClick={onOpenAdminModal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                opacity: 0.65,
              }}
            >
              🔒 Sei l'amministratore? Gestisci o crea licenze
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
