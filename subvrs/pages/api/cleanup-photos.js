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

  const { data: events, error } = await supabase
    .from('events')
    .select('id, photos, featured_photos');

  if (error) return res.status(500).json({ error: error.message });

  // Ottieni tutti i public_id da Cloudinary
  let cloudinaryIds = null;
  if (apiKey && apiSecret) {
    const allIds = new Set();
    let cursor = undefined;

    do {
      const data = await fetchCloudinaryPage(apiKey, apiSecret, 'subvrs/', cursor);
      if (data.error) {
        return res.status(500).json({ error: `Cloudinary: ${data.error.message}` });
      }
      (data.resources || []).forEach(r => allIds.add(r.public_id));
      cursor = data.next_cursor;
    } while (cursor);

    // Sicurezza: se Cloudinary torna 0 ma il DB ha foto → annulla
    const totalDbPhotos = (events || []).reduce((n, e) => n + (e.photos || []).length, 0);
    if (allIds.size === 0 && totalDbPhotos > 0) {
      return res.status(500).json({
        error: 'Cloudinary ha restituito 0 risorse ma il DB ne ha. Pulizia annullata per sicurezza.',
      });
    }

    cloudinaryIds = allIds;
  }

  const getPublicId = (url) => {
    const match = url.match(/cloudinary\.com\/[^/]+\/image\/upload\/(.+)\.[a-z0-9]+$/i);
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
