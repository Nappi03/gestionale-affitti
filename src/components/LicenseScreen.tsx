import type { FC } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  MessageCircle,
  Lock,
  CheckCircle2,
  Receipt,
  Users
} from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

export const LicenseScreen: FC = () => {
  const { license, status } = useLicense();

  // --- STATO 1: LICENZA SOSPESA O SCADUTA (KILL SWITCH) ---
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
          background: 'rgba(17, 24, 39, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 24px',
          boxShadow: '0 25px 60px rgba(239, 68, 68, 0.25)',
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
            {status === 'suspended' ? 'Accesso al Gestionale Sospeso' : 'Licenza Scaduta'}
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
            L'accesso al gestionale per l'immobile <strong>{license?.property_name || 'assegnato'}</strong> risulta momentaneamente bloccato per mancato rinnovo del servizio.
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            I tuoi dati, inquilini e pagamenti rimangono custoditi al sicuro nel database e saranno nuovamente accessibili non appena la licenza verrà riattivata dall'amministratore.
          </p>

          <div>
            <a
              href="https://wa.me/393669826904?text=Buongiorno,%20vorrei%20riattivare%20la%20mia%20licenza%20DomusRent."
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                justifyContent: 'center',
                background: '#10b981',
                borderColor: '#10b981',
                fontSize: '0.92rem',
                gap: 8,
              }}
            >
              <MessageCircle size={18} />
              <span>Contatta l'Amministratore per Riattivare</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- STATO 2: VISITA AL SITO SENZA LINK O LICENZA (ACCESSO RISERVATO) ---
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
        background: 'rgba(14, 22, 38, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        padding: '38px 28px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        textAlign: 'center',
      }}>
        {/* Brand */}
        <div 
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #10b981 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            marginBottom: 16,
            cursor: 'default',
          }}
          onDoubleClick={() => {
            window.location.href = '/?admin';
          }}
        >
          <Building2 size={30} />
        </div>

        <h1 style={{ fontSize: '1.65rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
          DomusRent
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: 20 }}>
          Piattaforma Gestionale per Affitti & Stanze
        </p>

        {/* Access Restricted Notice */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 14px',
          marginBottom: 24,
          textAlign: 'left',
          display: 'flex',
          gap: 12,
        }}>
          <Lock size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: '#ffffff', fontSize: '0.86rem', display: 'block', marginBottom: 4 }}>
              Accesso Riservato su Invito
            </strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Questa piattaforma è accessibile esclusivamente tramite il link personale fornito dall'amministratore. Se sei un proprietario, utilizza il link diretto che hai ricevuto per gestire il tuo immobile.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          textAlign: 'left',
          marginBottom: 24,
          padding: '0 6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>Controllo canoni & insoluti mese per mese</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={15} color="#818cf8" />
            <span>Ripartizione bollette con quote studenti</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="#38bdf8" />
            <span>Solleciti WhatsApp automatici in 1 click</span>
          </div>
        </div>

        {/* Contact WhatsApp */}
        <a
          href="https://wa.me/393669826904?text=Buongiorno,%20vorrei%20informazioni%20su%20DomusRent."
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ width: '100%', padding: '11px', justifyContent: 'center', fontSize: '0.86rem', gap: 8 }}
        >
          <MessageCircle size={16} />
          <span>Richiedi Accesso o Informazioni</span>
        </a>

        {/* Discreet Admin Link */}
        <div style={{ marginTop: 18 }}>
          <a
            href="/?admin"
            style={{
              fontSize: '0.73rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              opacity: 0.65,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Lock size={12} />
            <span>Accesso Amministratore</span>
          </a>
        </div>
      </div>
    </div>
  );
};
