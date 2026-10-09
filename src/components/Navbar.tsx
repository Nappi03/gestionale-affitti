import type { FC } from 'react';
import { 
  Building2, 
  CreditCard, 
  Users, 
  History, 
  Receipt, 
  PlusCircle, 
  UserPlus
} from 'lucide-react';

export type NavTab = 'payments_status' | 'tenants' | 'archive' | 'expenses' | 'supabase';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isSupabaseConnected: boolean;
  onOpenNewPaymentModal: () => void;
  onOpenNewTenantModal: () => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isSupabaseConnected,
  onOpenNewPaymentModal,
  onOpenNewTenantModal,
  onOpenSupabaseModal,
}) => {
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
            <span className="brand-subtitle">Gestionale Personale • 2 Camere</span>
          </div>
        </div>

        {/* Action Buttons */}
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
        </div>
      </div>

      {/* Navigation Tabs - Horizontally scrollable on mobile */}
      <div className="nav-tabs-wrapper">
        <nav className="nav-tabs">
          <button
            id="tab-payments-status"
            className={`nav-tab-btn ${activeTab === 'payments_status' ? 'active' : ''}`}
            onClick={() => onTabChange('payments_status')}
          >
            <CreditCard size={17} />
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
