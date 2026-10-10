import type { FC } from 'react';
import { 
  Building2, 
  CreditCard, 
  Users, 
  History, 
  Receipt, 
  PlusCircle, 
  UserPlus,
  LogOut,
  Sparkles,
  ShieldCheck
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
  const { license, licenseKey, isAdmin, isGuestMode, logout } = useLicense();

  return (
    <header className="navbar">
      <div className="nav-header-row">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Building2 size={22} />
          </div>
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1>DomusRent</h1>
              <button 
                id="btn-status-supabase"
                onClick={onOpenSupabaseModal}
                className="cloud-status-badge"
                title={isSupabaseConnected ? 'Database Cloud Supabase Connesso' : 'Database Locale'}
              >
                <span className={`status-dot ${isSupabaseConnected ? 'connected' : 'local'}`} />
                <span className="status-label">{isSupabaseConnected ? 'Cloud' : 'Locale'}</span>
              </button>
            </div>
            <span className="brand-subtitle">
              {license?.property_name || 'Gestionale Personale • 2 Camere'}
            </span>
          </div>
        </div>

        {/* Action Buttons & Account / License */}
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

          {/* Admin Licenses Button (Master Control) */}
          <button
            onClick={onOpenAdminLicensesModal}
            className="btn btn-secondary btn-icon btn-sm"
            title="Pannello Gestione Licenze & Kill Switch"
            style={{ width: 34, height: 34, padding: 0, borderColor: isAdmin ? 'rgba(99, 102, 241, 0.6)' : undefined }}
          >
            <ShieldCheck size={16} color={isAdmin ? '#818cf8' : 'var(--text-secondary)'} />
          </button>

          {/* User / License Indicator */}
          {license && !isGuestMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="user-email-badge" title={`Licenza: ${licenseKey}\nCliente: ${license.client_name}`}>
                {license.client_name}
              </span>
              <button
                onClick={() => {
                  if (window.confirm(`Vuoi uscire dalla licenza ${license.client_name} (${licenseKey})?`)) {
                    logout();
                  }
                }}
                className="btn btn-secondary btn-icon btn-sm"
                title={`Connesso con licenza: ${licenseKey}\nClicca per cambiare licenza`}
                style={{ width: 34, height: 34, padding: 0 }}
              >
                <LogOut size={15} color="#fb7185" />
              </button>
            </div>
          ) : isGuestMode ? (
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Esci dalla modalità demo ed entra con chiave licenza"
              style={{ padding: '5px 8px', fontSize: '0.72rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
            >
              <Sparkles size={13} />
              <span className="btn-text-full">Demo (Inserisci Chiave)</span>
              <span className="btn-text-short">Licenza</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Navigation Tabs */}
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
