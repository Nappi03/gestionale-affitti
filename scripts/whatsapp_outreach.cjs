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
    process.stdout.write(`\r⏳ Pausa di sicurezza anti-ban: ${s}s rimanenti...  `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write(`\r✅ Pausa completata. Proseguo con il prossimo contatto...   \n`);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generatore Spintax ultra-conciso: disinnesca il malinteso ed evita il blocco spam
function generateMessage(lead) {
  const greetings = ['Ciao', 'Buongiorno', 'Salve'];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const disclaimers = [
    'ti premetto subito che non sto cercando una stanza per me!',
    'ti anticipo subito che non cerco stanze in affitto per me!',
    'ti premetto subito che non cerco alloggio per me!'
  ];
  const disclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];

  const intros = [
    `Sono uno sviluppatore di Napoli e ho creato un gestionale semplicissimo per smartphone pensato per chi fitta stanze a studenti:`,
    `Sono uno sviluppatore di Napoli e ho realizzato una schermata per cellulare pensata per chi affitta stanze a studenti:`
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  const closings = [
    `Se vuoi provarlo per le tue stanze fammi sapere, ti attivo volentieri una prova gratuita senza alcun vincolo.`,
    `Se ti fa comodo provarlo con le tue stanze fammi sapere, ti attivo una prova gratuita senza alcun vincolo.`,
    `Se ti fa piacere provarlo per le tue stanze fammi sapere, ti attivo volentieri una prova gratuita.`
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return `${greeting} ${lead.name}, ${disclaimer}\n\n${intro}\n- vedi con 1 click chi ha pagato l'affitto del mese\n- dividi in automatico le bollette (luce, gas, internet) tra i ragazzi\n\nTi lascio una demo di prova da guardare dal telefono:\n👉 ${DEMO_URL}\n\n${closing}\n\n- Emanuele (Domus Rent)`;
}

// Carica stato avanzamento
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {
      return { sent: {}, failed: {} };
    }
  }
  return { sent: {}, failed: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function runOutreach() {
  console.log('\n======================================================');
  console.log('       DOMUS RENT - WHATSAPP OUTREACH AUTOMATICO       ');
  console.log('======================================================\n');

  if (!fs.existsSync(LEADS_FILE)) {
    console.error(`Errore: File leads non trovato in ${LEADS_FILE}. Esegui prima extract_leads.cjs!`);
    return;
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  const progress = loadProgress();

  const totalLeads = leads.length;
  const alreadySent = Object.keys(progress.sent).length;
  const remaining = leads.filter(l => !progress.sent[l.phone] && !progress.failed[l.phone]);

  console.log(`📊 STATO CAMPAGNA:`);
  console.log(`   - Totale proprietari qualificati: ${totalLeads}`);
  console.log(`   - Già contattati in precedenza:    ${alreadySent}`);
  console.log(`   - Da contattare rimasti:          ${remaining.length}`);
  console.log(`   - Link Demo inserito:             ${DEMO_URL}\n`);

  if (remaining.length === 0) {
    console.log('🎉 Complimenti! Tutti i contatti sono stati contattati.');
    return;
  }

  const cliArg = process.argv[2] ? parseInt(process.argv[2]) : null;
  let batchSize = 15;
  if (cliArg && !isNaN(cliArg)) {
    batchSize = Math.max(1, Math.min(30, cliArg));
    console.log(`👉 Quantità impostata da comando: ${batchSize} messaggi.`);
  } else if (process.stdin.isTTY) {
    const batchInput = await askQuestion('👉 Quanti messaggi vuoi inviare in questa sessione? (Consigliati: 15, max: 25): ');
    batchSize = Math.max(1, Math.min(30, parseInt(batchInput) || 15));
  } else {
    console.log(`👉 Modalità rapida: invio default di 15 messaggi.`);
    batchSize = 15;
  }
  console.log(`\n🚀 Avvio sessione per ${batchSize} proprietari con intervalli di sicurezza anti-ban...\n`);

  // Assicura directory sessione
  fs.mkdirSync(SESSION_DIR, { recursive: true });

  console.log('🌐 Avvio di Microsoft Edge con WhatsApp Web...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false, // Finestra visibile sul desktop
    userDataDir: SESSION_DIR,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0');

  console.log('📲 Apertura di WhatsApp Web in corso...');
  await page.goto('https://web.whatsapp.com', { waitUntil: 'load', timeout: 60000 });

  console.log('\n------------------------------------------------------');
  console.log('⚠️ ATTENZIONE: Se non l\'hai già fatto, inquadra il QR Code');
  console.log('   con WhatsApp Business dal tuo secondo smartphone.');
  console.log('   (Lo farai solo la prima volta, poi rimarrà collegato).');
  console.log('------------------------------------------------------\n');

  // Attende che l'interfaccia principale di WhatsApp sia caricata
  try {
    await page.waitForSelector('#pane-side, div[contenteditable="true"], header', { timeout: 120000 });
    console.log('✅ WhatsApp Web collegato con successo e pronto!\n');
  } catch {
    console.error('❌ Timeout attesa login WhatsApp. Riprova rilanciando lo script.');
    await browser.close();
    return;
  }

  const batch = remaining.slice(0, batchSize);
  let successCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];
    const currentIndex = i + 1;
    const msg = generateMessage(lead);

    console.log(`\n------------------------------------------------------`);
    console.log(`[${currentIndex}/${batchSize}] 👤 Contatto: ${lead.name} (${lead.numListings} stanze)`);
    console.log(`   📞 Telefono: +${lead.phone} | Zona: ${lead.zone} | Prezzo: ${lead.price}`);
    console.log(`------------------------------------------------------`);

    try {
      const chatUrl = `https://web.whatsapp.com/send?phone=${lead.phone}&text=${encodeURIComponent(msg)}`;
      await page.goto(chatUrl, { waitUntil: 'load', timeout: 45000 });

      // Attesa breve caricamento chat
      await new Promise(r => setTimeout(r, 4000));

      // Controllo se il numero non è registrato su WhatsApp (modal di errore)
      const isInvalidNumber = await page.evaluate(() => {
        const modal = document.querySelector('div[data-animate-modal-popup="true"]');
        if (modal) {
          const txt = modal.innerText || '';
          return txt.toLowerCase().includes('non valido') || txt.toLowerCase().includes('invalid');
        }
        return false;
      });

      if (isInvalidNumber) {
        console.log(`⚠️ Numero +${lead.phone} non registrato su WhatsApp o non valido. Salto.`);
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

      // Attende il campo di testo o il pulsante invio
      const chatBoxSelector = 'footer div[contenteditable="true"]';
      await page.waitForSelector(chatBoxSelector, { timeout: 35000 });

      // Pausa umana prima di cliccare invio (2-4 secondi)
      await new Promise(r => setTimeout(r, getRandomInt(2000, 3500)));

      // Prova prima a cliccare il pulsante invio o premi Enter nel box
      const sendButtonSelector = 'button span[data-icon="send"], button[aria-label="Invia"], button[aria-label="Send"], span[data-icon="send"]';
      const sendBtn = await page.$(sendButtonSelector);
      if (sendBtn) {
        await sendBtn.click();
      } else {
        await page.focus(chatBoxSelector);
        await page.keyboard.press('Enter');
      }

      // Attendi conferma invio
      await new Promise(r => setTimeout(r, 3000));

      progress.sent[lead.phone] = {
        name: lead.name,
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
      successCount++;

      console.log(`✅ Inviato con successo a ${lead.name}!`);

      // Se non è l'ultimo del batch, facciamo la pausa di sicurezza anti-ban
      if (i < batch.length - 1) {
        const waitTime = getRandomInt(45, 80); // Pausa tra 45 e 80 secondi
        console.log(`🛡️ Attivazione pausa umana di sicurezza...`);
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

  console.log('\n======================================================');
  console.log(`🎉 SESSIONE TERMINATA CON SUCCESSO!`);
  console.log(`   - Messaggi inviati con successo in questa sessione: ${successCount}`);
  console.log(`   - Totale complessivo inviati finora: ${Object.keys(progress.sent).length} su ${totalLeads}`);
  console.log('======================================================\n');
  console.log('Puoi lasciare la finestra aperta per rispondere se qualcuno ti scrive, oppure chiudere.');
}

runOutreach().catch(console.error);
