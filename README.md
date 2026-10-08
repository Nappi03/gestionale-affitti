# DomusRent - Gestionale Personale Locazione 2 Camere

Webapp essenziale, veloce e diretta sviluppata in **TypeScript**, **React 19** e **Vite 8**, progettata ad uso esclusivo del proprietario per gestire la locazione delle 2 camere con sincronizzazione cloud in tempo reale su **Supabase**.

---

## 🎯 Le 4 Funzionalità Essenziali

Niente schermate superflue, niente fronzoli o istruzioni per gli ospiti: solo il controllo totale della situazione economica e degli inquilini.

### 1. 💳 Chi ha Pagato? (Mese per Mese)
- Visualizzazione immediata dello stato del canone per **Camera 1** e **Camera 2**:
  - Badge verde **PAGATO** con data di accredito e metodo.
  - Badge rosso **DA PAGARE** se il bonifico non è ancora pervenuto.
- Selettore del mese (vai avanti e indietro nei mesi o torna a quello corrente).
- Calcolo automatico in tempo reale: **Canoni Attesi** vs **Già Incassati** vs **Ancora da Riscuotere**.
- Pulsante rapido con 1 clic: **"+ Registra Pagamento Ricevuto"**.
- Pulsante WhatsApp con testo precompilato per inviare il sollecito bonifico o la conferma di accredito.

### 2. 👥 I Ragazzi (Anagrafica & Camere)
- Scheda dettagliata delle 2 camere con l'inquilino attualmente assegnato:
  - Nome e cognome, telefono, email.
  - Canone mensile concordato (€) e cauzione versata (€).
  - Date di inizio e fine permanenza.
  - Note personali (es. corso di laurea, genitore garante per il canone).
- **Aggiungi Ragazzo**: assegna un nuovo inquilino a una camera libera.
- **Togli Ragazzo (Libera Stanza)**: termina la permanenza con 1 clic, libera la stanza e sposta automaticamente il ragazzo nell'**Archivio Storico Ex-Inquilini**.
- **Archivio Ex-Inquilini**: memoria storica permanente di tutti i ragazzi che hanno alloggiato in passato.

### 3. 📑 Archivio Storico Pagamenti Negli Anni
- La memoria storica permanente di ogni singolo bonifico o pagamento incassato nel tempo.
- **Filtro per Anno Fiscale** (es. *2026*, *2027*, *2025* o *Tutti gli Anni*).
- **Filtro per Camera** (Tutte, Camera 1, Camera 2).
- **Resoconto Fiscale Annuale**:
  - Totale incassato nell'anno (fondamentale per dichiarazione redditi / commercialista).
  - Ripartizione incassi Camera 1 vs Camera 2.
  - Conteggio delle mensilità saldate.
- Pulsante per **stampare o salvare in PDF il resoconto annuale**.

### 4. ⚡ Bollette & Spese Casa
- Registro semplice delle uscite per la gestione dell'appartamento (*Luce/Enel*, *Gas*, *Internet*, *Condominio*, *TARI*, *Manutenzioni*).
- Calcolo delle spese totali per anno.

---

## 🗄️ Database Supabase

Tutti i ragazzi, le stanze, i pagamenti mensili e le spese vengono sincronizzati istantaneamente con il tuo database cloud Supabase (`retpmhdtbsbqnflshogr.supabase.co`).

---

## 💻 Come Avviare l'Applicazione

```powershell
# Avvia il dev server
npm run dev
```

Apri il browser su: **[http://localhost:5173/](http://localhost:5173/)**
