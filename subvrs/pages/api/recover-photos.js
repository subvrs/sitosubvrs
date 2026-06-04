import { supabase } from '../../lib/supabase';

const CLOUD_NAME = 'dvjxx6syx';

async function fetchCloudinaryPage(apiKey, apiSecret, prefix, nextCursor) {
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload`);
  url.searchParams.set('prefix', prefix);
  url.searchParams.set('max_results', '500');
  if (nextCursor) url.searchParams.set('next_cursor', nextCursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ success: false, message: 'Credenziali Cloudinary mancanti nelle env vars.' });
  }

  // 1. Recupera tutte le risorse da Cloudinary
  const allResources = [];
  let cursor = undefined;

  do {
    const data = await fetchCloudinaryPage(apiKey, apiSecret, 'subvrs/', cursor);
    if (data.error) {
      return res.status(500).json({ success: false, message: `Cloudinary error: ${data.error.message}` });
    }
    allResources.push(...(data.resources || []));
    cursor = data.next_cursor;
  } while (cursor);

  if (allResources.length === 0) {
    return res.json({ success: false, message: 'Nessuna risorsa trovata su Cloudinary nella cartella subvrs/.' });
  }

  // 2. Raggruppa per event_id (public_id = subvrs/{event_id}/filename)
  const byEvent = {};
  for (const r of allResources) {
    const parts = r.public_id.split('/');
    if (parts.length < 3) continue;
    const eventId = parts[1];
    if (!byEvent[eventId]) byEvent[eventId] = [];
    byEvent[eventId].push(r.secure_url);
  }

  // 3. Confronta con DB e reintegra le foto mancanti
  const { data: events } = await supabase.from('events').select('id, photos');

  let restoredEvents = 0;
  let restoredPhotos = 0;
  const report = [];

  for (const ev of events || []) {
    const cloudPhotos = byEvent[ev.id] || [];
    const existing = new Set(ev.photos || []);
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
    events_with_photos_on_cloud: Object.keys(byEvent).length,
    restored_events: restoredEvents,
    restored_photos: restoredPhotos,
    report,
  });
}
