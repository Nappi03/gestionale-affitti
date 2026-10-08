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

  // Extract unique tenant names/ids from payments or active tenants
  const allTenantNames = Array.from(new Set([
    ...tenants.map(t => t.name),
    ...payments.map(p => p.tenant_name)
  ])).filter(Boolean);

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (selectedYear !== 'all' && String(p.year) !== selectedYear) return false;
    if (selectedRoom !== 'all' && p.room_id !== selectedRoom) return false;
    if (selectedTenant !== 'all' && p.tenant_name !== selectedTenant) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = p.tenant_name.toLowerCase().includes(term);
      const matchMonth = p.month_label.toLowerCase().includes(term);
      const matchNotes = (p.notes || '').toLowerCase().includes(term);
      if (!matchName && !matchMonth && !matchNotes) return false;
    }
    return true;
  });

  // KPI calculations for selected period
  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Per-Student Totals aggregation (Breakdown per persona)
  const studentTotalsMap: { [studentName: string]: { total: number; count: number; roomId: string } } = {};
  filteredPayments.forEach(p => {
    if (!studentTotalsMap[p.tenant_name]) {
      studentTotalsMap[p.tenant_name] = { total: 0, count: 0, roomId: p.room_id };
    }
    studentTotalsMap[p.tenant_name].total += Number(p.amount);
    studentTotalsMap[p.tenant_name].count += 1;
  });

  const studentBreakdownList = Object.entries(studentTotalsMap).sort((a, b) => b[1].total - a[1].total);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 42, 
              height: 42, 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(16, 185, 129, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#34d399' 
            }}>
              <History size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Archivio Storico Pagamenti & Resoconto</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Resoconto permanente per studente e per anno per avere il quadro fiscale sempre sotto controllo
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="Stampa o esporta PDF">
              <Printer size={15} />
              <span>Stampa Resoconto</span>
            </button>

            <button 
              id="btn-add-payment-archive"
              className="btn btn-success btn-sm" 
              onClick={onOpenRecordPayment}
            >
              <PlusCircle size={15} />
              <span>+ Registra Pagamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for the selected period */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#10b981' }}>
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

        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#818cf8' }}>
          <div className="stat-header">
            <span>Studenti con Incassi Registrati</span>
            <Users size={18} color="#818cf8" />
          </div>
          <div className="stat-value" style={{ color: '#ffffff' }}>
            {studentBreakdownList.length} ragazzi
          </div>
          <div className="stat-subtext">
            Nel periodo selezionato
          </div>
        </div>

        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#f59e0b' }}>
          <div className="stat-header">
            <span>Media Incassata a Studente</span>
            <CreditCard size={18} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            €{studentBreakdownList.length > 0 
              ? (totalAmount / studentBreakdownList.length).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
              : '0'}
          </div>
          <div className="stat-subtext">
            Quota media per ragazzo
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Year selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Anno:</span>
            <select
              id="select-archive-year"
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

          {/* Student selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Studente:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
            >
              <option value="all">Tutti gli Studenti</option>
              {allTenantNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Room filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Camera:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              <option value="all">Tutte le Camere</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 34 }}
              placeholder="Cerca studente, mese o causale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Per-Person Annual Breakdown Summary */}
      {studentBreakdownList.length > 0 && (
        <div className="glass-card" style={{ padding: 22, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: 14, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--accent-primary)" />
            <span>Riepilogo Incassi per Singolo Studente {selectedYear === 'all' ? '(Tutti gli Anni)' : `(${selectedYear})`}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {studentBreakdownList.map(([name, data]) => {
              const isRoom1 = data.roomId === 'room-1';
              return (
                <div
                  key={name}
                  style={{
                    background: 'rgba(9, 14, 26, 0.6)',
                    border: `1px solid ${isRoom1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block' }}>{name}</strong>
                      <span className={`badge ${isRoom1 ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.7rem', padding: '2px 6px', marginTop: 4 }}>
                        {isRoom1 ? 'Camera A' : 'Camera B'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {data.count} mesi
                    </span>
                  </div>

                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Totale Versato:</span>
                    <strong style={{ fontSize: '1.15rem', color: '#10b981' }}>
                      €{data.total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Payments Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>
          Elenco Dettagliato Incassi ({filteredPayments.length} registrazioni)
        </h3>

        {filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Nessun pagamento registrato per i filtri selezionati.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {p.payment_date}
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
        )}
      </div>
    </div>
  );
};
