import { useState, useEffect, type FC } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import type { Tenant, Room, RoomId } from '../types';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
  tenantToEdit: Tenant | null;
  rooms: Room[];
  preselectedRoomId?: RoomId;
}

export const TenantModal: FC<TenantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tenantToEdit,
  rooms,
  preselectedRoomId,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState<RoomId>('room-1');
  const [monthlyRent, setMonthlyRent] = useState<number | ''>(300);
  const [depositAmount, setDepositAmount] = useState<number | ''>(100);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2027-07-31');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (tenantToEdit) {
      setName(tenantToEdit.name);
      setPhone(tenantToEdit.phone || '');
      setEmail(tenantToEdit.email || '');
      setRoomId(tenantToEdit.room_id);
      setMonthlyRent(tenantToEdit.monthly_rent);
      setDepositAmount(tenantToEdit.deposit_amount);
      setStartDate(tenantToEdit.start_date);
      setEndDate(tenantToEdit.end_date);
      setNotes(tenantToEdit.notes || '');
    } else {
      const targetRoom = preselectedRoomId || 'room-1';
      setName('');
      setPhone('');
      setEmail('');
      setRoomId(targetRoom);
      setMonthlyRent(300);
      setDepositAmount(100);
      setStartDate('2026-10-01');
      setEndDate('2027-07-31');
      setNotes('');
    }
  }, [tenantToEdit, preselectedRoomId, isOpen]);

  if (!isOpen) return null;

  const handleRoomChange = (newRoom: RoomId) => {
    setRoomId(newRoom);
    if (!tenantToEdit) {
      setMonthlyRent(300);
      setDepositAmount(100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !monthlyRent || !startDate || !endDate) {
      alert('Inserisci il nome dello studente, il canone e le date di permanenza.');
      return;
    }

    onSave({
      id: tenantToEdit ? tenantToEdit.id : `t-${Date.now()}`,
      name,
      phone,
      email,
      room_id: roomId,
      monthly_rent: Number(monthlyRent),
      deposit_amount: Number(depositAmount) || 0,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
      notes,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(99, 102, 241, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#818cf8' 
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>
                {tenantToEdit ? 'Modifica Scheda Studente' : 'Aggiungi Nuovo Studente'}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Assegnazione camera e canone mensile individuale
              </span>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Room Selector */}
          <div className="form-group">
            <label className="form-label">Assegna Camera:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {rooms.map(room => {
                const isSelected = roomId === room.id;
                const isRoomA = room.id === 'room-1';
                return (
                  <button
                    key={room.id}
                    type="button"
                    className={`btn btn-sm ${isRoomA ? (isSelected ? 'btn-outline-room1' : 'btn-secondary') : (isSelected ? 'btn-outline-room2' : 'btn-secondary')}`}
                    style={{ 
                      borderWidth: 2, 
                      borderColor: isSelected ? (isRoomA ? 'var(--room1-main)' : 'var(--room2-main)') : 'var(--border-subtle)',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                    onClick={() => handleRoomChange(room.id)}
                  >
                    <strong style={{ fontSize: '1rem' }}>{room.name}</strong>
                    <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Canone base €{room.defaultRent}/mese</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nome & Cognome Studente</label>
              <input
                id="input-tenant-name"
                type="text"
                className="form-input"
                placeholder="es. Giulia Neri"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefono (per WhatsApp)</label>
              <input
                id="input-tenant-phone"
                type="tel"
                className="form-input"
                placeholder="+39 333 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Canone Individuale al Mese (€)</label>
              <input
                id="input-tenant-rent"
                type="number"
                step="5"
                min="0"
                className="form-input"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cauzione Versata (€)</label>
              <input
                id="input-tenant-deposit"
                type="number"
                step="50"
                min="0"
                className="form-input"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Inizio Permanenza</label>
              <input
                id="input-tenant-start"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Scadenza Prevista</label>
              <input
                id="input-tenant-end"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Studente (opzionale)</label>
            <input
              id="input-tenant-email"
              type="email"
              className="form-input"
              placeholder="es. studente@universita.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note Personali (Genitore garante, facoltà, ecc.)</label>
            <textarea
              id="textarea-tenant-notes"
              className="form-textarea"
              rows={2}
              placeholder="es. Facoltà Medicina, papà garante Mario Rossi (+39 347 1234567)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Annulla
            </button>
            <button id="btn-submit-tenant" type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
              <Save size={16} />
              <span>{tenantToEdit ? 'Aggiorna Dati' : 'Salva Studente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
