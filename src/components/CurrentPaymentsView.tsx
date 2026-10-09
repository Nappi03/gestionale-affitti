import { useState, type FC } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  MessageSquare,
  Users,
  Search,
  Filter,
  Phone,
  BedDouble,
  UserPlus
} from 'lucide-react';
import type { Tenant, Payment, Room } from '../types';
import { formatDate } from '../utils/dateUtils';

interface CurrentPaymentsViewProps {
  rooms: Room[];
  tenants: Tenant[];
  payments: Payment[];
  onOpenRecordPayment: (tenant: Tenant, monthKey: string, monthLabel: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onOpenNewTenantModal?: () => void;
}

export const CurrentPaymentsView: FC<CurrentPaymentsViewProps> = ({
  rooms,
  tenants,
  payments,
  onOpenRecordPayment,
  onDeletePayment,
  onOpenNewTenantModal,
}) => {
  // Current month tracker
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth()); // 0-11
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'room-1' | 'room-2'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const monthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const monthLabel = `${monthNames[currentMonthIndex]} ${currentYear}`;

  const prevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonthIndex(now.getMonth());
  };

  // Active tenants (persone)
  const activeTenants = tenants.filter(t => t.is_active);

  // Helper to find payment for a specific tenant in the active month
  const getTenantPaymentForMonth = (tenantId: string, mKey: string) => {
    return payments.find(p => p.tenant_id === tenantId && p.month_key === mKey);
  };

  // Financial KPIs for the selected month calculated PER PERSONA
  const expectedTotal = activeTenants.reduce((sum, t) => sum + (Number(t.monthly_rent) || 0), 0);
  
  const paidTenantsThisMonth = activeTenants.filter(t => !!getTenantPaymentForMonth(t.id, monthKey));
  const pendingTenantsThisMonth = activeTenants.filter(t => !getTenantPaymentForMonth(t.id, monthKey));

  const collectedTotal = activeTenants.reduce((sum, t) => {
    const p = getTenantPaymentForMonth(t.id, monthKey);
    return sum + (p ? Number(p.amount) : 0);
  }, 0);

  const pendingTotal = Math.max(0, expectedTotal - collectedTotal);

  // Filtered tenants list
  const displayedTenants = activeTenants.filter(t => {
    const payment = getTenantPaymentForMonth(t.id, monthKey);
    const isPaid = !!payment;

    if (filterStatus === 'pending' && isPaid) return false;
    if (filterStatus === 'paid' && !isPaid) return false;
    if (filterStatus === 'room-1' && t.room_id !== 'room-1') return false;
    if (filterStatus === 'room-2' && t.room_id !== 'room-2') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchPhone = (t.phone || '').toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchNotes) return false;
    }

    return true;
  });

  // Recent 5 months overview
  const recentMonths = [-2, -1, 0, 1, 2].map(offset => {
    const d = new Date(currentYear, currentMonthIndex + offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const k = `${y}-${String(m + 1).padStart(2, '0')}`;
    const lbl = `${monthNames[m]} ${y}`;
    return { key: k, label: lbl, short: `${monthNames[m].slice(0, 3)} ${y}` };
  });

  // Helper for initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'ST').toUpperCase();
  };

  return (
    <div>
      {/* Top Month Selector and Financial Summary */}
      <div className="glass-card month-overview-card">
        <div className="month-card-header">
          {/* Month Selector Buttons */}
          <div className="month-selector-group">
            <button id="btn-month-prev" className="btn btn-secondary btn-icon" onClick={prevMonth} title="Mese Precedente">
              <ChevronLeft size={20} />
            </button>

            <div className="month-title-wrapper">
              <span className="month-subtitle">Mese di Controllo Canoni</span>
              <h2 className="month-title-text">{monthLabel}</h2>
            </div>

            <button id="btn-month-next" className="btn btn-secondary btn-icon" onClick={nextMonth} title="Mese Successivo">
              <ChevronRight size={20} />
            </button>

            <button className="btn btn-secondary btn-sm btn-month-today" onClick={goToToday}>
              Oggi
            </button>
          </div>

          {/* Per-Person KPI Grid */}
          <div className="month-kpis-grid">
            {/* Studenti Totali */}
            <div className="month-kpi-item">
              <span className="kpi-label">Studenti</span>
              <strong className="kpi-val">{activeTenants.length} ragazzi</strong>
            </div>

            {/* Quanti hanno pagato */}
            <div className={`month-kpi-item ${pendingTenantsThisMonth.length === 0 && activeTenants.length > 0 ? 'kpi-success' : 'kpi-brand'}`}>
              <span className="kpi-label">Saldati</span>
              <strong className="kpi-val">
                {paidTenantsThisMonth.length} / {activeTenants.length}
              </strong>
            </div>

            {/* Totale Canoni Attesi */}
            <div className="month-kpi-item">
              <span className="kpi-label">Totale Atteso</span>
              <strong className="kpi-val">€{expectedTotal}</strong>
            </div>

            {/* Incassato */}
            <div className="month-kpi-item kpi-success">
              <span className="kpi-label">Incassato</span>
              <strong className="kpi-val text-success">€{collectedTotal}</strong>
            </div>

            {/* Da Incassare */}
            <div className={`month-kpi-item kpi-full-width ${pendingTotal > 0 ? 'kpi-danger' : 'kpi-success-subtle'}`}>
              <span className="kpi-label">
                {pendingTotal > 0 ? 'Da Incassare' : 'Tutto Saldato ✓'}
              </span>
              <strong className={`kpi-val ${pendingTotal > 0 ? 'text-danger' : 'text-success'}`}>
                €{pendingTotal}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card filter-toolbar-card">
        <div className="filter-toolbar-inner">
          {/* Quick Filters */}
          <div className="filter-chips-scroll">
            <span className="filter-label-chip">
              <Filter size={13} />
            </span>

            <button
              className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('all')}
            >
              Tutti ({activeTenants.length})
            </button>

            <button
              className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-danger' : 'btn-secondary'}`}
              style={filterStatus === 'pending' ? { background: '#f43f5e', color: '#ffffff' } : {}}
              onClick={() => setFilterStatus('pending')}
            >
              Da Pagare ({pendingTenantsThisMonth.length})
            </button>

            <button
              className={`btn btn-sm ${filterStatus === 'paid' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('paid')}
            >
              Saldati ({paidTenantsThisMonth.length})
            </button>

            <button
              className={`btn btn-sm ${filterStatus === 'room-1' ? 'btn-outline-room1' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('room-1')}
            >
              Camera A
            </button>

            <button
              className={`btn btn-sm ${filterStatus === 'room-2' ? 'btn-outline-room2' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('room-2')}
            >
              Camera B
            </button>
          </div>

          {/* Search Box */}
          <div className="filter-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Cerca studente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Per-Person Cards Grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="var(--accent-primary)" />
            <span>Situazione Studenti per {monthLabel}</span>
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Mostrando {displayedTenants.length} di {activeTenants.length} studenti
          </span>
        </div>

        {activeTenants.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: '#818cf8', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <BedDouble size={28} />
            </div>
            <h4 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: 6 }}>
              Nessuno studente ancora registrato
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: 460, margin: '0 auto 20px auto' }}>
              Nelle due stanze (Camera A e Camera B) hai una media di 2 studenti ciascuna. Aggiungi i singoli ragazzi per tenere sotto controllo chi ha pagato mese per mese.
            </p>
            {onOpenNewTenantModal && (
              <button className="btn btn-primary" onClick={onOpenNewTenantModal}>
                <UserPlus size={16} />
                <span>+ Aggiungi il Primo Studente</span>
              </button>
            )}
          </div>
        ) : displayedTenants.length === 0 ? (
          <div className="glass-card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
            Nessuno studente corrisponde ai filtri selezionati.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {displayedTenants.map((tenant) => {
              const payment = getTenantPaymentForMonth(tenant.id, monthKey);
              const isPaid = !!payment;
              const isRoomA = tenant.room_id === 'room-1';
              const room = rooms.find(r => r.id === tenant.room_id);

              return (
                <div
                  key={tenant.id}
                  className="glass-card"
                  style={{
                    padding: 24,
                    borderLeft: `5px solid ${isPaid ? '#10b981' : '#f43f5e'}`,
                    background: isPaid 
                      ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-card) 60%)' 
                      : 'linear-gradient(145deg, rgba(244, 63, 94, 0.05) 0%, var(--bg-card) 60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Header: Student Name + Room Badge + Paid/Pending Badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Avatar */}
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isRoomA 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.05))' 
                            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(99, 102, 241, 0.05))',
                          border: `1.5px solid ${isRoomA ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                          color: isRoomA ? '#34d399' : '#a5b4fc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.95rem'
                        }}>
                          {getInitials(tenant.name)}
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.25rem', color: '#ffffff', lineHeight: 1.2 }}>
                            {tenant.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span className={`badge ${isRoomA ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.76rem', padding: '3px 10px' }}>
                              {room ? room.name : (isRoomA ? 'Camera A' : 'Camera B')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status Pill */}
                      <div>
                        {isPaid ? (
                          <div className="badge badge-paid" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <CheckCircle2 size={15} />
                            <span>PAGATO</span>
                          </div>
                        ) : (
                          <div className="badge badge-pending" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <Clock size={15} />
                            <span>DA PAGARE</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial & Status Box for this student */}
                    <div style={{
                      background: 'rgba(9, 14, 26, 0.55)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 14,
                      marginBottom: 16
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Canone Mensile Individuale:</span>
                        <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>€{tenant.monthly_rent}</strong>
                      </div>

                      {isPaid ? (
                        <div style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                            ✓ Saldato il {formatDate(payment.payment_date)} ({payment.payment_method})
                          </span>
                          <strong style={{ color: '#ffffff' }}>€{payment.amount}</strong>
                        </div>
                      ) : (
                        <div style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: '1px solid var(--border-subtle)',
                          color: '#fb7185',
                          fontSize: '0.8rem'
                        }}>
                          ✕ In attesa del pagamento per {monthLabel}
                        </div>
                      )}
                    </div>

                    {/* Quick Contacts */}
                    {tenant.phone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} color="var(--text-muted)" />
                        <a href={`tel:${tenant.phone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                          {tenant.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for this student */}
                  <div className="student-card-actions" style={{ display: 'flex', gap: 10 }}>
                    {!isPaid ? (
                      <button
                        className="btn btn-success"
                        style={{ flex: 1.5 }}
                        onClick={() => onOpenRecordPayment(tenant, monthKey, monthLabel)}
                      >
                        <PlusCircle size={15} />
                        <span>Registra Incasso (€{tenant.monthly_rent})</span>
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => {
                          if (window.confirm(`Vuoi annullare la registrazione dell'affitto di ${tenant.name} per ${monthLabel}?`)) {
                            onDeletePayment(payment.id);
                          }
                        }}
                      >
                        Annulla Pagamento
                      </button>
                    )}

                    {tenant.phone && (
                      <a
                        href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          isPaid 
                            ? `Ciao ${tenant.name.split(' ')[0]}, ti confermo che ho ricevuto regolarmente l'affitto di ${monthLabel} (€${payment.amount}). Grazie mille!`
                            : `Ciao ${tenant.name.split(' ')[0]}, ti ricordo il pagamento dell'affitto di ${monthLabel} pari a €${tenant.monthly_rent}. Fammi sapere appena effettui il bonifico, grazie!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#25D366' }}
                        title="Invia messaggio WhatsApp"
                      >
                        <MessageSquare size={15} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-Month Status Matrix: PER PERSONA */}
      {activeTenants.length > 0 && (
        <div className="glass-card" style={{ padding: 22 }}>
          <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Storico Mensilità Rapido per Ogni Studente</span>
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Studente / Ragazzo</th>
                  <th style={{ padding: '10px 14px' }}>Camera</th>
                  <th style={{ padding: '10px 14px' }}>Canone</th>
                  {recentMonths.map(m => (
                    <th key={m.key} style={{ padding: '10px 12px', textAlign: 'center', color: m.key === monthKey ? '#a5b4fc' : 'var(--text-muted)' }}>
                      {m.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeTenants.map(tenant => (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>
                      {tenant.name}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge ${tenant.room_id === 'room-1' ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.72rem' }}>
                        {tenant.room_id === 'room-1' ? 'Camera A' : 'Camera B'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      €{tenant.monthly_rent}
                    </td>
                    {recentMonths.map(m => {
                      const p = getTenantPaymentForMonth(tenant.id, m.key);
                      const isCurrent = m.key === monthKey;

                      return (
                        <td 
                          key={m.key} 
                          style={{ 
                            padding: '10px 12px', 
                            textAlign: 'center',
                            background: isCurrent ? 'rgba(99, 102, 241, 0.05)' : undefined 
                          }}
                        >
                          {p ? (
                            <span 
                              style={{ 
                                color: '#10b981', 
                                fontWeight: 600, 
                                fontSize: '0.76rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '4px 8px',
                                borderRadius: 4,
                                display: 'inline-block'
                              }}
                              title={`Pagato il ${formatDate(p.payment_date)} (€${p.amount})`}
                            >
                              ✓ Pagato
                            </span>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ 
                                fontSize: '0.72rem', 
                                padding: '3px 7px',
                                color: '#fb7185',
                                borderColor: 'rgba(244, 63, 94, 0.3)'
                              }}
                              onClick={() => onOpenRecordPayment(tenant, m.key, m.label)}
                              title={`Clicca per registrare il pagamento di ${m.label}`}
                            >
                              ✕ Incassa
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
