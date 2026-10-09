import { useState, useEffect } from 'react';
import { Navbar, type NavTab } from './components/Navbar';
import { CurrentPaymentsView } from './components/CurrentPaymentsView';
import { TenantsManager } from './components/TenantsManager';
import { PaymentsArchiveView } from './components/PaymentsArchiveView';
import { ExpensesView } from './components/ExpensesView';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { PaymentModal } from './components/PaymentModal';
import { TenantModal } from './components/TenantModal';
import { ExpenseModal } from './components/ExpenseModal';

import { StorageService, ROOMS } from './services/storageService';
import type { Tenant, Payment, HouseExpense, Room, RoomId } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('payments_status');
  const [rooms] = useState<Room[]>(ROOMS);
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
    loadAllData();
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

  return (
    <div className="app-container">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSupabaseConnected={isSupabaseConnected}
        onOpenNewPaymentModal={() => handleOpenPaymentModalWithContext()}
        onOpenNewTenantModal={() => handleOpenNewTenantModal()}
        onOpenSupabaseModal={() => setActiveTab('supabase')}
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

            {activeTab === 'supabase' && (
              <SupabaseConfigModal
                onConnectionStatusChanged={loadAllData}
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
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}

export default App;
