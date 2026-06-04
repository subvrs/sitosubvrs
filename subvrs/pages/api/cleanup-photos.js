import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

const CLOUD_NAME = 'dvjxx6syx';

// Recupera tutti i public_id presenti su Cloudinary nella cartella subvrs/
async function getCloudinaryPublicIds(apiKey, apiSecret) {
  const allIds = new Set();
  let nextCursor = null;

  do {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { prefix: 'subvrs/', max_results: 500, timestamp };
    if (nextCursor) params.next_cursor = nextCursor;

    const sortedKeys = Object.keys(params).sort();
    const sigStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;
    const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`);
    url.searchParams.set('prefix', 'subvrs/');
    url.searchParams.set('max_results', '500');
    url.searchParams.set('timestamp', timestamp);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('signature', signature);
    if (nextCursor) url.searchParams.set('next_cursor', nextCursor);

    const res = await fetch(url.toString());
    const data = await res.json();

    (data.resources || []).forEach(r => allIds.add(r.public_id));
    nextCursor = data.next_cursor || null;
  } while (nextCursor);

  return allIds;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Carica tutti gli eventi con le loro foto
  const { data: events, error } = await supabase
    .from('events')
    .select('id, photos, featured_photos');

  if (error) return res.status(500).json({ error: error.message });

  // Raccoglie tutti gli URL nel DB
  const allDbUrls = new Set();
  for (const ev of events || []) {
    for (const url of ev.photos || []) allDbUrls.add(url);
    for (const url of ev.featured_photos || []) allDbUrls.add(url);
  }

  let cloudinaryIds = null;
  if (apiKey && apiSecret) {
    cloudinaryIds = await getCloudinaryPublicIds(apiKey, apiSecret);
  }

  // Funzione per estrarre il public_id da un URL Cloudinary
  const getPublicId = (url) => {
    const match = url.match(/cloudinary\.com\/[^/]+\/image\/upload\/(.+)\.[a-z0-9]+$/i);
    return match ? match[1] : null;
  };

  // Trova URL orfani (nel DB ma non su Cloudinary, oppure duplicati)
  const orphanedUrls = new Set();
  const seen = new Set();

  for (const url of allDbUrls) {
    // Duplicati
    if (seen.has(url)) { orphanedUrls.add(url); continue; }
    seen.add(url);

    // Non presenti su Cloudinary
    if (cloudinaryIds) {
      const pid = getPublicId(url);
      if (pid && !cloudinaryIds.has(pid)) orphanedUrls.add(url);
    }
  }

  // Pulisce ogni evento
  let cleanedEvents = 0;
  let removedTotal = 0;

  for (const ev of events || []) {
    const cleanPhotos = (ev.photos || []).filter(u => !orphanedUrls.has(u));
    const cleanFeatured = (ev.featured_photos || []).filter(u => !orphanedUrls.has(u));

    const removedCount = (ev.photos || []).length - cleanPhotos.length;
    if (removedCount > 0) {
      await supabase.from('events')
        .update({ photos: cleanPhotos, featured_photos: cleanFeatured })
        .eq('id', ev.id);
      cleanedEvents++;
      removedTotal += removedCount;
    }
  }

  res.json({
    success: true,
    total_db_urls: allDbUrls.size,
    orphaned_removed: removedTotal,
    events_cleaned: cleanedEvents,
    cloudinary_checked: !!cloudinaryIds,
  });
}
