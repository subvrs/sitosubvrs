import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

const CLOUD_NAME = 'dvjxx6syx';

function getPublicId(url) {
  const match = url.match(/cloudinary\.com\/[^/]+\/image\/upload\/(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { photo_url, event_id } = req.body;
  if (!photo_url || !event_id) return res.status(400).json({ error: 'Parametri mancanti' });

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Update Supabase (remove from photos and featured_photos)
  const { data: eventData } = await supabase
    .from('events')
    .select('photos, featured_photos')
    .eq('id', event_id)
    .single();

  const newPhotos = (eventData?.photos || []).filter(p => p !== photo_url);
  const newFeatured = (eventData?.featured_photos || []).filter(p => p !== photo_url);
  await supabase.from('events')
    .update({ photos: newPhotos, featured_photos: newFeatured })
    .eq('id', event_id);

  // Delete from Cloudinary if credentials available
  if (apiKey && apiSecret) {
    const publicId = getPublicId(photo_url);
    if (publicId) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHash('sha1')
        .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

      const body = new URLSearchParams();
      body.append('public_id', publicId);
      body.append('timestamp', String(timestamp));
      body.append('api_key', apiKey);
      body.append('signature', signature);

      await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
        method: 'POST',
        body,
      });
    }
  }

  res.json({ success: true });
}
