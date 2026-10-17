const fs = require('fs');
const path = require('path');
const readline = require('readline');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SESSION_DIR = path.join(__dirname, '..', '.whatsapp_session');
const LEADS_FILE = path.join(__dirname, '..', 'whatsapp_outreach', 'leads.json');
const PROGRESS_FILE = path.join(__dirname, '..', 'whatsapp_outreach', 'progress.json');
const CSV_FILE = path.join(__dirname, '..', 'whatsapp_outreach', 'storico_invii.csv');
const DEMO_URL = 'https://gestionale-affitti-seven.vercel.app/?licenza=DOMUS-DEMO';

// LIMITE MASSIMO GIORNALIERO PER EVITARE BAN (Meta sorveglia gli account ripristinati)
const DAILY_LIMIT = 10;

// Helper per scrivere/aggiornare il log CSV per Excel
function appendToCsv(row) {
  const fileExists = fs.existsSync(CSV_FILE);
  if (!fileExists) {
    const header = 'Data e Ora;Telefono;Nome;Zona;Stanze;Prezzo;Stato;Anteprima Messaggio\n';
    fs.writeFileSync(CSV_FILE, header, 'utf8');
  }
  const cleanPreview = (row.preview || '').replace(/[\r\n;]/g, ' ').slice(0, 100);
  const line = `${row.date};+${row.phone};"${row.name}";"${row.zone}";${row.listings};"${row.price}";${row.status};"${cleanPreview}"\n`;
  fs.appendFileSync(CSV_FILE, line, 'utf8');
}

// Helper per chiedere input da terminale
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

