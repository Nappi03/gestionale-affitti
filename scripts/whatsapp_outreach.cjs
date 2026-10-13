const fs = require('fs');
const path = require('path');
const readline = require('readline');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SESSION_DIR = path.join(__dirname, '..', '.whatsapp_session');
const LEADS_FILE = path.join(__dirname, '..', 'whatsapp_outreach', 'leads.json');
const PROGRESS_FILE = path.join(__dirname, '..', 'whatsapp_outreach', 'progress.json');
const DEMO_URL = 'https://gestionale-affitti-seven.vercel.app/?licenza=DOMUS-DEMO';

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

// Generatore Spintax: varia il testo ad ogni messaggio per evitare il blocco per spam
function generateMessage(lead) {
  const greetings = ['Ciao', 'Buongiorno', 'Salve'];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const openers = [
    `ti disturbo solo un minuto perché ho notato la tua stanza in affitto a ${lead.zone}.`,
    `ti scrivo brevemente riguardo al tuo annuncio per la stanza a ${lead.zone}.`,
    `ti contatto al volo perché ho visto la tua stanza in affitto a ${lead.zone}.`
  ];
  const opener = openers[Math.floor(Math.random() * openers.length)];

  let middle = '';
  if (lead.numListings > 1) {
    const multiPitches = [
      `Ho visto che gestisci diverse stanze a Napoli: so bene che a fine mese diventa sempre una faticaccia rincorrere i ragazzi per i bonifici e dividere le bollette dell'Enel o di internet.`,
      `Avendo notato che hai più stanze a Napoli, ti scrivo perché gestire più studenti significa spesso perdere un sacco di tempo a controllare chi ha saldato e rifare i conti delle bollette a mano.`
    ];
    middle = multiPitches[Math.floor(Math.random() * multiPitches.length)];
  } else {
    const singlePitches = [
      `Parlando con vari proprietari che affittano a studenti a Napoli, mi dicono che a fine mese è sempre una noia controllare chi è in ritardo con l'affitto e calcolare le quote delle bollette.`,
      `Per chi affitta a studenti è sempre una noia dover controllare le ricevute dei bonifici e dividere le bollette di luce e gas su fogli di carta o Excel.`
    ];
    middle = singlePitches[Math.floor(Math.random() * singlePitches.length)];
  }

  const solutions = [
    `Per questo abbiamo creato DomusRent: una schermata semplicissima pensata per i proprietari di Napoli. Si apre con 1 click dal cellulare (senza scaricare app e senza password) e ti fa vedere subito chi è in regola e dividere le spese in pochi secondi.`,
    `Per risolvere questo problema è nato DomusRent: un gestionale fatto apposta per chi affitta stanze. Da cellulare hai sempre sott'occhio le tue stanze, i ragazzi in regola e il calcolo automatico delle bollette senza fogli Excel.`
  ];
  const solution = solutions[Math.floor(Math.random() * solutions.length)];

  const closings = [
    `Ti lascio qui una demo gratuita di prova da guardare dal telefono:\n👉 ${DEMO_URL}\n\nSe ti fa comodo fammi un fischio qui: ti preparo il tuo accesso personale in 2 minuti per provarlo gratis!`,
    `Puoi provarlo subito senza impegno cliccando qui dal cellulare:\n👉 ${DEMO_URL}\n\nDagli un'occhiata se hai 2 minuti e fammi sapere cosa ne pensi. Buona giornata!`,
    `Ecco il link della demo da aprire direttamente dal telefono:\n👉 ${DEMO_URL}\n\nSe vuoi provarlo sulle tue stanze ti creo l'accesso gratuito in 2 minuti. A presto!`
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return `${greeting} ${lead.name}, ${opener}\n\n${middle}\n\n${solution}\n\n${closing}\n\n- Emanuele (Domus Rent)`;
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
