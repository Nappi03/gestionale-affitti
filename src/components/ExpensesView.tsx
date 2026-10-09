import { useState, type FC } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  TrendingDown, 
  Tag
} from 'lucide-react';
import type { HouseExpense } from '../types';
import { formatDate } from '../utils/dateUtils';

interface ExpensesViewProps {
  expenses: HouseExpense[];
  onOpenNewExpenseModal: () => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: FC<ExpensesViewProps> = ({
  expenses,
  onOpenNewExpenseModal,
  onDeleteExpense,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  const availableYears = Array.from(new Set([
    currentYear,
    currentYear - 1,
    ...expenses.map(e => new Date(e.date).getFullYear())
  ])).sort((a, b) => b - a);

  const filtered = expenses.filter(e => {
    if (selectedYear !== 'all') {
      const y = new Date(e.date).getFullYear();
      if (String(y) !== selectedYear) return false;
    }
    return true;
  });

  const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      {/* Header */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 42, 
              height: 42, 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(244, 63, 94, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fb7185' 
            }}>
              <Receipt size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Bollette & Spese di Gestione Casa</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Registro uscite per luce, gas, internet, condominio e manutenzioni
              </p>
            </div>
          </div>

          <button 
            id="btn-add-expense-view"
            className="btn btn-primary btn-sm"
            onClick={onOpenNewExpenseModal}
          >
            <Plus size={16} />
            <span>+ Registra Spesa / Bolletta</span>
          </button>
        </div>
      </div>

      {/* KPI & Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#f43f5e' }}>
          <div className="stat-header">
            <span>Uscite Totali {selectedYear === 'all' ? '(Tutti gli anni)' : `Anno ${selectedYear}`}</span>
            <TrendingDown size={18} color="#fb7185" />
          </div>
          <div className="stat-value" style={{ color: '#fb7185' }}>
            €{totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-subtext">
            {filtered.length} voci registrate
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filtra per Anno:</span>
          <select
            className="form-select"
            style={{ width: 'auto', fontWeight: 700 }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">Tutti gli anni</option>
            {availableYears.map(y => (
              <option key={y} value={String(y)}>Anno {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Nessuna spesa registrata per questo periodo.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Data</th>
                  <th style={{ padding: '10px 14px' }}>Descrizione Spesa</th>
                  <th style={{ padding: '10px 14px' }}>Categoria</th>
                  <th style={{ padding: '10px 14px' }}>Note</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Importo</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {formatDate(e.date)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>
                      {e.title}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge badge-platform" style={{ textTransform: 'uppercase' }}>
                        <Tag size={10} /> {e.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {e.notes || '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#fb7185' }}>
                      -€{Number(e.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() => {
                          if (window.confirm(`Eliminare la spesa "${e.title}"?`)) {
                            onDeleteExpense(e.id);
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
