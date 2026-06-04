import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

const CLOUD_NAME = 'dvjxx6syx';

async function getCloudinaryPublicIds(apiKey, apiSecret) {
  const allIds = new Set();
  let nextCursor = undefined;

  do {
    const timestamp = Math.floor(Date.now() / 1000);

    // Solo i parametri che entrano nella firma
    const toSign = { max_results: 500, prefix: 'subvrs/', timestamp };
    if (nextCursor) toSign.next_cursor = nextCursor;

    const sigStr = Object.keys(toSign).sort().map(k => `${k}=${toSign[k]}`).join('&') + apiSecret;
    const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`);
    url.searchParams.set('prefix', 'subvrs/');
    url.searchParams.set('max_results', '500');
    url.searchParams.set('timestamp', String(timestamp));
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('signature', signature);
    if (nextCursor) url.searchParams.set('next_cursor', nextCursor);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      console.error('Cloudinary error:', data.error);
      return null; // segnala errore
    }

    (data.resources || []).forEach(r => allIds.add(r.public_id));
    nextCursor = data.next_cursor;
  } while (nextCursor);

  return allIds;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const { data: events, error } = await supabase
    .from('events')
    .select('id, photos, featured_photos');

  if (error) return res.status(500).json({ error: error.message });

  // Prova a ottenere gli ID da Cloudinary
  let cloudinaryIds = null;
  if (apiKey && apiSecret) {
    cloudinaryIds = await getCloudinaryPublicIds(apiKey, apiSecret);
    // Se ritorna null (errore API) o Set vuoto con foto nel DB → non procedere
    if (cloudinaryIds !== null && cloudinaryIds.size === 0) {
      const totalPhotos = (events || []).reduce((n, e) => n + (e.photos || []).length, 0);
      if (totalPhotos > 0) {
        return res.status(500).json({
          error: 'Cloudinary ha restituito 0 risorse ma il DB ne ha. Firma API errata o credenziali sbagliate. Pulizia annullata per sicurezza.',
        });
      }
    }
    if (cloudinaryIds === null) {
      return res.status(500).json({ error: 'Errore di connessione a Cloudinary. Pulizia annullata.' });
    }
  }

  const getPublicId = (url) => {
    const match = url.match(/cloudinary\.com\/[^/]+\/image\/upload\/(?:[^/]+\/)*(.+)\.[a-z0-9]+$/i);
    return match ? match[1] : null;
  };

  const orphanedUrls = new Set();

  for (const ev of events || []) {
    const seen = new Set();
    for (const url of ev.photos || []) {
      if (seen.has(url)) { orphanedUrls.add(url); continue; }
      seen.add(url);
      if (cloudinaryIds) {
        const pid = getPublicId(url);
        if (pid && !cloudinaryIds.has(pid)) orphanedUrls.add(url);
      }
    }
  }

  let cleanedEvents = 0;
  let removedTotal = 0;

  for (const ev of events || []) {
    const cleanPhotos = (ev.photos || []).filter(u => !orphanedUrls.has(u));
    const cleanFeatured = (ev.featured_photos || []).filter(u => !orphanedUrls.has(u));
    const removed = (ev.photos || []).length - cleanPhotos.length;
    if (removed > 0) {
      await supabase.from('events')
        .update({ photos: cleanPhotos, featured_photos: cleanFeatured })
        .eq('id', ev.id);
      cleanedEvents++;
      removedTotal += removed;
    }
  }

  res.json({
    success: true,
    total_db_urls: (events || []).reduce((n, e) => n + (e.photos || []).length, 0),
    orphaned_removed: removedTotal,
    events_cleaned: cleanedEvents,
    cloudinary_checked: !!cloudinaryIds,
  });
}
