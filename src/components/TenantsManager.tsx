import { type FC } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  UserMinus, 
  Trash2, 
  Phone, 
  Mail, 
  RotateCcw,
  BedDouble,
  MessageSquare
} from 'lucide-react';
import type { Tenant, Room, RoomId } from '../types';

interface TenantsManagerProps {
  rooms: Room[];
  tenants: Tenant[];
  onOpenNewTenantModal: (preselectedRoomId?: RoomId) => void;
  onEditTenant: (tenant: Tenant) => void;
  onArchiveTenant: (tenantId: string) => void;
  onDeleteTenant: (tenantId: string) => void;
  onReactivateTenant: (tenant: Tenant) => void;
}

export const TenantsManager: FC<TenantsManagerProps> = ({
  rooms,
  tenants,
  onOpenNewTenantModal,
  onEditTenant,
  onArchiveTenant,
  onDeleteTenant,
  onReactivateTenant,
}) => {
  const activeTenants = tenants.filter(t => t.is_active);
  const archivedTenants = tenants.filter(t => !t.is_active);

  const studentsRoomA = activeTenants.filter(t => t.room_id === 'room-1');
  const studentsRoomB = activeTenants.filter(t => t.room_id === 'room-2');
  const totalRentAll = activeTenants.reduce((sum, t) => sum + (Number(t.monthly_rent) || 0), 0);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'ST').toUpperCase();
  };

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
              background: 'rgba(99, 102, 241, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#818cf8' 
            }}>
              <Users size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Anagrafica Studenti & Camere</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Gestione dei ragazzi domiciliati in Camera A e Camera B (media 2 studenti per stanza)
              </p>
            </div>
          </div>

          <button 
            id="btn-add-tenant-main"
            className="btn btn-primary"
            onClick={() => onOpenNewTenantModal()}
          >
            <UserPlus size={16} />
            <span>+ Aggiungi Nuovo Studente</span>
          </button>
        </div>
      </div>

      {/* Top Quick Overview KPIs */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#818cf8' }}>
          <div className="stat-header">
            <span>Studenti Totali Domiciliati</span>
            <Users size={18} color="#818cf8" />
          </div>
          <div className="stat-value" style={{ color: '#ffffff' }}>
            {activeTenants.length} ragazzi
          </div>
          <div className="stat-subtext">
            Negli alloggi dell'appartamento
          </div>
        </div>

        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#10b981' }}>
          <div className="stat-header">
            <span>Camera A</span>
            <BedDouble size={18} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {studentsRoomA.length} studenti
          </div>
          <div className="stat-subtext">
            Media 2 studenti per stanza
          </div>
        </div>

        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#6366f1' }}>
          <div className="stat-header">
            <span>Camera B</span>
            <BedDouble size={18} color="#6366f1" />
          </div>
          <div className="stat-value" style={{ color: '#a5b4fc' }}>
            {studentsRoomB.length} studenti
          </div>
          <div className="stat-subtext">
            Media 2 studenti per stanza
          </div>
        </div>

        <div className="glass-card stat-card" style={{ ['--stat-glow' as string]: '#f59e0b' }}>
          <div className="stat-header">
            <span>Canoni Mensili Complessivi</span>
            <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>€/mese</span>
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            €{totalRentAll}
          </div>
          <div className="stat-subtext">
            Somma quote individuali
          </div>
        </div>
      </div>

      {/* Room Grouping Sections */}
      {rooms.map(room => {
        const isRoomA = room.id === 'room-1';
        const roomStudents = isRoomA ? studentsRoomA : studentsRoomB;
        const accentColor = isRoomA ? 'var(--room1-main)' : 'var(--room2-main)';

        return (
          <div key={room.id} style={{ marginBottom: 36 }}>
            {/* Room Header Banner */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: 12,
              marginBottom: 16,
              paddingBottom: 10,
              borderBottom: `2px solid ${accentColor}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${isRoomA ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                  {room.name}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  ({roomStudents.length} studenti assegnati • Canone base €{room.defaultRent}/mese)
                </span>
              </div>

              <button
                className={`btn btn-sm ${isRoomA ? 'btn-outline-room1' : 'btn-outline-room2'}`}
                onClick={() => onOpenNewTenantModal(room.id)}
              >
                <UserPlus size={14} />
                <span>+ Aggiungi Studente in {room.name}</span>
              </button>
            </div>

            {/* Students Grid inside this Room */}
            {roomStudents.length === 0 ? (
              <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: 12 }}>Nessun ragazzo attualmente assegnato a {room.name}.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenNewTenantModal(room.id)}
                >
                  <UserPlus size={14} />
                  <span>Assegna Studente a {room.name}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                {roomStudents.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="glass-card"
                    style={{
                      padding: 22,
                      borderLeft: `4px solid ${accentColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Top Row: Avatar + Name + Room Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                            <span className={`badge ${isRoomA ? 'badge-room1' : 'badge-room2'}`} style={{ fontSize: '0.72rem', padding: '2px 8px', marginTop: 4 }}>
                              {room.name}
                            </span>
                          </div>
                        </div>

                        <span className="badge badge-paid" style={{ fontSize: '0.74rem' }}>
                          Inquilino Attivo
                        </span>
                      </div>

                      {/* Economic and Stay Terms */}
                      <div style={{
                        background: 'rgba(9, 14, 26, 0.55)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 14,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                        fontSize: '0.84rem',
                        marginBottom: 14
                      }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Canone Mensile</span>
                          <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>€{tenant.monthly_rent}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Cauzione Versata</span>
                          <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>€{tenant.deposit_amount}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Inizio Permanenza</span>
                          <span>{tenant.start_date}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Scadenza Prevista</span>
                          <span>{tenant.end_date}</span>
                        </div>
                      </div>

                      {/* Contacts & Notes */}
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                        {tenant.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Phone size={13} color="var(--text-muted)" />
                              <a href={`tel:${tenant.phone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                                {tenant.phone}
                              </a>
                            </div>

                            <a
                              href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: '0.76rem' }}
                            >
                              <MessageSquare size={12} />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}

                        {tenant.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Mail size={13} color="var(--text-muted)" />
                            <a href={`mailto:${tenant.email}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                              {tenant.email}
                            </a>
                          </div>
                        )}

                        {tenant.notes && (
                          <div style={{
                            marginTop: 8,
                            padding: 8,
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)'
                          }}>
                            <strong>Note:</strong> {tenant.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => onEditTenant(tenant)}
                      >
                        <Edit3 size={14} />
                        <span>Modifica</span>
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        style={{ flex: 1.2 }}
                        onClick={() => {
                          if (window.confirm(`Vuoi togliere ${tenant.name}? Il posto in ${room.name} risulterà libero e il ragazzo verrà archiviato nello storico mantenendo tutti i suoi pagamenti passati.`)) {
                            onArchiveTenant(tenant.id);
                          }
                        }}
                        title="Libera il posto e sposta lo studente nell'archivio"
                      >
                        <UserMinus size={14} />
                        <span>Togli (Libera Posto)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Historical Archive of Past Tenants */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: 14, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Archivio Ex-Studenti (Storico Ragazzi Passati)</span>
        </h3>

        {archivedTenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            Nessun ex-studente archiviato. Quando un ragazzo lascia la stanza, apparirà qui con tutto il suo storico dei canoni.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Nome Ragazzo</th>
                  <th style={{ padding: '10px 14px' }}>Camera</th>
                  <th style={{ padding: '10px 14px' }}>Periodo di Permanenza</th>
                  <th style={{ padding: '10px 14px' }}>Canone Concordato</th>
                  <th style={{ padding: '10px 14px' }}>Contatti & Note</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {archivedTenants.map((at) => (
                  <tr key={at.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#ffffff' }}>
                      {at.name}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge ${at.room_id === 'room-1' ? 'badge-room1' : 'badge-room2'}`}>
                        {at.room_id === 'room-1' ? 'Camera A' : 'Camera B'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {at.start_date} ➔ {at.end_date}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      €{at.monthly_rent}/mese
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {at.phone} {at.notes && `• ${at.notes}`}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Ripristina come studente attivo"
                          onClick={() => onReactivateTenant(at)}
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          title="Elimina definitivamente scheda"
                          onClick={() => {
                            if (window.confirm(`Eliminare definitivamente la scheda di ${at.name}?`)) {
                              onDeleteTenant(at.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
