# SUBVRS Website

## Setup rapido

### 1. Installa dipendenze
```bash
npm install
```

### 2. Sviluppo locale
```bash
npm run dev
# apri http://localhost:3000
```

### 3. Deploy su Vercel
1. Vai su vercel.com → New Project
2. Importa questa cartella da GitHub
3. Deploy automatico

---

## Struttura pagine

| URL | Pagina |
|-----|--------|
| `/` | Homepage |
| `/events` | Lista eventi |
| `/events/[id]` | Singolo evento |
| `/media` | Gallery foto |
| `/upload` | Upload fotografo (password: `subvrs2026`) |
| `/admin` | Crea nuovo evento (password: `subvrsadmin2026`) |

---

## Aggiungere un evento

### Metodo 1 — Admin panel
Vai su `/admin`, compila il form, copia il JSON generato e incollalo in `data/events.json`.

### Metodo 2 — Manuale
Aggiungi un oggetto all'array in `data/events.json` con questa struttura:

```json
{
  "id": "nome-evento-2026-06",
  "name": "NOME EVENTO",
  "date": "2026-06-15",
  "time": "22:00",
  "endTime": "till late",
  "venue": "Nome Venue",
  "city": "Torino",
  "address": "Indirizzo completo",
  "genre": ["House", "Disco"],
  "description": "Descrizione della serata.",
  "happyHour": "Happy Hour fino alle 22:00",
  "entry": "Ingresso libero con accredito obbligatorio",
  "dressCode": "Smart casual",
  "ageLimit": "18+",
  "ticketLink": "https://dice.fm/...",
  "status": "upcoming",
  "flyer": "/images/nome-flyer.jpg",
  "lineup": [
    { "name": "DJ Name", "role": "DJ Set", "time": "22:00" }
  ],
  "photos": []
}
```

---

## Cloudinary (upload foto)

1. Crea account su cloudinary.com
2. Crea un upload preset chiamato `subvrs_events` (unsigned)
3. In `pages/upload.js` sostituisci `YOUR_CLOUDINARY_CLOUD_NAME` con il tuo cloud name
4. Le foto caricate appariranno nella gallery

---

## Cambiare password upload/admin

- Upload fotografo: `pages/upload.js` → `UPLOAD_PASSWORD`
- Admin panel: env var `ADMIN_PASSWORD` su Vercel (Settings → Environment Variables)

---

## Dominio custom

Su Vercel → Settings → Domains → aggiungi il tuo dominio.
