const fs = require('fs');
const leads = JSON.parse(fs.readFileSync('whatsapp_outreach/leads.json', 'utf8'));
const DEMO_URL = 'https://gestionale-affitti-seven.vercel.app/?licenza=DOMUS-DEMO';

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

console.log('=== ESEMPIO 1 (Antonio - Poggioreale, 5 stanze) ===\n');
console.log(generateMessage(leads[0]));

console.log('\n=======================================================\n');
console.log('=== ESEMPIO 2 (Carlo - Chiaia-Mergellina, 5 stanze) ===\n');
console.log(generateMessage(leads[1]));

console.log('\n=======================================================\n');
const mariano = leads.find(l => l.name.toLowerCase().includes('mariano')) || leads[10];
console.log(`=== ESEMPIO 3 (${mariano.name} - ${mariano.zone}, singola stanza) ===\n`);
console.log(generateMessage(mariano));
