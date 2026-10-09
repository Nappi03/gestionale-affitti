import { useState, type FC } from 'react';
import { 
  History, 
  Search, 
  PlusCircle, 
  Trash2, 
  Printer, 
  TrendingUp, 
  Users,
  CreditCard
} from 'lucide-react';
import type { Payment, Room, Tenant } from '../types';
import { formatDate } from '../utils/dateUtils';

interface PaymentsArchiveViewProps {
  rooms: Room[];
  payments: Payment[];
  tenants?: Tenant[];
  onOpenRecordPayment: () => void;
  onDeletePayment: (paymentId: string) => void;
}

export const PaymentsArchiveView: FC<PaymentsArchiveViewProps> = ({
  rooms,
  payments,
  tenants = [],
  onOpenRecordPayment,
  onDeletePayment,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique years from payments
  const availableYears = Array.from(new Set([
    currentYear,
    currentYear - 1,
    currentYear + 1,
    ...payments.map(p => p.year)
  ])).sort((a, b) => b - a);

  // Extract unique tenant names
  const allTenantNames = Array.from(new Set([
    ...tenants.map(t => t.name),
    ...payments.map(p => p.tenant_name)
  ])).filter(Boolean).sort();

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (selectedYear !== 'all' && p.year !== Number(selectedYear)) {
      return false;
    }
    if (selectedRoom !== 'all' && p.room_id !== selectedRoom) {
      return false;
    }
    if (selectedTenant !== 'all' && p.tenant_name !== selectedTenant) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = p.tenant_name.toLowerCase().includes(q);
      const matchMonth = p.month_label.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      const matchMethod = p.payment_method.toLowerCase().includes(q);
      if (!matchName && !matchMonth && !matchNotes && !matchMethod) {
        return false;
      }
    }
    return true;
  });

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Breakdown per student in this period
  const studentBreakdown = filteredPayments.reduce((acc, p) => {
    if (!acc[p.tenant_name]) {
      acc[p.tenant_name] = { total: 0, count: 0, roomId: p.room_id };
    }
    acc[p.tenant_name].total += Number(p.amount);
    acc[p.tenant_name].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number; roomId: string }>);

  const studentBreakdownList = Object.entries(studentBreakdown).sort((a, b) => b[1].total - a[1].total);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(99, 102, 241, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0
            }}>
              <History size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>Archivio Incassi & Resoconto</h2>
              <p className="page-header-subtext" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Storico permanente per studente e anno fiscale
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="Stampa o esporta PDF">
              <Printer size={14} />
              <span className="btn-text-full">Stampa Resoconto</span>
              <span className="btn-text-short">Stampa</span>
            </button>

            <button 
              className="btn btn-success btn-sm btn-text-full" 
              onClick={onOpenRecordPayment}
              title="Registra incasso"
            >
              <PlusCircle size={14} />
              <span>+ Registra Incasso</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for the selected period - Perfectly balanced on mobile */}
      <div className="archive-stats-container" style={{ marginBottom: 18 }}>
        {/* Hero Card: Totale Incassato */}
        <div className="glass-card stat-card archive-hero-card" style={{ ['--stat-glow' as string]: '#10b981' }}>
          <div className="stat-header">
            <span>Totale Incassato {selectedYear === 'all' ? '(Tutti gli Anni)' : `Anno ${selectedYear}`}</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            €{totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-subtext">
            {filteredPayments.length} mensilità registrate
          </div>
        </div>

        {/* Sub Stats Row: 2 columns side by side */}
        <div className="archive-sub-stats-grid">
          <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#818cf8' }}>
            <div className="stat-header">
              <span>Studenti con Incassi</span>
              <Users size={16} color="#818cf8" />
            </div>
            <div className="stat-value" style={{ color: '#ffffff', fontSize: '1.4rem' }}>
              {studentBreakdownList.length} ragazzi
            </div>
            <div className="stat-subtext">
              Periodo selezionato
            </div>
          </div>

          <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#f59e0b' }}>
            <div className="stat-header">
              <span>Media per Ragazzo</span>
              <CreditCard size={16} color="#f59e0b" />
            </div>
            <div className="stat-value" style={{ color: '#fbbf24', fontSize: '1.4rem' }}>
              €{studentBreakdownList.length > 0 
                ? (totalAmount / studentBreakdownList.length).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
                : '0'}
            </div>
            <div className="stat-subtext">
              Media nel periodo
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar - Modern Mobile Friendly Design */}
      <div className="glass-card archive-filters-card" style={{ padding: '16px 18px', marginBottom: 20 }}>
        <div className="archive-filters-grid">
          {/* Row 1: Anno e Camera */}
          <div className="archive-filters-row">
            <select
              id="select-archive-year"
              className="form-select archive-filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">📅 Tutti gli anni</option>
              {availableYears.map(y => (
                <option key={y} value={String(y)}>📅 Anno {y}</option>
              ))}
            </select>

            <select
              className="form-select archive-filter-select"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              <option value="all">🚪 Tutte le Camere</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.id === 'room-1' ? 'Camera A' : 'Camera B'}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Studente */}
          <select
            className="form-select archive-filter-select"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
          >
            <option value="all">👤 Tutti gli Studenti</option>
            {allTenantNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {/* Row 3: Ricerca */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cerca studente, mese o causale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Per-Person Annual Breakdown Summary */}
      {studentBreakdownList.length > 0 && (
        <div className="glass-card" style={{ padding: 18, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.98rem', marginBottom: 12, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color="var(--accent-primary)" />
            <span>Riepilogo Totali per Studente {selectedYear === 'all' ? '(Tutti gli Anni)' : `(${selectedYear})`}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {studentBreakdownList.map(([name, data]) => {
              const isRoom1 = data.roomId === 'room-1';
              return (
                <div
                  key={name}
                  style={{
                    background: 'rgba(9, 14, 26, 0.6)',
                    border: `1px solid ${isRoom1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#ffffff', display: 'block' }}>{name}</strong>
                      <span className={`badge ${isRoom1 ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.68rem', padding: '1px 6px', marginTop: 3 }}>
                        {isRoom1 ? 'Camera A' : 'Camera B'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {data.count} mesi
                    </span>
                  </div>

                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Totale Versato:</span>
                    <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>
                      €{data.total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Payments List & Table */}
      <div className="glass-card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>
          Elenco Dettagliato Incassi ({filteredPayments.length})
        </h3>

        {filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Nessun pagamento registrato per i filtri selezionati.
          </div>
        ) : (
          <>
            {/* Mobile Card List (shown on small screens) */}
            <div className="archive-mobile-cards">
              {filteredPayments.map(p => (
                <div key={p.id} className="payment-mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <strong style={{ fontSize: '0.96rem', color: '#ffffff', display: 'block' }}>
                        {p.tenant_name}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span className={`badge ${p.room_id === 'room-1' ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {p.room_id === 'room-1' ? 'Camera A' : 'Camera B'}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {p.month_label}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '1.15rem', color: '#10b981', display: 'block' }}>
                        €{Number(p.amount).toFixed(2)}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {p.payment_method}
                      </span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginTop: 8, 
                    paddingTop: 8, 
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>Data incasso: {formatDate(p.payment_date)}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      title="Elimina registrazione"
                      onClick={() => {
                        if (window.confirm(`Eliminare la registrazione del pagamento di €${p.amount} per ${p.month_label} di ${p.tenant_name}?`)) {
                          onDeletePayment(p.id);
                        }
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Elimina</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (shown on desktop) */}
            <div className="archive-desktop-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Data Incasso</th>
                    <th style={{ padding: '12px 14px' }}>Mensilità</th>
                    <th style={{ padding: '12px 14px' }}>Studente / Ragazzo</th>
                    <th style={{ padding: '12px 14px' }}>Camera</th>
                    <th style={{ padding: '12px 14px' }}>Metodo</th>
                    <th style={{ padding: '12px 14px' }}>Note / Causale</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Importo</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr 
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {formatDate(p.payment_date)}
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ffffff' }}>
                        {p.month_label}
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {p.tenant_name}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${p.room_id === 'room-1' ? 'badge-room1' : 'badge-room2'}`}>
                          {p.room_id === 'room-1' ? 'Camera A' : 'Camera B'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {p.payment_method}
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {p.notes || '-'}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                        €{Number(p.amount).toFixed(2)}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          title="Elimina registrazione"
                          onClick={() => {
                            if (window.confirm(`Eliminare la registrazione del pagamento di €${p.amount} per ${p.month_label} di ${p.tenant_name}?`)) {
                              onDeletePayment(p.id);
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
          </>
        )}
      </div>
    </div>
  );
};
