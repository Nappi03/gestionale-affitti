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
            <Building2 size={24} />
          </div>
          <div className="brand-text">
            <h1>DomusRent</h1>
            <span>Gestionale Personale • 2 Camere</span>
          </div>
        </div>

        {/* Action Buttons & Status */}
        <div className="nav-actions">
          {/* Supabase status badge */}
          <button 
            id="btn-status-supabase"
            onClick={onOpenSupabaseModal}
            className="btn btn-sm btn-secondary"
            style={{ 
              borderColor: isSupabaseConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
              background: isSupabaseConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            }}
            title="Stato Database Cloud Supabase"
          >
            <div 
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: isSupabaseConnected ? '#10b981' : '#f59e0b' 
              }} 
            />
            <span style={{ fontSize: '0.8rem', color: isSupabaseConnected ? '#34d399' : '#fbbf24' }}>
              {isSupabaseConnected ? 'Supabase Connesso' : 'Locale'}
            </span>
          </button>

          {/* Quick Record Payment */}
          <button 
            id="btn-record-payment"
            className="btn btn-success btn-sm" 
            onClick={onOpenNewPaymentModal}
          >
            <PlusCircle size={16} />
            <span>+ Registra Pagamento</span>
          </button>

          {/* Quick Add Tenant */}
          <button 
            id="btn-add-tenant"
            className="btn btn-primary btn-sm" 
            onClick={onOpenNewTenantModal}
          >
            <UserPlus size={16} />
            <span>+ Aggiungi Ragazzo</span>
          </button>
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
            <CreditCard size={18} />
            <span>Chi ha Pagato? (Mese per Mese)</span>
          </button>

          <button
            id="tab-tenants"
            className={`nav-tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => onTabChange('tenants')}
          >
            <Users size={18} />
            <span>I Ragazzi (Anagrafica & Camere)</span>
          </button>

          <button
            id="tab-archive"
            className={`nav-tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => onTabChange('archive')}
          >
            <History size={18} />
            <span>Archivio Pagamenti & Storico Negli Anni</span>
          </button>

          <button
            id="tab-expenses"
            className={`nav-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => onTabChange('expenses')}
          >
            <Receipt size={18} />
            <span>Bollette & Spese Casa</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
