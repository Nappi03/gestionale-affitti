import { useState, useEffect, useMemo } from 'react';
import { LicenseProvider, useLicense } from './context/LicenseContext';
import { LicenseScreen } from './components/LicenseScreen';
import { AdminLicensesModal } from './components/AdminLicensesModal';
import { Navbar, type NavTab } from './components/Navbar';
import { CurrentPaymentsView } from './components/CurrentPaymentsView';
import { TenantsManager } from './components/TenantsManager';
import { PaymentsArchiveView } from './components/PaymentsArchiveView';
import { ExpensesView } from './components/ExpensesView';
import { PaymentModal } from './components/PaymentModal';
import { TenantModal } from './components/TenantModal';
import { ExpenseModal } from './components/ExpenseModal';

import { StorageService, generateRooms } from './services/storageService';
import type { Tenant, Payment, HouseExpense, RoomId } from './types';

function DomusRentDashboard() {
  const { license, licenseKey, status, loading: licenseLoading } = useLicense();
  const [activeTab, setActiveTab] = useState<NavTab>('payments_status');
  const rooms = useMemo(() => {
    const count = license?.rooms_count || 2;
    return generateRooms(count, license?.custom_rooms);
  }, [license?.rooms_count, license?.custom_rooms]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<HouseExpense[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInitialTenant, setPaymentInitialTenant] = useState<Tenant | undefined>();
  const [paymentInitialMonthKey, setPaymentInitialMonthKey] = useState<string | undefined>();
  const [paymentInitialMonthLabel, setPaymentInitialMonthLabel] = useState<string | undefined>();

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [preselectedRoomId, setPreselectedRoomId] = useState<RoomId | undefined>();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<HouseExpense | null>(null);

  // Load all data
  const loadAllData = async () => {
    try {
      const conn = await StorageService.testConnection();
      setIsSupabaseConnected(conn.success);

      const [loadedTenants, loadedPayments, loadedExpenses] = await Promise.all([
        StorageService.getTenants(),
        StorageService.getPayments(),
        StorageService.getExpenses(),
      ]);

      setTenants(loadedTenants);
      setPayments(loadedPayments);
      setExpenses(loadedExpenses);
    } catch (e) {
      console.error('Errore caricamento dati:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (licenseKey && status === 'active') {
      setLoading(true);
      loadAllData();
    } else {
      setTenants([]);
      setPayments([]);
      setExpenses([]);
      setLoading(false);
    }
  }, [licenseKey, status]);

  // Master Admin shortcut listener (navigazione rapida ad /?admin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.location.href = '/?admin';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Handlers: Payments ---
  const handleSavePayment = async (payment: Payment) => {
    const saved = await StorageService.recordPayment(payment);
    setPayments((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id || p.id === payment.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeletePayment = async (paymentId: string) => {
    await StorageService.deletePayment(paymentId);
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const handleOpenPaymentModalWithContext = (tenant?: Tenant, monthKey?: string, monthLabel?: string) => {
    setPaymentInitialTenant(tenant);
    setPaymentInitialMonthKey(monthKey);
    setPaymentInitialMonthLabel(monthLabel);
    setIsPaymentModalOpen(true);
  };

  // --- Handlers: Tenants ---
  const handleSaveTenant = async (tenant: Tenant) => {
    const saved = await StorageService.saveTenant(tenant);
    setTenants((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id || t.id === tenant.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleArchiveTenant = async (tenantId: string) => {
    await StorageService.archiveTenant(tenantId);
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, is_active: false } : t))
    );
  };

  const handleDeleteTenant = async (tenantId: string) => {
    await StorageService.deleteTenant(tenantId);
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
  };

  const handleReactivateTenant = async (tenant: Tenant) => {
    const updated: Tenant = { ...tenant, is_active: true };
    await handleSaveTenant(updated);
  };

  const handleOpenNewTenantModal = (roomId?: RoomId) => {
    setTenantToEdit(null);
    setPreselectedRoomId(roomId);
    setIsTenantModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setTenantToEdit(tenant);
    setPreselectedRoomId(tenant.room_id);
    setIsTenantModalOpen(true);
  };

  // --- Handlers: Expenses ---
  const handleSaveExpense = async (expense: HouseExpense) => {
    const saved = await StorageService.saveExpense(expense);
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id || e.id === expense.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await StorageService.deleteExpense(expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  if (licenseLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%), var(--bg-app)',
        color: 'var(--text-secondary)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div className="status-dot connected" style={{ width: 14, height: 14 }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e2e8f0' }}>Caricamento sicuro in corso...</span>
      </div>
    );
  }

  // 1. Accesso Amministratore dedicato via link (?admin / ?master / ?gestione)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isAdminRoute = urlParams.has('admin') || urlParams.has('master') || urlParams.has('gestione') || status === 'admin';

  if (isAdminRoute) {
    return (
      <AdminLicensesModal
        isOpen={true}
        isFullPage={true}
      />
    );
  }

  // 2. Se non c'è una licenza valida o la licenza è sospesa/scaduta, mostra la schermata riservata
  const isBlocked = !licenseKey || !license || status !== 'active';

  if (isBlocked) {
    return <LicenseScreen />;
  }

  return (
    <div className="app-container">
      {/* Navbar: 100% blindata per il cliente */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isSupabaseConnected={isSupabaseConnected}
        onOpenNewPaymentModal={() => handleOpenPaymentModalWithContext()}
        onOpenNewTenantModal={() => handleOpenNewTenantModal()}
        onOpenAdminLicensesModal={() => {
          window.location.href = '/?admin';
        }}
      />

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Caricamento gestionale...
          </div>
        ) : (
          <>
            {activeTab === 'payments_status' && (
              <CurrentPaymentsView
                rooms={rooms}
                tenants={tenants}
                payments={payments}
                onOpenRecordPayment={(tenant, mKey, mLabel) =>
                  handleOpenPaymentModalWithContext(tenant, mKey, mLabel)
                }
                onDeletePayment={handleDeletePayment}
                onOpenNewTenantModal={() => handleOpenNewTenantModal()}
              />
            )}

            {activeTab === 'tenants' && (
              <TenantsManager
                rooms={rooms}
                tenants={tenants}
                onOpenNewTenantModal={handleOpenNewTenantModal}
                onEditTenant={handleEditTenant}
                onArchiveTenant={handleArchiveTenant}
                onDeleteTenant={handleDeleteTenant}
                onReactivateTenant={handleReactivateTenant}
              />
            )}

            {activeTab === 'archive' && (
              <PaymentsArchiveView
                rooms={rooms}
                payments={payments}
                tenants={tenants}
                onOpenRecordPayment={() => handleOpenPaymentModalWithContext()}
                onDeletePayment={handleDeletePayment}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView
                rooms={rooms}
                expenses={expenses}
                tenants={tenants}
                onOpenNewExpenseModal={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                onEditExpense={(expense) => {
                  setExpenseToEdit(expense);
                  setIsExpenseModalOpen(true);
                }}
                onSaveExpense={handleSaveExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}
          </>
        )}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePayment}
        tenants={tenants}
        rooms={rooms}
        initialTenant={paymentInitialTenant}
        initialMonthKey={paymentInitialMonthKey}
        initialMonthLabel={paymentInitialMonthLabel}
      />

      {/* Tenant Modal */}
      <TenantModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onSave={handleSaveTenant}
        tenantToEdit={tenantToEdit}
        rooms={rooms}
        preselectedRoomId={preselectedRoomId}
      />

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        tenants={tenants}
        rooms={rooms}
        expenseToEdit={expenseToEdit}
      />

    </div>
  );
}

export function App() {
  return (
    <LicenseProvider>
      <DomusRentDashboard />
    </LicenseProvider>
  );
}

export default App;
