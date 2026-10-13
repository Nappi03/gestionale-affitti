const fs = require('fs');
const path = require('path');

const basePath = 'C:\\Users\\emanu\\.gemini\\antigravity-ide\\brain\\3fa72ada-a7f5-4f42-81dc-8b0ed9500da4\\scratch\\excel_dump\\xl';

function parseSharedStrings() {
  const file = path.join(basePath, 'sharedStrings.xml');
  const xml = fs.readFileSync(file, 'utf8');
  const strings = [];
  const siRegex = /<si>(.*?)<\/si>/gs;
  let match;
  while ((match = siRegex.exec(xml)) !== null) {
    const siContent = match[1];
    const tRegex = /<t(?: [^>]*)?>(.*?)<\/t>/gs;
    let text = '';
    let tMatch;
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      text += tMatch[1];
    }
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    strings.push(text);
  }
  return strings;
}

function parseSheet(sheetFileName, sharedStrings) {
  const file = path.join(basePath, 'worksheets', sheetFileName);
  const xml = fs.readFileSync(file, 'utf8');
  const rows = [];
  const rowRegex = /<row [^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowNum = parseInt(rowMatch[1]);
    const rowContent = rowMatch[2];
    const cells = {};
    const cRegex = /<c [^>]*r="([A-Z]+)\d+"([^>]*)>(?:<v>(.*?)<\/v>)?<\/c>/gs;
    let cMatch;
    while ((cMatch = cRegex.exec(rowContent)) !== null) {
      const colLetter = cMatch[1];
      const attrs = cMatch[2];
      const rawVal = cMatch[3] !== undefined ? cMatch[3] : '';
      const isString = attrs.includes('t="s"');
      let val = rawVal;
      if (isString) {
        const idx = parseInt(rawVal);
        val = sharedStrings[idx] !== undefined ? sharedStrings[idx] : rawVal;
      }
      cells[colLetter] = val;
    }
    rows.push({ rowNum, cells });
  }
  return rows;
}

function cleanZone(rawZone) {
  if (!rawZone) return 'Napoli';
  // es: "11, Colli Aminei, Napoli" -> "Colli Aminei"
  // es: "72, Soccavo, Napoli" -> "Soccavo"
  // es: "Via Ben Hur, 72, Soccavo, Napoli" -> "Soccavo"
  const parts = rawZone.split(',').map(p => p.trim()).filter(Boolean);
  const filtered = parts.filter(p => !p.toLowerCase().includes('napoli') && !/^\d+$/.test(p) && !p.toLowerCase().startsWith('via') && !p.toLowerCase().startsWith('vico') && !p.toLowerCase().startsWith('corso') && !p.toLowerCase().startsWith('traversa'));
  if (filtered.length > 0) return filtered[filtered.length - 1];
  return parts.length > 0 ? parts[parts.length - 1] : 'Napoli';
}

function cleanPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('39') && digits.length > 10) return digits;
  if (digits.startsWith('3') && digits.length === 10) return `39${digits}`;
  return digits;
}

const strings = parseSharedStrings();
const rows = parseSheet('sheet1.xml', strings);

const leads = rows.slice(1).map((r, index) => {
  const rawPhone = r.cells.A || '';
  const inserzionista = (r.cells.C || '').trim();
  const isPrivate = inserzionista.toLowerCase().includes('privato');
  const name = inserzionista.replace(/^Privato\s*-\s*/i, '').trim() || 'Proprietario';
  const price = (r.cells.D || '').trim();
  const rawZone = (r.cells.F || '').trim();
  const title = (r.cells.E || '').trim();
  const numListings = parseInt(r.cells.H) || 1;
  const phone = cleanPhone(rawPhone);

  return {
    id: `lead-${index + 1}`,
    name,
    rawPhone,
    phone,
    isPrivate,
    price,
    zone: cleanZone(rawZone),
    fullZone: rawZone,
    title,
    numListings
  };
}).filter(l => l.phone.length >= 10 && l.isPrivate);

// Ordina: prima chi ha più annunci (es. 5, 4, 3, 2 stanze)
leads.sort((a, b) => b.numListings - a.numListings);

const outDir = path.join(__dirname, '..', 'whatsapp_outreach');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'leads.json');
fs.writeFileSync(outFile, JSON.stringify(leads, null, 2), 'utf8');

console.log(`Successfully generated ${leads.length} qualified leads in ${outFile}`);
console.log('Top 5 prioritari:');
leads.slice(0, 5).forEach((l, i) => {
  console.log(`${i + 1}. ${l.name} (${l.phone}) - ${l.numListings} stanze - Zona: ${l.zone} - Prezzo: ${l.price}`);
});
