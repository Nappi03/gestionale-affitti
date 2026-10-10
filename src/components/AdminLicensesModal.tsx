import { useState, useEffect, type FC } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  KeyRound, 
  Copy, 
  Check, 
  Power, 
  Trash2, 
  Lock, 
  Calendar, 
  Building, 
  ExternalLink, 
  Pencil, 
  Phone, 
  MessageCircle, 
  Save 
} from 'lucide-react';
import { LicenseService } from '../services/licenseService';
import { generateRooms } from '../services/storageService';
import type { AppLicense } from '../types';

interface AdminLicensesModalProps {
  isOpen?: boolean;
  isFullPage?: boolean;
}

export const AdminLicensesModal: FC<AdminLicensesModalProps> = ({ 
  isOpen = true, 
  isFullPage = false,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('domus_admin_pin_auth_1598') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [licenses, setLicenses] = useState<AppLicense[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New license form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newRoomsCount, setNewRoomsCount] = useState<number>(2);
  const [newPropertyName, setNewPropertyName] = useState('Appartamento 2 Camere');
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit license form state
  const [editingLicense, setEditingLicense] = useState<AppLicense | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editRoomsCount, setEditRoomsCount] = useState<number>(2);
  const [editPropertyName, setEditPropertyName] = useState('');
  const [editLicenseKey, setEditLicenseKey] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Master PIN aggiornato
  const MASTER_PIN = '1598';

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
    if (pinInput === MASTER_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('domus_admin_pin_auth_1598', 'true');
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

  const handleCreateRoomsCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(20, count));
    setNewRoomsCount(validCount);
    // Aggiorna automaticamente il nome immobile se ha il pattern predefinito
    if (!newPropertyName || /^Appartamento \d+ Camer[ae]$/i.test(newPropertyName.trim())) {
      setNewPropertyName(`Appartamento ${validCount} ${validCount === 1 ? 'Camera' : 'Camere'}`);
    }
  };

  const handleEditRoomsCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(20, count));
    setEditRoomsCount(validCount);
    if (!editPropertyName || /^Appartamento \d+ Camer[ae]$/i.test(editPropertyName.trim())) {
      setEditPropertyName(`Appartamento ${validCount} ${validCount === 1 ? 'Camera' : 'Camere'}`);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newLicenseKey) return;

    setCreating(true);
    try {
      await LicenseService.createLicense({
        client_name: newClientName.trim(),
        property_name: newPropertyName.trim() || `Appartamento ${newRoomsCount} Camere`,
        license_key: newLicenseKey.trim().toUpperCase(),
        is_active: true,
        rooms_count: Number(newRoomsCount) || 2,
        expires_at: newExpiresAt || undefined,
        contact_phone: newPhone.trim() || undefined,
      });

      setNewClientName('');
      setNewRoomsCount(2);
      setNewPropertyName('Appartamento 2 Camere');
      setNewLicenseKey('');
      setNewExpiresAt('');
      setNewPhone('');
      setShowCreateForm(false);
      await loadLicenses();
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (lic: AppLicense) => {
    setEditingLicense(lic);
    setEditClientName(lic.client_name);
    setEditRoomsCount(lic.rooms_count || 2);
    setEditPropertyName(lic.property_name || `Appartamento ${lic.rooms_count || 2} Camere`);
    setEditLicenseKey(lic.license_key);
    setEditExpiresAt(lic.expires_at || '');
    setEditPhone(lic.contact_phone || '');
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingLicense(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicense || !editClientName || !editLicenseKey) return;

    setSavingEdit(true);
    try {
      await LicenseService.updateLicense(editingLicense.id, {
        client_name: editClientName.trim(),
        property_name: editPropertyName.trim() || `Appartamento ${editRoomsCount} Camere`,
        license_key: editLicenseKey.trim().toUpperCase(),
        rooms_count: Number(editRoomsCount) || 2,
        expires_at: editExpiresAt || undefined,
        contact_phone: editPhone.trim() || undefined,
      });

      setEditingLicense(null);
      await loadLicenses();
    } finally {
      setSavingEdit(false);
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

  const content = (
    <>
      {/* Header */}
      <div 
        className={isFullPage ? '' : 'modal-header'} 
        style={isFullPage ? { 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 28,
          paddingBottom: 18,
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: 14,
        } : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: isFullPage ? '1.35rem' : '1.2rem', margin: 0, fontWeight: 800 }}>
                Pannello Amministratore DomusRent
              </h2>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: '1px solid rgba(99, 102, 241, 0.35)',
              }}>
                MASTER
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, marginTop: 2 }}>
              Gestione clienti, link WhatsApp diretti, modifica anagrafica e Kill Switch
            </p>
          </div>
        </div>


      </div>

      {/* Main Body */}
      <div style={isFullPage ? undefined : { padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
        {!isAuthenticated ? (
          /* PIN Protection */
          <div style={{
            maxWidth: 380,
            margin: isFullPage ? '40px auto' : '20px auto',
            textAlign: 'center',
            padding: isFullPage ? '32px 24px' : undefined,
            background: isFullPage ? 'rgba(17, 24, 39, 0.7)' : undefined,
            borderRadius: isFullPage ? 'var(--radius-lg)' : undefined,
            border: isFullPage ? '1px solid var(--border-medium)' : undefined,
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              marginBottom: 16,
            }}>
              <Lock size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 6, fontWeight: 700 }}>Accesso Master Riservato</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.45 }}>
              Inserisci il PIN amministratore per accedere al controllo clienti e licenze.
            </p>

            <form onSubmit={handlePinSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.25rem', fontWeight: 700 }}
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                  required
                />
                {pinError && (
                  <span style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: 6, display: 'block' }}>
                    PIN errato. Riprova.
                  </span>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                Sblocca Pannello
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Interface */
          <div>
            {/* Quick Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}>
              <div className="glass-card" style={{ padding: '14px 16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Totale Clienti
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                  {licenses.length}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '14px 16px' }}>
                <span style={{ fontSize: '0.74rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Licenze Attive
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                  {licenses.filter((l) => l.is_active).length}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '14px 16px' }}>
                <span style={{ fontSize: '0.74rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sospese (Kill Switch)
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                  {licenses.filter((l) => !l.is_active).length}
                </div>
              </div>
            </div>

            {/* Action Toolbar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                  Elenco Clienti & Immobili ({licenses.length})
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingLicense(null);
                  setShowCreateForm(!showCreateForm);
                }}
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
                style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(99, 102, 241, 0.45)' }}
              >
                <h4 style={{ fontSize: '0.96rem', marginBottom: 14, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <KeyRound size={17} />
                  <span>Crea Nuova Licenza per un Proprietario</span>
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
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Nome Immobile</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Es: Appartamento Via Roma (3 Camere)"
                      value={newPropertyName}
                      onChange={(e) => setNewPropertyName(e.target.value)}
                    />
                  </div>

                  {/* Selezione dinamica Numero Camere */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', margin: 0, fontWeight: 700, color: '#c7d2fe' }}>
                        Numero Camere Immobile *
                      </label>
                      <span style={{ fontSize: '0.74rem', color: '#818cf8', fontWeight: 600 }}>
                        {newRoomsCount} {newRoomsCount === 1 ? 'Camera configurata' : 'Camere configurate'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleCreateRoomsCountChange(num)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: newRoomsCount === num ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                            background: newRoomsCount === num ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            color: newRoomsCount === num ? '#ffffff' : 'var(--text-secondary)',
                            fontWeight: newRoomsCount === num ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {num} {num === 1 ? 'Camera' : 'Camere'}
                        </button>
                      ))}

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Altro:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className="form-input"
                          style={{ width: 68, padding: '5px 8px', textAlign: 'center', fontSize: '0.85rem' }}
                          value={newRoomsCount}
                          onChange={(e) => handleCreateRoomsCountChange(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    {/* Preview Badge Camere generate */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {generateRooms(newRoomsCount).map(r => (
                        <span
                          key={r.id}
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: `${r.accentHex}20`,
                            color: r.accentHex,
                            border: `1px solid ${r.accentHex}40`,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.accentHex }} />
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Numero WhatsApp / Telefono Cliente</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Es: 3331234567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
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

            {/* Edit License Form */}
            {editingLicense && (
              <form 
                onSubmit={handleSaveEdit} 
                className="glass-card" 
                style={{ padding: 20, marginBottom: 24, border: '1px solid #10b981' }}
              >
                <h4 style={{ fontSize: '0.96rem', marginBottom: 14, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <Pencil size={17} />
                  <span>Modifica Dati Cliente: {editingLicense.client_name}</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Nome Proprietario / Cliente *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Nome Immobile</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPropertyName}
                      onChange={(e) => setEditPropertyName(e.target.value)}
                    />
                  </div>

                  {/* Selezione dinamica Numero Camere in Modifica */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', margin: 0, fontWeight: 700, color: '#6ee7b7' }}>
                        Numero Camere Immobile *
                      </label>
                      <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>
                        {editRoomsCount} {editRoomsCount === 1 ? 'Camera configurata' : 'Camere configurate'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleEditRoomsCountChange(num)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: editRoomsCount === num ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                            background: editRoomsCount === num ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            color: editRoomsCount === num ? '#ffffff' : 'var(--text-secondary)',
                            fontWeight: editRoomsCount === num ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {num} {num === 1 ? 'Camera' : 'Camere'}
                        </button>
                      ))}

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Altro:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className="form-input"
                          style={{ width: 68, padding: '5px 8px', textAlign: 'center', fontSize: '0.85rem' }}
                          value={editRoomsCount}
                          onChange={(e) => handleEditRoomsCountChange(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    {/* Preview Badge Camere in modifica */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {generateRooms(editRoomsCount).map(r => (
                        <span
                          key={r.id}
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: `${r.accentHex}20`,
                            color: r.accentHex,
                            border: `1px solid ${r.accentHex}40`,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.accentHex }} />
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Numero WhatsApp / Telefono Cliente</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Es: 3331234567"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Chiave Licenza Univoca *</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ textTransform: 'uppercase', fontWeight: 600 }}
                      value={editLicenseKey}
                      onChange={(e) => setEditLicenseKey(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Scadenza Periodo (Opzionale)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editExpiresAt}
                      onChange={(e) => setEditExpiresAt(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancelEdit}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingEdit}
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    <Save size={14} />
                    <span>{savingEdit ? 'Salvataggio...' : 'Salva Modifiche'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* License List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
                Caricamento licenze in corso...
              </div>
            ) : licenses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
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
                  const clientDirectUrl = `${window.location.origin}/?licenza=${encodeURIComponent(lic.license_key)}`;
                  const cleanClientPhone = (lic.contact_phone || '').replace(/[^0-9]/g, '');

                  return (
                    <div
                      key={lic.id}
                      className="glass-card"
                      style={{
                        padding: '16px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        borderLeft: `4px solid ${lic.is_active ? '#10b981' : '#ef4444'}`,
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Info Client */}
                      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.98rem', color: '#ffffff' }}>{lic.client_name}</strong>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: lic.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: lic.is_active ? '#34d399' : '#f87171',
                            fontWeight: 700,
                            border: `1px solid ${lic.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}>
                            {lic.is_active ? '🟢 ATTIVO' : '🔴 SOSPESO (KILL SWITCH)'}
                          </span>

                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#a5b4fc',
                            fontWeight: 700,
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            🚪 {lic.rooms_count || 2} {(lic.rooms_count || 2) === 1 ? 'Camera' : 'Camere'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Building size={14} />
                            {lic.property_name || `Appartamento ${lic.rooms_count || 2} Camere`}
                          </span>

                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <KeyRound size={14} />
                            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>
                              {lic.license_key}
                            </code>
                          </span>

                          {/* Numero WhatsApp Cliente con link diretto */}
                          {lic.contact_phone ? (
                            <a
                              href={`https://wa.me/${cleanClientPhone.startsWith('39') ? cleanClientPhone : `39${cleanClientPhone}`}?text=${encodeURIComponent(
                                `Buongiorno ${lic.client_name}, ti contatto da DomusRent per informazioni sul tuo gestionale.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 4, 
                                color: '#34d399', 
                                textDecoration: 'none',
                                fontWeight: 500,
                              }}
                              title="Clicca per aprire la chat WhatsApp con questo cliente"
                            >
                              <Phone size={13} />
                              <span>{lic.contact_phone}</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                              (Nessun telefono)
                            </span>
                          )}

                          {lic.expires_at && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <Calendar size={14} />
                              Scadenza: {lic.expires_at}
                            </span>
                          )}
                        </div>

                        {/* Visualizzazione rapida delle camere dell'immobile */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          {generateRooms(lic.rooms_count || 2, lic.custom_rooms).map((r) => (
                            <span 
                              key={r.id} 
                              style={{
                                fontSize: '0.7rem',
                                padding: '1px 7px',
                                borderRadius: 4,
                                background: `${r.accentHex}18`,
                                color: r.accentHex,
                                border: `1px solid ${r.accentHex}40`,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.accentHex }} />
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* WhatsApp Chat button with client if phone exists */}
                        {cleanClientPhone && (
                          <a
                            href={`https://wa.me/${cleanClientPhone.startsWith('39') ? cleanClientPhone : `39${cleanClientPhone}`}?text=${encodeURIComponent(
                              `Buongiorno ${lic.client_name}, ti contatto da DomusRent.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="Apri chat WhatsApp con il cliente"
                            style={{ fontSize: '0.78rem', gap: 5, color: '#34d399', textDecoration: 'none' }}
                          >
                            <MessageCircle size={14} />
                            <span>Contatta</span>
                          </a>
                        )}

                        {/* Copy WhatsApp Link Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => copyClientDirectLink(lic.license_key)}
                          title="Copia link magico diretto da inviare al cliente su WhatsApp"
                          style={{ fontSize: '0.78rem', gap: 5 }}
                        >
                          {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          <span>{isCopied ? 'Link Copiato!' : 'Copia Link'}</span>
                        </button>

                        {/* Edit Client Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStartEdit(lic)}
                          title="Modifica dati del cliente, immobile o numero di telefono"
                          style={{ fontSize: '0.78rem', gap: 5 }}
                        >
                          <Pencil size={14} />
                          <span>Modifica</span>
                        </button>

                        {/* Open Client View in New Tab */}
                        <a
                          href={clientDirectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Apri il gestionale come cliente per verificare cosa vede"
                          style={{ fontSize: '0.78rem', gap: 5, textDecoration: 'none' }}
                        >
                          <ExternalLink size={14} />
                          <span>Apri</span>
                        </a>

                        {/* Kill Switch Toggle Button */}
                        <button
                          type="button"
                          className={`btn btn-sm ${lic.is_active ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleKillSwitch(lic)}
                          title={lic.is_active ? 'Sospendi accesso per mancato pagamento' : 'Riattiva accesso al gestionale'}
                          style={{ fontSize: '0.78rem', padding: '6px 12px', gap: 5 }}
                        >
                          <Power size={14} />
                          <span>{lic.is_active ? 'Sospendi' : 'Riattiva'}</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteLicense(lic)}
                          title="Elimina licenza"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={16} />
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
    </>
  );

  if (isFullPage) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%), var(--bg-app)',
        padding: '24px 16px',
        color: 'var(--text-primary)',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content" 
        style={{ maxWidth: 880, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
};
