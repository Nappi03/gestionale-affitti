import { useState, type FC } from 'react';
import { 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  resetSupabaseClient, 
  SUPABASE_SQL_SCHEMA 
} from '../lib/supabase';
import { StorageService } from '../services/storageService';

interface SupabaseConfigModalProps {
  onConnectionStatusChanged: () => void;
}

export const SupabaseConfigModal: FC<SupabaseConfigModalProps> = ({
  onConnectionStatusChanged,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testing, setTesting] = useState(false);
  const [statusResult, setStatusResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setStatusResult(null);

    saveSupabaseConfig(url, anonKey);
    resetSupabaseClient();

    const result = await StorageService.testConnection();
    setTesting(false);
    setStatusResult(result);
    onConnectionStatusChanged();
  };

  const handleDisconnect = () => {
    saveSupabaseConfig('', '');
    resetSupabaseClient();
    setUrl('');
    setAnonKey('');
    setStatusResult({ success: false, message: 'Disconnesso. Modalità locale ripristinata.' });
    onConnectionStatusChanged();
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
      {/* Form Credentials */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ 
            width: 42, 
            height: 42, 
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#ffffff' 
          }}>
            <Database size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Collegamento Supabase</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Collega il tuo database Postgres ospitato su Supabase
            </p>
          </div>
        </div>

        <form onSubmit={handleTestAndSave}>
          <div className="form-group">
            <label className="form-label">Project URL (Supabase)</label>
            <input
              id="input-supabase-url"
              type="url"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Trovi questo URL su Supabase in: <strong>Project Settings ➔ Data API ➔ Project URL</strong>
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Anon Public Key</label>
            <textarea
              id="input-supabase-key"
              className="form-textarea"
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              La chiave pubblica anonima in: <strong>Project Settings ➔ Data API ➔ Project API Keys (anon public)</strong>
            </span>
          </div>

          {/* Result Alert */}
          {statusResult && (
            <div style={{ 
              padding: 12, 
              borderRadius: 'var(--radius-md)', 
              marginBottom: 16,
              background: statusResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${statusResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: statusResult.success ? '#34d399' : '#fb7185',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {statusResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusResult.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              id="btn-test-save-supabase"
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              disabled={testing}
            >
              <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
              <span>{testing ? 'Test Connessione...' : 'Verifica & Connetti'}</span>
            </button>

            {url && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleDisconnect}
                title="Torna alla memoria locale"
              >
                Disconnetti
              </button>
            )}
          </div>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#a5b4fc' }}>
            <ShieldCheck size={14} />
            <strong>Funzionamento Senza Login (Anon Access)</strong>
          </div>
          Questa app è progettata per il tuo uso personale o gestionale interno senza autenticazione obbligatoria. Usa la chiave pubblica <code>anon</code> con le regole di sicurezza (RLS) configurate tramite lo schema SQL qui a fianco.
        </div>
      </div>

      {/* SQL Schema to Run in Supabase */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Terminal size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem' }}>Schema SQL Tabelle Supabase</h3>
          </div>

          <button 
            id="btn-copy-sql"
            className="btn btn-sm btn-secondary"
            onClick={copySql}
          >
            {copiedSql ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedSql ? 'Copiato!' : 'Copia Codice SQL'}</span>
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 12 }}>
          Esegui questo script nel <strong>SQL Editor</strong> del tuo progetto su Supabase per creare le tabelle <code>bookings</code> ed <code>expenses</code> con le relative autorizzazioni:
        </p>

        <pre style={{ 
          background: '#04070d', 
          border: '1px solid var(--border-medium)', 
          borderRadius: 'var(--radius-md)', 
          padding: 14, 
          fontSize: '0.74rem', 
          color: '#38bdf8', 
          overflowX: 'auto',
          maxHeight: 280,
          fontFamily: 'Consolas, monospace',
          lineHeight: 1.4,
          flex: 1
        }}>
          {SUPABASE_SQL_SCHEMA}
        </pre>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            <span>Apri Dashboard Supabase</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};