// Pausa con conto alla rovescia a video
async function sleepWithCountdown(seconds) {
  for (let s = seconds; s > 0; s--) {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    const timeStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    process.stdout.write(`\r🛡️ Pausa di sicurezza anti-ban: ${timeStr} rimanenti...   `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write(`\r✅ Pausa completata. Proseguo con il prossimo contatto...           \n`);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pulizia del nome: estrae solo il vero nome proprio ed evita maiuscole sgraziate
// es. "GIUSEPPE" -> "Giuseppe", "Luigi Nappi" -> "Luigi"
function cleanLeadName(rawName) {
  if (!rawName) return '';
  const cleaned = rawName.trim().replace(/[^a-zA-ZàèéìòùÀÈÉÌÒÙ\s]/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// FILTRO DI QUALITÀ ANTI-SEGNALAZIONE:
// Salta attività commerciali, svapo, agenzie, B&B o case vacanze che segnalano spam
function checkLeadQuality(lead) {
  const textToCheck = `${lead.name || ''} ${lead.title || ''} ${lead.zone || ''}`.toLowerCase();
  const blacklistedKeywords = [
    'svapo', 'vape', 'negozio', 'store', 'shop', 'agenzia', 'immobiliare',
    'holiday', 'home', 'b&b', 'bed and breakfast', 'residence', 'hotel',
    'rooms', 'suite', 'relais', 'affittacamere', 'grazie', 'wathsapp', 'whatsapp',
    'contatto', 'srl', 'snc', 'sas', 'spa', 'servizi', 'realty', 'studio'
  ];

  for (const kw of blacklistedKeywords) {
    if (textToCheck.includes(kw)) {
      return { valid: false, reason: `Struttura ricettiva/commerciale (${kw})` };
    }
  }

  const cleanName = cleanLeadName(lead.name);
  if (!cleanName || cleanName.length < 2) {
    return { valid: false, reason: 'Nome non valido o assente' };
  }

  return { valid: true, cleanName };
}

// Generatore Spintax: NESSUN link diretto, tono amichevole, nome pulito
function generateMessage(lead, cleanName) {
  const greetings = ['Ciao', 'Buongiorno', 'Salve'];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const disclaimers = [
    'ti premetto subito che non sto cercando una stanza per me!',
    'ti anticipo subito che non cerco alloggio per me!',
    'ti scrivo subito per tranquillizzarti che non cerco una camera per me!'
  ];
  const disclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];

  const intros = [
    `Sono uno sviluppatore qui a Napoli e ho creato un gestionale semplicissimo per smartphone per chi affitta stanze a studenti:`,
    `Sono uno sviluppatore di Napoli e ho realizzato una schermata per cellulare pensata proprio per chi fitta stanze a studenti:`
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  const closings = [
    `Se ti fa piacere dare un'occhiata a una demo veloce da cellulare fammi sapere, ti giro volentieri il link!`,
    `Se ti andrebbe di provarlo senza impegno per le tue stanze fammi sapere, ti invio volentieri il link di prova!`,
    `Se ti incuriosisce dare un'occhiata a una schermata di test fammi un cenno, ti mando subito il link!`
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return `${greeting} ${cleanName}, ${disclaimer}\n\n${intro}\n- vedi con 1 click chi ha pagato l'affitto del mese\n- dividi in automatico le bollette (luce, gas, internet) tra i ragazzi\n\n${closing}\n\n- Emanuele (Domus Rent)`;
}

// Carica stato avanzamento
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {
      return { sent: {}, failed: {}, skipped: {} };
    }
  }
  return { sent: {}, failed: {}, skipped: {} };
}

function saveProgress(progress) {
  if (!progress.skipped) progress.skipped = {};
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function runOutreach() {
  console.log('\n==================================================================');
  console.log('       DOMUS RENT - WHATSAPP OUTREACH (PROTEZIONE ANTI-BAN)       ');
  console.log('==================================================================\n');

  if (!fs.existsSync(LEADS_FILE)) {
    console.error(`Errore: File leads non trovato in ${LEADS_FILE}.`);
    return;
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  const progress = loadProgress();

  // 1. VERIFICA RIGIDA LIMITE GIORNALIERO
  const todayStr = new Date().toISOString().slice(0, 10);
  const sentToday = Object.values(progress.sent).filter(item => item.date && item.date.startsWith(todayStr)).length;

  if (sentToday >= DAILY_LIMIT) {
    console.log('🛑 ==============================================================');
    console.log('            BLOCCO DI SICUREZZA ANTI-BAN ATTIVO');
    console.log('==================================================================');
    console.log(`⚠️ Hai già inviato ${sentToday} messaggi oggi (${todayStr}).`);
    console.log(`🛡️ Per proteggere il tuo account WhatsApp da blocchi Meta,`);
    console.log(`   il limite massimo consigliato è di ${DAILY_LIMIT} contatti al giorno.`);
    console.log(`👉 Il prossimo invio sarà consentito domani mattina.`);
    console.log('==================================================================\n');
    return;
  }

  const allowedRemainingToday = DAILY_LIMIT - sentToday;

  const totalLeads = leads.length;
  const alreadySent = Object.keys(progress.sent).length;
  const remaining = leads.filter(l => !progress.sent[l.phone] && !progress.failed[l.phone] && !(progress.skipped && progress.skipped[l.phone]));

  console.log(`📊 STATO CAMPAGNA:`);
  console.log(`   - Totale proprietari qualificati: ${totalLeads}`);
  console.log(`   - Già contattati finora:          ${alreadySent}`);
  console.log(`   - Inviati oggi (${todayStr}):      ${sentToday} / ${DAILY_LIMIT}`);
  console.log(`   - Limite massimo rimasto oggi:    ${allowedRemainingToday} messaggi`);
  console.log(`   - Contatti ancora da processare:  ${remaining.length}\n`);

  if (remaining.length === 0) {
    console.log('🎉 Tutti i contatti sono stati processati!');
    return;
  }

  // Chiedi quantità rispettando il tetto giornaliero
  const cliArg = process.argv[2] ? parseInt(process.argv[2]) : null;
  let batchSize = Math.min(allowedRemainingToday, 8);

  if (cliArg && !isNaN(cliArg)) {
    batchSize = Math.min(allowedRemainingToday, Math.max(1, cliArg));
    console.log(`👉 Quantità impostata da comando: ${batchSize} messaggi.`);
  } else if (process.stdin.isTTY) {
    const batchInput = await askQuestion(`👉 Quanti messaggi vuoi inviare adesso? (Consigliati: ${batchSize}, max consentiti oggi: ${allowedRemainingToday}): `);
    const parsed = parseInt(batchInput);
    if (!isNaN(parsed) && parsed > 0) {
      batchSize = Math.min(allowedRemainingToday, parsed);
    }
  }

  console.log(`\n🚀 Avvio sessione per ${batchSize} proprietari con intervalli anti-ban lunghi (2-4 min)...\n`);

  // Assicura directory sessione
  fs.mkdirSync(SESSION_DIR, { recursive: true });

  console.log('🌐 Avvio browser con profilo protetto e mascheramento automazione...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    userDataDir: SESSION_DIR,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--lang=it-IT,it'
    ],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  // Maschera webdriver per evitare il fingerprinting anti-bot di Meta
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'languages', { get: () => ['it-IT', 'it', 'en-US', 'en'] });
  });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0');

  console.log('📲 Apertura di WhatsApp Web in corso...');
  await page.goto('https://web.whatsapp.com', { waitUntil: 'load', timeout: 60000 });

  try {
    await page.waitForSelector('#pane-side, div[contenteditable="true"], header', { timeout: 120000 });
    console.log('✅ WhatsApp Web collegato con successo e pronto!\n');
  } catch {
    console.error('❌ Timeout attesa login WhatsApp. Riprova rilanciando lo script.');
    await browser.close();
    return;
  }

  let sentInThisSession = 0;
  let leadIndex = 0;

  while (sentInThisSession < batchSize && leadIndex < remaining.length) {
    const lead = remaining[leadIndex];
    leadIndex++;

    // Verifica qualità del lead
    const quality = checkLeadQuality(lead);
    if (!quality.valid) {
      console.log(`⏩ [SKIP SICUREZZA] ${lead.name} (+${lead.phone}) scartato: ${quality.reason}`);
      if (!progress.skipped) progress.skipped = {};
      progress.skipped[lead.phone] = {
        name: lead.name,
        reason: quality.reason,
        date: new Date().toISOString()
      };
      saveProgress(progress);
      continue;
    }

    const cleanName = quality.cleanName;
    const msg = generateMessage(lead, cleanName);
    const currentNumber = sentInThisSession + 1;

    console.log(`\n------------------------------------------------------------------`);
    console.log(`[${currentNumber}/${batchSize}] 👤 Contatto Privato: ${cleanName} (Originale: ${lead.name})`);
    console.log(`   📞 Telefono: +${lead.phone} | Zona: ${lead.zone} | Stanze: ${lead.numListings}`);
    console.log(`------------------------------------------------------------------`);

    try {
      const chatUrl = `https://web.whatsapp.com/send?phone=${lead.phone}&text=${encodeURIComponent(msg)}`;
      await page.goto(chatUrl, { waitUntil: 'load', timeout: 45000 });

      // Attesa realistica caricamento chat
      await new Promise(r => setTimeout(r, getRandomInt(4000, 6000)));

      // Controllo se il numero non è registrato su WhatsApp
      const isInvalidNumber = await page.evaluate(() => {
        const modal = document.querySelector('div[data-animate-modal-popup="true"]');
        if (modal) {
          const txt = modal.innerText || '';
          return txt.toLowerCase().includes('non valido') || txt.toLowerCase().includes('invalid');
        }
        return false;
      });

      if (isInvalidNumber) {
        console.log(`⚠️ Numero +${lead.phone} non registrato su WhatsApp. Salto.`);
        progress.failed[lead.phone] = {
          name: lead.name,
          reason: 'invalid_number_on_whatsapp',
          date: new Date().toISOString()
        };
        saveProgress(progress);
        appendToCsv({
          date: new Date().toLocaleString('it-IT'),
          phone: lead.phone,
          name: lead.name,
          zone: lead.zone,
          listings: lead.numListings,
          price: lead.price,
          status: 'NON_SU_WHATSAPP',
          preview: 'Numero non registrato su WhatsApp'
        });
        continue;
      }

      // Attende il box di testo
      const chatBoxSelector = 'footer div[contenteditable="true"]';
      await page.waitForSelector(chatBoxSelector, { timeout: 35000 });

      // Movimento casuale del mouse (simula presenza umana)
      await page.mouse.move(getRandomInt(250, 600), getRandomInt(350, 650));

      // Pausa di rilettura naturale prima dell'invio (4 - 7 secondi)
      const reviewPause = getRandomInt(4000, 7000);
      await new Promise(r => setTimeout(r, reviewPause));

      // Click sul pulsante di invio
      const sendButtonSelector = 'button span[data-icon="send"], button[aria-label="Invia"], button[aria-label="Send"], span[data-icon="send"]';
      const sendBtn = await page.$(sendButtonSelector);
      if (sendBtn) {
        await sendBtn.click();
      } else {
        await page.focus(chatBoxSelector);
        await page.keyboard.press('Enter');
      }

      // Attesa conferma invio
      await new Promise(r => setTimeout(r, 4000));

      progress.sent[lead.phone] = {
        name: lead.name,
        cleanName: cleanName,
        zone: lead.zone,
        date: new Date().toISOString(),
        messagePreview: msg.slice(0, 80) + '...'
      };
      saveProgress(progress);
      appendToCsv({
        date: new Date().toLocaleString('it-IT'),
        phone: lead.phone,
        name: lead.name,
        zone: lead.zone,
        listings: lead.numListings,
        price: lead.price,
        status: 'INVIATO',
        preview: msg
      });
      sentInThisSession++;

      console.log(`✅ Messaggio inviato con successo a ${cleanName}!`);

      // Se non è l'ultimo del batch, pausa lunga di sicurezza (2 - 4 minuti)
      if (sentInThisSession < batchSize) {
        const waitTime = getRandomInt(120, 240); // 120-240s = 2-4 minuti
        console.log(`🛡️ Attivazione intervallo di sicurezza anti-ban...`);
        await sleepWithCountdown(waitTime);
      }
    } catch (err) {
      console.error(`❌ Errore durante l'invio a ${lead.name} (+${lead.phone}):`, err.message);
      progress.failed[lead.phone] = {
        name: lead.name,
        error: err.message,
        date: new Date().toISOString()
      };
      saveProgress(progress);
      appendToCsv({
        date: new Date().toLocaleString('it-IT'),
        phone: lead.phone,
        name: lead.name,
        zone: lead.zone,
        listings: lead.numListings,
        price: lead.price,
        status: 'ERRORE',
        preview: err.message
      });
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n==================================================================');
  console.log(`🎉 SESSIONE TERMINATA!`);
  console.log(`   - Messaggi inviati con successo adesso: ${sentInThisSession}`);
  console.log(`   - Totale inviati oggi: ${sentToday + sentInThisSession} / ${DAILY_LIMIT}`);
  console.log(`   - Totale complessivo campagna: ${Object.keys(progress.sent).length} su ${totalLeads}`);
  console.log('==================================================================\n');
}

runOutreach().catch(console.error);

