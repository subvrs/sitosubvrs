import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, otp, photo_url } = req.body;
  if (!email || !otp || !photo_url) return res.status(400).json({ error: 'Missing fields' });

  // Find matching OTP
  const { data, error } = await supabase
    .from('downloads')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .eq('photo_url', photo_url)
    .eq('verified', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(400).json({ error: 'Codice non valido o scaduto.' });
  }

  // Mark as verified
  await supabase.from('downloads').update({ verified: true }).eq('id', data.id);

  return res.status(200).json({ success: true, photo_url: data.photo_url });
}
