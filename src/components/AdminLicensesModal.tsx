import { useState, useEffect, type FC } from 'react';
import { 
  ShieldCheck, 
  X, 
  Plus, 
  KeyRound, 
  Copy, 
  Check, 
  Power, 
  Trash2, 
  Lock, 
  Calendar,
  Building
} from 'lucide-react';
import { LicenseService } from '../services/licenseService';
import type { AppLicense } from '../types';

interface AdminLicensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLicensesModal: FC<AdminLicensesModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [licenses, setLicenses] = useState<AppLicense[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New license form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newPropertyName, setNewPropertyName] = useState('Appartamento 2 Camere');
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const MASTER_PIN = '1234';

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const list = await LicenseService.getLicenses();
      setLicenses(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadLicenses();
    }
  }, [isOpen, isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === MASTER_PIN || pinInput.toUpperCase() === 'DOMUS-ADMIN') {
      setIsAuthenticated(true);
      setPinError(false);
      loadLicenses();
    } else {
      setPinError(true);
    }
  };

  const handleClientNameChange = (val: string) => {
    setNewClientName(val);
    if (!newLicenseKey || newLicenseKey.startsWith('DOMUS-')) {
      const slug = val.trim().replace(/\s+/g, '-').toUpperCase();
      if (slug) setNewLicenseKey(`DOMUS-${slug}`);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newLicenseKey) return;

    setCreating(true);
    try {
      await LicenseService.createLicense({
        client_name: newClientName.trim(),
        property_name: newPropertyName.trim() || 'Appartamento 2 Camere',
        license_key: newLicenseKey.trim().toUpperCase(),
        is_active: true,
        expires_at: newExpiresAt || undefined,
        contact_phone: newPhone.trim() || undefined,
      });

      setNewClientName('');
      setNewLicenseKey('');
      setNewExpiresAt('');
      setNewPhone('');
      setShowCreateForm(false);
      await loadLicenses();
    } finally {
      setCreating(false);
    }
  };

  const handleToggleKillSwitch = async (lic: AppLicense) => {
    const newStatus = !lic.is_active;
    const actionText = newStatus ? 'riattivare' : 'sospendere (KILL SWITCH)';
    if (window.confirm(`Sei sicuro di voler ${actionText} la licenza di ${lic.client_name}?`)) {
      await LicenseService.toggleLicenseActive(lic.id, newStatus);
      await loadLicenses();
    }
  };

  const handleDeleteLicense = async (lic: AppLicense) => {
    if (window.confirm(`Eliminare definitivamente la licenza per ${lic.client_name} (${lic.license_key})?`)) {
      await LicenseService.deleteLicense(lic.id);
      await loadLicenses();
    }
  };

  const copyClientDirectLink = (key: string) => {
    const origin = window.location.origin;
    const directUrl = `${origin}/?licenza=${encodeURIComponent(key)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 740, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Pannello Amministratore Licenze</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>
                Controllo accessi clienti, generazione link e Kill Switch
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {!isAuthenticated ? (
            /* PIN Protection */
            <form onSubmit={handlePinSubmit} style={{ maxWidth: 360, margin: '20px auto', textAlign: 'center' }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                marginBottom: 14,
              }}>
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Accesso Master Riservato</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
                Inserisci il PIN amministratore per accedere al pannello di vendita e blocco licenze (PIN predefinito: <code>1234</code>)
              </p>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem', fontWeight: 700 }}
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                  required
                />
                {pinError && (
                  <span style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: 4, display: 'block' }}>
                    PIN errato. Riprova.
                  </span>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Sblocca Pannello
              </button>
            </form>
          ) : (
            /* Main Admin Interface */
            <div>
              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                    Clienti & Licenze Attive ({licenses.length})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  <Plus size={15} />
                  <span>{showCreateForm ? 'Annulla' : '+ Nuova Licenza Cliente'}</span>
                </button>
              </div>

              {/* Create License Form */}
              {showCreateForm && (
                <form 
                  onSubmit={handleCreateLicense} 
                  className="glass-card" 
                  style={{ padding: 18, marginBottom: 24, border: '1px solid rgba(99, 102, 241, 0.4)' }}
                >
                  <h4 style={{ fontSize: '0.95rem', marginBottom: 14, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={16} />
                    <span>Crea Nuova Licenza per un Cliente</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Nome Proprietario / Cliente *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Es: Mario Rossi"
                        value={newClientName}
                        onChange={(e) => handleClientNameChange(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Nome Immobile</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Es: Appartamento Via Roma (2 Camere)"
                        value={newPropertyName}
                        onChange={(e) => setNewPropertyName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Chiave Licenza Univoca *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Es: DOMUS-ROSSI"
                        style={{ textTransform: 'uppercase', fontWeight: 600 }}
                        value={newLicenseKey}
                        onChange={(e) => setNewLicenseKey(e.target.value.toUpperCase())}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Scadenza Periodo (Opzionale)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={newExpiresAt}
                        onChange={(e) => setNewExpiresAt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={creating}
                    >
                      {creating ? 'Creazione in corso...' : 'Salva & Attiva Licenza'}
                    </button>
                  </div>
                </form>
              )}

              {/* License List */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                  Caricamento licenze...
                </div>
              ) : licenses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)',
                }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                    Nessuna licenza cliente ancora creata. Clicca su <strong>"+ Nuova Licenza Cliente"</strong> per attivare il tuo primo cliente.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {licenses.map((lic) => {
                    const isCopied = copiedKey === lic.license_key;
                    return (
                      <div
                        key={lic.id}
                        className="glass-card"
                        style={{
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          borderLeft: `4px solid ${lic.is_active ? '#10b981' : '#ef4444'}`,
                        }}
                      >
                        {/* Info Client */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{lic.client_name}</strong>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: lic.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: lic.is_active ? '#34d399' : '#f87171',
                              fontWeight: 600,
                              border: `1px solid ${lic.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            }}>
                              {lic.is_active ? '🟢 ATTIVO' : '🔴 SOSPESO (KILL SWITCH)'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Building size={13} />
                              {lic.property_name || 'Appartamento 2 Camere'}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <KeyRound size={13} />
                              <code>{lic.license_key}</code>
                            </span>
                            {lic.expires_at && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={13} />
                                Scadenza: {lic.expires_at}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {/* Copy Link Button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => copyClientDirectLink(lic.license_key)}
                            title="Copia link magico diretto da inviare al cliente su WhatsApp"
                            style={{ fontSize: '0.76rem', gap: 5 }}
                          >
                            {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            <span>{isCopied ? 'Link Copiato!' : 'Copia Link Cliente'}</span>
                          </button>

                          {/* Kill Switch Toggle Button */}
                          <button
                            type="button"
                            className={`btn btn-sm ${lic.is_active ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleKillSwitch(lic)}
                            title={lic.is_active ? 'Sospendi accesso per mancato pagamento' : 'Riattiva accesso al gestionale'}
                            style={{ fontSize: '0.76rem', padding: '6px 10px', gap: 5 }}
                          >
                            <Power size={14} />
                            <span>{lic.is_active ? 'Sospendi (Kill)' : 'Riattiva'}</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleDeleteLicense(lic)}
                            title="Elimina licenza"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
