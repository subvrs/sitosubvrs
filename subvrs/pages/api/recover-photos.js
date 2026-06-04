import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

const CLOUD_NAME = 'dvjxx6syx';

async function listCloudinaryResources(apiKey, apiSecret, prefix, nextCursor) {
  const timestamp = Math.floor(Date.now() / 1000);

  // Parametri da firmare (solo quelli che vanno nella firma)
  const toSign = { max_results: 500, prefix, timestamp };
  if (nextCursor) toSign.next_cursor = nextCursor;

  const sigStr = Object.keys(toSign).sort().map(k => `${k}=${toSign[k]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`);
  url.searchParams.set('prefix', prefix);
  url.searchParams.set('max_results', '500');
  url.searchParams.set('timestamp', String(timestamp));
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('signature', signature);
  if (nextCursor) url.searchParams.set('next_cursor', nextCursor);

  const res = await fetch(url.toString());
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary credentials mancanti' });
  }

  // 1. Recupera tutti gli asset da Cloudinary nella cartella subvrs/
  const allResources = [];
  let cursor = undefined;

  do {
    const data = await listCloudinaryResources(apiKey, apiSecret, 'subvrs/', cursor);
    if (data.error) return res.status(500).json({ error: data.error.message });
    allResources.push(...(data.resources || []));
    cursor = data.next_cursor;
  } while (cursor);

  if (allResources.length === 0) {
    return res.json({ success: false, message: 'Nessuna risorsa trovata su Cloudinary — credenziali errate o cartella vuota.' });
  }

  // 2. Raggruppa per event_id (subvrs/{event_id}/filename)
  const byEvent = {};
  for (const r of allResources) {
    // public_id = subvrs/{event_id}/filename
    const parts = r.public_id.split('/');
    if (parts.length < 3) continue; // non nel formato atteso
    const eventId = parts[1];
    if (!byEvent[eventId]) byEvent[eventId] = [];
    byEvent[eventId].push(r.secure_url);
  }

  // 3. Per ogni evento nel DB, reintegra le foto mancanti
  const { data: events } = await supabase.from('events').select('id, photos');

  let restoredEvents = 0;
  let restoredPhotos = 0;
  const report = [];

  for (const ev of events || []) {
    const cloudPhotos = byEvent[ev.id] || [];
    const existing = new Set(ev.photos || []);

    // Foto su Cloudinary ma non nel DB
    const missing = cloudPhotos.filter(url => !existing.has(url));

    if (missing.length > 0) {
      const merged = [...(ev.photos || []), ...missing];
      await supabase.from('events').update({ photos: merged }).eq('id', ev.id);
      restoredEvents++;
      restoredPhotos += missing.length;
      report.push({ event_id: ev.id, restored: missing.length });
    }
  }

  res.json({
    success: true,
    cloudinary_total: allResources.length,
    events_with_photos: Object.keys(byEvent).length,
    restored_events: restoredEvents,
    restored_photos: restoredPhotos,
    report,
  });
}
