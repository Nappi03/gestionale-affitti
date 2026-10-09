import { useState, useEffect, type FC } from 'react';
import { X, Receipt, Save, Users, Calculator, Check, AlertCircle } from 'lucide-react';
import type { HouseExpense, Tenant, ExpenseSplit } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: HouseExpense) => void;
  tenants: Tenant[];
  expenseToEdit?: HouseExpense | null;
}

export const ExpenseModal: FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tenants,
  expenseToEdit,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTenants = tenants.filter(t => t.is_active);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HouseExpense['category']>('luce');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  // Ripartizione State
  const [enableSplit, setEnableSplit] = useState(true);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number | ''>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setDate(expenseToEdit.date);
      setNotes(expenseToEdit.notes || '');

      if (expenseToEdit.splits && expenseToEdit.splits.length > 0) {
        setEnableSplit(true);
        setSelectedTenantIds(expenseToEdit.splits.map(s => s.tenant_id));
        const amountsMap: Record<string, number | ''> = {};
        expenseToEdit.splits.forEach(s => {
          amountsMap[s.tenant_id] = s.amount;
        });
        setCustomAmounts(amountsMap);
      } else {
        setEnableSplit(false);
        setSelectedTenantIds(activeTenants.map(t => t.id));
        setCustomAmounts({});
      }
    } else {
      // New Expense Defaults
      setTitle('');
      setCategory('luce');
      setAmount('');
      setDate(todayStr);
      setNotes('');
      setEnableSplit(activeTenants.length > 0);
      setSelectedTenantIds(activeTenants.map(t => t.id));
      setCustomAmounts({});
    }
  }, [isOpen, expenseToEdit, tenants]);

  // Quick recalculate equal splits
  const handleEqualSplit = (totalVal?: number | '') => {
    const numAmount = totalVal !== undefined ? (totalVal === '' ? 0 : Number(totalVal)) : (amount === '' ? 0 : Number(amount));
    if (selectedTenantIds.length === 0 || numAmount <= 0) {
      setCustomAmounts({});
      return;
    }
    const perPerson = Number((numAmount / selectedTenantIds.length).toFixed(2));
    const newAmounts: Record<string, number | ''> = {};
    selectedTenantIds.forEach((tId, idx) => {
      // Adjustment on last student for rounding cents if needed
      if (idx === selectedTenantIds.length - 1) {
        const currentSum = perPerson * (selectedTenantIds.length - 1);
        const remainder = Number((numAmount - currentSum).toFixed(2));
        newAmounts[tId] = remainder;
      } else {
        newAmounts[tId] = perPerson;
      }
    });
    setCustomAmounts(newAmounts);
  };

  const handleToggleTenant = (tenantId: string) => {
    const isSelected = selectedTenantIds.includes(tenantId);
    let nextSelected: string[];
    if (isSelected) {
      nextSelected = selectedTenantIds.filter(id => id !== tenantId);
    } else {
      nextSelected = [...selectedTenantIds, tenantId];
    }
    setSelectedTenantIds(nextSelected);

    // Auto-recalculate equal shares for next selected tenants
    if (amount !== '' && Number(amount) > 0 && nextSelected.length > 0) {
      const numAmount = Number(amount);
      const perPerson = Number((numAmount / nextSelected.length).toFixed(2));
      const newAmounts: Record<string, number | ''> = {};
      nextSelected.forEach((tId, idx) => {
        if (idx === nextSelected.length - 1) {
          const sum = perPerson * (nextSelected.length - 1);
          newAmounts[tId] = Number((numAmount - sum).toFixed(2));
        } else {
          newAmounts[tId] = perPerson;
        }
      });
      setCustomAmounts(newAmounts);
    }
  };

  const handleSelectAllTenants = () => {
    const allIds = activeTenants.map(t => t.id);
    setSelectedTenantIds(allIds);
    if (amount !== '' && Number(amount) > 0 && allIds.length > 0) {
      const numAmount = Number(amount);
      const perPerson = Number((numAmount / allIds.length).toFixed(2));
      const newAmounts: Record<string, number | ''> = {};
      allIds.forEach((tId, idx) => {
        if (idx === allIds.length - 1) {
          const sum = perPerson * (allIds.length - 1);
          newAmounts[tId] = Number((numAmount - sum).toFixed(2));
        } else {
          newAmounts[tId] = perPerson;
        }
      });
      setCustomAmounts(newAmounts);
    }
  };

  const handleDeselectAllTenants = () => {
    setSelectedTenantIds([]);
    setCustomAmounts({});
  };

  const handleTenantAmountChange = (tenantId: string, val: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [tenantId]: val === '' ? '' : Number(val),
    }));
  };

  // Calculations for display
  const totalAmountNum = amount === '' ? 0 : Number(amount);
  const splitsSum = selectedTenantIds.reduce((sum, id) => {
    const val = customAmounts[id];
    return sum + (val === '' || val === undefined ? 0 : Number(val));
  }, 0);
  const diffFromTotal = Number((totalAmountNum - splitsSum).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount === '') {
      alert('Inserisci la descrizione e l’importo.');
      return;
    }

    let finalSplits: ExpenseSplit[] | undefined = undefined;

    if (enableSplit && selectedTenantIds.length > 0) {
      finalSplits = selectedTenantIds.map(tId => {
        const tenant = tenants.find(t => t.id === tId);
        const existing = expenseToEdit?.splits?.find(s => s.tenant_id === tId);
        const quota = customAmounts[tId] !== '' && customAmounts[tId] !== undefined
          ? Number(customAmounts[tId])
          : 0;

        return {
          tenant_id: tId,
          tenant_name: tenant?.name || existing?.tenant_name || 'Studente',
          amount: quota,
          is_paid: existing ? existing.is_paid : false,
          paid_date: existing ? existing.paid_date : undefined,
          notes: existing?.notes,
        };
      });
    }

    onSave({
      id: expenseToEdit ? expenseToEdit.id : `e-${Date.now()}`,
      title,
      category,
      amount: Number(amount),
      date,
      notes,
      splits: finalSplits,
      created_at: expenseToEdit?.created_at,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 38, 
              height: 38, 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(244, 63, 94, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fb7185' 
            }}>
              <Receipt size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>
                {expenseToEdit ? 'Modifica Bolletta / Spesa' : 'Registra Bolletta / Spesa'}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Uscita per la casa con ripartizione quote tra gli studenti
              </span>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ overflowY: 'auto', paddingRight: 4, flex: 1 }}>
          <form id="expense-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tipo Spesa / Categoria</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="luce">Energia Elettrica (Luce / Enel)</option>
                <option value="gas">Gas Metano / Riscaldamento</option>
                <option value="internet">Internet Wi-Fi Fibra</option>
                <option value="condominio">Spese Condominiali</option>
                <option value="tari">Tassa Rifiuti (TARI)</option>
                <option value="manutenzione">Manutenzione / Caldaia / Riparazioni</option>
                <option value="altro">Altra Spesa</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Descrizione / Fornitore</label>
              <input
                type="text"
                className="form-input"
                placeholder="es. Bolletta Enel bimestre settembre-ottobre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Importo Totale Spesa (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="es. 120.00"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAmount(val);
                    if (enableSplit && selectedTenantIds.length > 0) {
                      handleEqualSplit(val);
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data Spesa</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Note Aggiuntive (opzionale)</label>
              <input
                type="text"
                className="form-input"
                placeholder="es. Addebito su CC, scadenza 15 del mese..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* SEZIONE RIPARTIZIONE SUI RAGAZZI */}
            <div style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-medium)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#ffffff'
                }}>
                  <input
                    type="checkbox"
                    checked={enableSplit}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setEnableSplit(enabled);
                      if (enabled && selectedTenantIds.length === 0) {
                        handleSelectAllTenants();
                      }
                    }}
                    style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={17} color="#818cf8" />
                    <span>Ripartisci questa spesa tra i ragazzi</span>
                  </div>
                </label>

                {enableSplit && activeTenants.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => handleEqualSplit()}
                    title="Ricalcola quote in parti uguali"
                  >
                    <Calculator size={13} />
                    <span>Dividi in parti uguali</span>
                  </button>
                )}
              </div>

              {enableSplit && (
                <>
                  {activeTenants.length === 0 ? (
                    <div style={{ 
                      fontSize: '0.82rem', 
                      color: 'var(--text-muted)', 
                      padding: 10, 
                      background: 'rgba(0,0,0,0.2)', 
                      borderRadius: 6 
                    }}>
                      Nessuno studente attivo al momento nel gestionale.
                    </div>
                  ) : (
                    <div>
                      {/* Toolbar veloce seleziona */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: 10,
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <span>Seleziona chi partecipa al rimborso:</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={handleSelectAllTenants}
                            style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                          >
                            Tutti ({activeTenants.length})
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={handleDeselectAllTenants}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                          >
                            Nessuno
                          </button>
                        </div>
                      </div>

                      {/* Lista studenti con checkbox e input quota */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {activeTenants.map(tenant => {
                          const isSelected = selectedTenantIds.includes(tenant.id);
                          const quotaVal = customAmounts[tenant.id] ?? '';
                          const existing = expenseToEdit?.splits?.find(s => s.tenant_id === tenant.id);

                          return (
                            <div 
                              key={tenant.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                                border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 10, 
                                cursor: 'pointer', 
                                flex: 1 
                              }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleTenant(tenant.id)}
                                  style={{ width: 16, height: 16, accentColor: '#6366f1' }}
                                />
                                <div>
                                  <strong style={{ fontSize: '0.88rem', color: isSelected ? '#ffffff' : 'var(--text-muted)' }}>
                                    {tenant.name}
                                  </strong>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <span className={`badge ${tenant.room_id === 'room-1' ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                                      {tenant.room_id === 'room-1' ? 'Camera A' : 'Camera B'}
                                    </span>
                                    {existing?.is_paid && (
                                      <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Check size={11} /> Già pagato
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>

                              {isSelected && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quota: €</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={quotaVal}
                                    onChange={(e) => handleTenantAmountChange(tenant.id, e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                      width: 82,
                                      padding: '5px 8px',
                                      fontSize: '0.88rem',
                                      fontWeight: 700,
                                      color: '#ffffff',
                                      backgroundColor: 'var(--bg-input)',
                                      border: '1px solid var(--border-medium)',
                                      borderRadius: 6,
                                      textAlign: 'right'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Bilancio Ripartizione */}
                      <div style={{
                        marginTop: 12,
                        padding: 10,
                        borderRadius: 6,
                        background: diffFromTotal === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        border: `1px solid ${diffFromTotal === 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8
                      }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Totale Ripartito: </span>
                          <strong style={{ color: '#ffffff' }}>€{splitsSum.toFixed(2)}</strong>
                          <span style={{ color: 'var(--text-muted)' }}> su €{totalAmountNum.toFixed(2)}</span>
                        </div>

                        {diffFromTotal === 0 ? (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <Check size={14} /> 100% Ripartito
                          </span>
                        ) : diffFromTotal > 0 ? (
                          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={14} /> €{diffFromTotal.toFixed(2)} a tuo carico
                          </span>
                        ) : (
                          <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={14} /> Esito: +€{Math.abs(diffFromTotal).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Annulla
          </button>
          <button form="expense-form" type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
            <Save size={16} />
            <span>{expenseToEdit ? 'Aggiorna Spesa' : 'Salva Spesa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
