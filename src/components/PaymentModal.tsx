import { useState, useEffect, type FC } from 'react';
import { X, CreditCard, Save } from 'lucide-react';
import type { Payment, Tenant } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  tenants: Tenant[];
  initialTenant?: Tenant;
  initialMonthKey?: string;
  initialMonthLabel?: string;
}

export const PaymentModal: FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tenants,
  initialTenant,
  initialMonthKey,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTenants = tenants.filter(t => t.is_active);

  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [monthYear, setMonthYear] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'bonifico' | 'contanti' | 'altro'>('bonifico');
  const [notes, setNotes] = useState('');

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  useEffect(() => {
    const t = initialTenant || activeTenants[0];
    if (t) {
      setSelectedTenantId(t.id);
      setAmount(t.monthly_rent);
    }

    if (initialMonthKey) {
      setMonthYear(initialMonthKey);
    } else {
      setMonthYear(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
    }

    setPaymentDate(todayStr);
    setMethod('bonifico');
    setNotes('');
  }, [isOpen, initialTenant, initialMonthKey]);

  if (!isOpen) return null;

  const currentSelectedTenant = tenants.find(t => t.id === selectedTenantId);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const t = tenants.find(item => item.id === tenantId);
    if (t) setAmount(t.monthly_rent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedTenant || !amount || !monthYear) {
      alert('Seleziona studente, mese e importo.');
      return;
    }

    const [yStr, mStr] = monthYear.split('-');
    const yNum = Number(yStr);
    const mNum = Number(mStr);
    const label = `${monthNames[mNum - 1]} ${yNum}`;

    onSave({
      id: `pay-${Date.now()}`,
      tenant_id: currentSelectedTenant.id,
      tenant_name: currentSelectedTenant.name,
      room_id: currentSelectedTenant.room_id,
      month_key: monthYear,
      month_label: label,
      year: yNum,
      amount: Number(amount),
      payment_date: paymentDate,
      payment_method: method,
      notes,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(16, 185, 129, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#34d399' 
            }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Registra Pagamento Affitto</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Salva l'incasso dello studente nello storico permanente
              </span>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tenant Selector */}
          <div className="form-group">
            <label className="form-label">Studente / Ragazzo</label>
            <select
              id="select-tenant-payment"
              className="form-select"
              value={selectedTenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
              required
            >
              {activeTenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.room_id === 'room-1' ? 'Camera A' : 'Camera B'} - €{t.monthly_rent}/m)
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            {/* Reference Month */}
            <div className="form-group">
              <label className="form-label">Mese di Riferimento</label>
              <input
                id="input-month-year"
                type="month"
                className="form-input"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                required
              />
            </div>

            {/* Payment Date */}
            <div className="form-group">
              <label className="form-label">Data Effettivo Incasso</label>
              <input
                id="input-payment-date"
                type="date"
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Importo Incassato (€)</label>
              <input
                id="input-payment-amount"
                type="number"
                step="5"
                min="0"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>

            {/* Method */}
            <div className="form-group">
              <label className="form-label">Metodo di Pagamento</label>
              <select
                id="select-payment-method"
                className="form-select"
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
              >
                <option value="bonifico">Bonifico Bancario</option>
                <option value="contanti">Contanti</option>
                <option value="altro">Altro</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Note / Causale Bonifico</label>
            <input
              type="text"
              className="form-input"
              placeholder="es. Bonifico pervenuto con CRO o contanti..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Annulla
            </button>
            <button id="btn-submit-payment" type="submit" className="btn btn-success" style={{ flex: 1.5 }}>
              <Save size={16} />
              <span>Conferma & Salva Pagamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
