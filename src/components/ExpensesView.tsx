import { useState, type FC } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Edit3,
  TrendingDown, 
  Tag,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import type { HouseExpense, Tenant } from '../types';
import { formatDate } from '../utils/dateUtils';

interface ExpensesViewProps {
  expenses: HouseExpense[];
  tenants: Tenant[];
  onOpenNewExpenseModal: () => void;
  onEditExpense: (expense: HouseExpense) => void;
  onSaveExpense: (expense: HouseExpense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: FC<ExpensesViewProps> = ({
  expenses,
  tenants,
  onOpenNewExpenseModal,
  onEditExpense,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterSplitStatus, setFilterSplitStatus] = useState<'all' | 'pending' | 'paid' | 'not_split'>('all');
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (expenseId: string) => {
    setExpandedExpenseIds(prev => ({
      ...prev,
      [expenseId]: !prev[expenseId]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    expenses.forEach(e => { next[e.id] = true; });
    setExpandedExpenseIds(next);
  };

  const collapseAll = () => {
    setExpandedExpenseIds({});
  };

  // Helper to mark a specific student's split as paid or unpaid
  const handleToggleSplitPaid = (expense: HouseExpense, tenantId: string, markPaid: boolean) => {
    if (!expense.splits) return;

    const updatedSplits = expense.splits.map(s => {
      if (s.tenant_id === tenantId) {
        return {
          ...s,
          is_paid: markPaid,
          paid_date: markPaid ? (s.paid_date || todayStr) : undefined,
        };
      }
      return s;
    });

    onSaveExpense({
      ...expense,
      splits: updatedSplits,
    });
  };

  // Extract unique years
  const availableYears = Array.from(new Set([
    currentYear,
    currentYear - 1,
    ...expenses.map(e => new Date(e.date).getFullYear())
  ])).sort((a, b) => b - a);

  // Filtered expenses
  const filtered = expenses.filter(e => {
    if (selectedYear !== 'all') {
      const y = new Date(e.date).getFullYear();
      if (String(y) !== selectedYear) return false;
    }
    if (selectedCategory !== 'all' && e.category !== selectedCategory) {
      return false;
    }
    if (filterSplitStatus === 'pending') {
      // Must have splits and at least one unpaid
      if (!e.splits || e.splits.length === 0) return false;
      const hasUnpaid = e.splits.some(s => !s.is_paid);
      if (!hasUnpaid) return false;
    }
    if (filterSplitStatus === 'paid') {
      // Must have splits and ALL paid
      if (!e.splits || e.splits.length === 0) return false;
      const allPaid = e.splits.every(s => s.is_paid);
      if (!allPaid) return false;
    }
    if (filterSplitStatus === 'not_split') {
      if (e.splits && e.splits.length > 0) return false;
    }
    return true;
  });

  // Financial KPIs
  const totalOutflow = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  let totalCollectedFromStudents = 0;
  let totalPendingFromStudents = 0;
  let pendingCount = 0;

  filtered.forEach(e => {
    if (e.splits && e.splits.length > 0) {
      e.splits.forEach(s => {
        if (s.is_paid) {
          totalCollectedFromStudents += Number(s.amount);
        } else {
          totalPendingFromStudents += Number(s.amount);
          pendingCount += 1;
        }
      });
    }
  });

  const netLandlordExpense = Math.max(0, totalOutflow - totalCollectedFromStudents - totalPendingFromStudents);

  const getCategoryLabel = (cat: HouseExpense['category']) => {
    switch (cat) {
      case 'luce': return 'Luce / Energia';
      case 'gas': return 'Gas Metano';
      case 'internet': return 'Internet Wi-Fi';
      case 'condominio': return 'Condominio';
      case 'tari': return 'TARI (Rifiuti)';
      case 'manutenzione': return 'Manutenzione';
      default: return 'Altro';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(244, 63, 94, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fb7185' 
            }}>
              <Receipt size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Bollette, Spese & Ripartizione Studenti</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Registra le uscite dell'appartamento, ripartisci le quote e monitora chi ha saldato
              </p>
            </div>
          </div>

          <button 
            id="btn-add-expense-view"
            className="btn btn-primary"
            onClick={onOpenNewExpenseModal}
          >
            <Plus size={16} />
            <span className="btn-text-full">+ Registra Nuova Spesa / Bolletta</span>
            <span className="btn-text-short">+ Spesa</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {/* Card 1: Uscite Totali */}
        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#f43f5e' }}>
          <div className="stat-header">
            <span>Uscite Totali {selectedYear === 'all' ? '(Tutti gli anni)' : `Anno ${selectedYear}`}</span>
            <TrendingDown size={18} color="#fb7185" />
          </div>
          <div className="stat-value" style={{ color: '#fb7185' }}>
            €{totalOutflow.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-subtext">
            {filtered.length} bollette / spese registrate
          </div>
        </div>

        {/* Card 2: Quote Già Rimborsate */}
        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#10b981' }}>
          <div className="stat-header">
            <span>Quote Rimborsate dai Ragazzi</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            €{totalCollectedFromStudents.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-subtext">
            Incassate dai singoli inquilini
          </div>
        </div>

        {/* Card 3: Quote Ancora da Incassare */}
        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#f59e0b' }}>
          <div className="stat-header">
            <span>Quote Ancora da Saldare</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: totalPendingFromStudents > 0 ? '#f59e0b' : '#94a3b8' }}>
            €{totalPendingFromStudents.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-subtext" style={{ color: totalPendingFromStudents > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
            {pendingCount > 0 ? `⚠️ ${pendingCount} quote in attesa di pagamento` : '✓ Nessun rimborso in sospeso'}
          </div>
        </div>

        {/* Card 4: Costo Netto a Carico Proprietario */}
        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#6366f1' }}>
          <div className="stat-header">
            <span>Costo Netto a Tuo Carico</span>
            <Users size={18} color="#818cf8" />
          </div>
          <div className="stat-value" style={{ color: '#ffffff' }}>
            €{netLandlordExpense.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-subtext">
            Spese non ripartite o a carico casa
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {/* Filter Year */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Anno:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">Tutti gli anni</option>
                {availableYears.map(y => (
                  <option key={y} value={String(y)}>Anno {y}</option>
                ))}
              </select>
            </div>

            {/* Filter Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Categoria:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Tutte le categorie</option>
                <option value="luce">Luce / Energia</option>
                <option value="gas">Gas Metano</option>
                <option value="internet">Internet Wi-Fi</option>
                <option value="condominio">Condominio</option>
                <option value="tari">Tassa Rifiuti</option>
                <option value="manutenzione">Manutenzione</option>
                <option value="altro">Altro</option>
              </select>
            </div>

            {/* Filter Split Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Stato Ripartizione:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }}
                value={filterSplitStatus}
                onChange={(e) => setFilterSplitStatus(e.target.value as any)}
              >
                <option value="all">Tutte le spese</option>
                <option value="pending">⚠️ Con quote da saldare</option>
                <option value="paid">✓ Tutte le quote saldate</option>
                <option value="not_split">Non ripartite tra ragazzi</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
              onClick={expandAll}
            >
              Espandi tutti
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
              onClick={collapseAll}
            >
              Comprimi tutti
            </button>
          </div>
        </div>
      </div>

      {/* Main Expenses List */}
      <div className="glass-card" style={{ padding: 22 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Nessuna spesa trovata con i filtri selezionati.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(expense => {
              const isExpanded = !!expandedExpenseIds[expense.id];
              const splits = expense.splits || [];
              const isSplit = splits.length > 0;
              const paidSplits = splits.filter(s => s.is_paid);
              const unpaidSplits = splits.filter(s => !s.is_paid);
              const allSplitsPaid = isSplit && unpaidSplits.length === 0;

              return (
                <div 
                  key={expense.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: 'rgba(255, 255, 255, 0.015)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Expense Main Row Header */}
                  <div 
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      cursor: isSplit ? 'pointer' : 'default',
                      background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    }}
                    onClick={() => {
                      if (isSplit) toggleExpand(expense.id);
                    }}
                  >
                    {/* Left: Date, Title, Category Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {isSplit ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon btn-sm"
                          style={{ width: 28, height: 28, padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(expense.id);
                          }}
                          title={isExpanded ? 'Comprimi quote' : 'Espandi quote'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      ) : (
                        <div style={{ width: 28 }} />
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {formatDate(expense.date)}
                          </span>
                          <span className="badge badge-platform" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                            <Tag size={10} /> {getCategoryLabel(expense.category)}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginTop: 3 }}>
                          {expense.title}
                        </h4>
                        {expense.notes && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Note: {expense.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Split Status Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isSplit ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            <Users size={14} color="#818cf8" />
                            {allSplitsPaid ? (
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.84rem' }}>
                                ✓ Ripartito: Tutte le quote saldate ({paidSplits.length}/{splits.length})
                              </span>
                            ) : (
                              <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.84rem' }}>
                                ⚠️ Ripartito: {paidSplits.length}/{splits.length} saldati ({unpaidSplits.length} in sospeso)
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {isExpanded ? 'Clicca per chiudere quote' : 'Clicca per aprire dettagli quote'}
                          </span>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Spesa a carico tuo (non ripartita)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Importo Bolletta</span>
                        <strong style={{ fontSize: '1.2rem', color: '#fb7185' }}>
                          -€{Number(expense.amount).toFixed(2)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Modifica spesa e ripartizione"
                          onClick={() => onEditExpense(expense)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          title="Elimina spesa"
                          onClick={() => {
                            if (window.confirm(`Eliminare la spesa "${expense.title}"?`)) {
                              onDeleteExpense(expense.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section: Quota per ciascuno studente */}
                  {isSplit && isExpanded && (
                    <div style={{
                      padding: '16px 20px',
                      background: 'rgba(99, 102, 241, 0.04)',
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h5 style={{ fontSize: '0.86rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={15} />
                          <span>Ripartizione Quote Ragazzi (Totale Spesa: €{Number(expense.amount).toFixed(2)})</span>
                        </h5>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Segna con un click chi ha già pagato la sua parte
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {splits.map(split => {
                          const tenantObj = tenants.find(t => t.id === split.tenant_id);
                          const studentPhone = tenantObj?.phone;
                          const roomLabel = tenantObj?.room_id === 'room-1' ? 'Camera A' : (tenantObj?.room_id === 'room-2' ? 'Camera B' : '');

                          return (
                            <div 
                              key={split.tenant_id}
                              style={{
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-sm)',
                                background: split.is_paid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                                border: `1px solid ${split.is_paid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                              }}
                            >
                              {/* Student Info & Amount */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <strong style={{ fontSize: '0.92rem', color: '#ffffff', display: 'block' }}>
                                    {split.tenant_name}
                                  </strong>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    {roomLabel && (
                                      <span className={`badge ${tenantObj?.room_id === 'room-1' ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                        {roomLabel}
                                      </span>
                                    )}
                                    {studentPhone && (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {studentPhone}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Quota Dovuta</span>
                                  <strong style={{ fontSize: '1.05rem', color: split.is_paid ? '#10b981' : '#ffffff' }}>
                                    €{Number(split.amount).toFixed(2)}
                                  </strong>
                                </div>
                              </div>

                              {/* Status & Actions */}
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                paddingTop: 8, 
                                borderTop: '1px solid rgba(255, 255, 255, 0.06)' 
                              }}>
                                {/* Status badge */}
                                <div>
                                  {split.is_paid ? (
                                    <span style={{ 
                                      color: '#10b981', 
                                      fontSize: '0.8rem', 
                                      fontWeight: 600, 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 4 
                                    }}>
                                      <CheckCircle2 size={14} /> Saldato {split.paid_date ? `il ${formatDate(split.paid_date)}` : ''}
                                    </span>
                                  ) : (
                                    <span style={{ 
                                      color: '#fb7185', 
                                      fontSize: '0.8rem', 
                                      fontWeight: 600, 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 4 
                                    }}>
                                      <Clock size={14} /> In attesa di pagamento
                                    </span>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {split.is_paid ? (
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                      onClick={() => handleToggleSplitPaid(expense, split.tenant_id, false)}
                                      title="Annulla registrazione saldo"
                                    >
                                      <RotateCcw size={12} />
                                      <span>Annulla</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                      onClick={() => handleToggleSplitPaid(expense, split.tenant_id, true)}
                                    >
                                      <CheckCircle2 size={13} />
                                      <span>Segna come Pagato</span>
                                    </button>
                                  )}

                                  {/* WhatsApp Quick Message */}
                                  {studentPhone && (
                                    <a
                                      href={`https://wa.me/${studentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                        split.is_paid
                                          ? `Ciao ${split.tenant_name.split(' ')[0]}, ti confermo di aver ricevuto la tua quota di €${split.amount} per la spesa "${expense.title}". Grazie!`
                                          : `Ciao ${split.tenant_name.split(' ')[0]}, ti ricordo la tua quota per la spesa "${expense.title}" pari a €${split.amount}. Fammi sapere appena fai il bonifico, grazie!`
                                      )}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-secondary btn-icon btn-sm"
                                      style={{ color: '#25D366' }}
                                      title="Invia sollecito/conferma su WhatsApp"
                                    >
                                      <MessageSquare size={13} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If not split yet, offer a quick button to split it */}
                  {!isSplit && (
                    <div style={{
                      padding: '10px 20px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span>Questa spesa non è stata ancora ripartita tra gli studenti.</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                        onClick={() => onEditExpense(expense)}
                      >
                        <Users size={12} />
                        <span>Ripartisci tra i ragazzi</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
