import type { FC } from 'react';
import { 
  Building2, 
  CreditCard, 
  Users, 
  History, 
  Receipt, 
  PlusCircle, 
  UserPlus,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

export type NavTab = 'payments_status' | 'tenants' | 'archive' | 'expenses' | 'supabase';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isSupabaseConnected: boolean;
  onOpenNewPaymentModal: () => void;
  onOpenNewTenantModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenAdminLicensesModal: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isSupabaseConnected,
  onOpenNewPaymentModal,
  onOpenNewTenantModal,
  onOpenSupabaseModal,
  onOpenAdminLicensesModal,
}) => {
  const { license, isAdmin, logout } = useLicense();

  return (
    <header className="navbar">
      <div className="nav-header-row">
        {/* Brand */}
        <div className="brand-section">
          <div 
            className="brand-logo-icon"
            onDoubleClick={onOpenAdminLicensesModal}
            title={isAdmin ? "DomusRent Master Admin" : "DomusRent"}
            style={{ cursor: isAdmin ? 'pointer' : 'default' }}
          >
            <Building2 size={22} />
          </div>
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1>DomusRent</h1>
              {/* Se l'utente è l'Admin Master, può cliccare sul badge per aprire la config Supabase.
                  Per il CLIENTE, è un indicatore di sicurezza fisso e non cliccabile. */}
              {isAdmin ? (
                <button 
                  id="btn-status-supabase"
                  onClick={onOpenSupabaseModal}
                  className="cloud-status-badge"
                  title="Configurazione Database Supabase (Admin)"
                >
                  <span className={`status-dot ${isSupabaseConnected ? 'connected' : 'local'}`} />
                  <span className="status-label">{isSupabaseConnected ? 'Cloud' : 'Locale'}</span>
                </button>
              ) : (
                <div 
                  className="cloud-status-badge" 
                  style={{ cursor: 'default', userSelect: 'none' }}
                  title="Connessione cloud sicura e attiva"
                >
                  <span className={`status-dot ${isSupabaseConnected ? 'connected' : 'local'}`} />
                  <span className="status-label">Cloud</span>
                </div>
              )}
            </div>
            <span className="brand-subtitle">
              {license?.property_name || 'Appartamento 2 Camere'}
            </span>
          </div>
        </div>

        {/* Action Buttons: solo le funzioni necessarie per il proprietario */}
        <div className="nav-actions">
          {/* Quick Record Payment */}
          <button 
            id="btn-record-payment"
            className="btn btn-success btn-sm btn-quick-action" 
            onClick={onOpenNewPaymentModal}
            title="Registra incasso canone affitto"
          >
            <PlusCircle size={15} />
            <span className="btn-text-full">+ Registra Pagamento</span>
            <span className="btn-text-short">+ Incasso</span>
          </button>

          {/* Quick Add Tenant */}
          <button 
            id="btn-add-tenant"
            className="btn btn-primary btn-sm btn-quick-action" 
            onClick={onOpenNewTenantModal}
            title="Aggiungi nuovo studente in stanza"
          >
            <UserPlus size={15} />
            <span className="btn-text-full">+ Aggiungi Ragazzo</span>
            <span className="btn-text-short">+ Studente</span>
          </button>

          {/* MASTER ADMIN EXCLUSIVE: visibile SOLO se autenticati come Master Admin */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={onOpenAdminLicensesModal}
                className="btn btn-secondary btn-icon btn-sm"
                title="Pannello Master Gestione Licenze & Kill Switch"
                style={{ width: 34, height: 34, padding: 0, borderColor: 'rgba(99, 102, 241, 0.6)' }}
              >
                <ShieldCheck size={16} color="#818cf8" />
              </button>
              <button
                onClick={logout}
                className="btn btn-secondary btn-icon btn-sm"
                title="Esci dalla sessione Master Admin"
                style={{ width: 34, height: 34, padding: 0 }}
              >
                <LogOut size={15} color="#fb7185" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs: Esattamente le 4 sezioni del gestionale */}
      <div className="nav-tabs-wrapper">
        <nav className="nav-tabs">
          <button
            id="tab-payments-status"
            className={`nav-tab-btn ${activeTab === 'payments_status' ? 'active' : ''}`}
            onClick={() => onTabChange('payments_status')}
          >
            <CreditCard size={16} />
            <span className="tab-label-full">Chi ha Pagato? (Mese per Mese)</span>
            <span className="tab-label-short">Pagamenti</span>
          </button>

          <button
            id="tab-tenants"
            className={`nav-tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => onTabChange('tenants')}
          >
            <Users size={16} />
            <span className="tab-label-full">I Ragazzi (Anagrafica & Camere)</span>
            <span className="tab-label-short">Ragazzi</span>
          </button>

          <button
            id="tab-archive"
            className={`nav-tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => onTabChange('archive')}
          >
            <History size={16} />
            <span className="tab-label-full">Archivio Storico Pagamenti</span>
            <span className="tab-label-short">Archivio</span>
          </button>

          <button
            id="tab-expenses"
            className={`nav-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => onTabChange('expenses')}
          >
            <Receipt size={16} />
            <span className="tab-label-full">Bollette & Spese Casa</span>
            <span className="tab-label-short">Bollette</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
