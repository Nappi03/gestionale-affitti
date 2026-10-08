import { useState, type FC } from 'react';
import { X, Receipt, Save } from 'lucide-react';
import type { HouseExpense } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: HouseExpense) => void;
}

export const ExpenseModal: FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HouseExpense['category']>('luce');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      alert('Inserisci la descrizione e l’importo.');
      return;
    }

    onSave({
      id: `e-${Date.now()}`,
      title,
      category,
      amount: Number(amount),
      date,
      notes,
    });

    setTitle('');
    setAmount('');
    setNotes('');
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
              background: 'rgba(244, 63, 94, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fb7185' 
            }}>
              <Receipt size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Registra Bolletta / Spesa</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Uscita per la gestione dell'appartamento
              </span>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
              placeholder="es. Bolletta Enel bimestre agosto-settembre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Importo (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="es. 85.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
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
              placeholder="es. Addebito conto, pagato con bonifico..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
              <Save size={16} />
              <span>Salva Spesa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
