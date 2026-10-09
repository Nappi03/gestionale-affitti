/**
 * Utility per la formattazione delle date nel formato italiano gg/mm/aaaa
 */

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';

  const clean = dateStr.trim();
  if (!clean) return '-';

  // Se è già nel formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  // Gestione formato YYYY-MM-DD (anche con orario T...)
  const datePart = clean.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // Fallback con Date parser
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return clean;
}
