import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, photo_url, event_id } = req.body;
  if (!email || !photo_url) return res.status(400).json({ error: 'Missing fields' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to Supabase
  const { error } = await supabase.from('downloads').insert([{
    email,
    photo_url,
    event_id,
    otp,
    verified: false,
  }]);

  if (error) return res.status(500).json({ error: error.message });

  // Send email via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer re_KPFHvE9p_2739dSDR1UMGcMFjj6ozQW6K`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SUBVRS <noreply@subvrs.it>',
      to: email,
      subject: 'Il tuo codice per scaricare la foto — SUBVRS',
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; background: #0a0908; color: #f0ece4; padding: 48px 40px;">
          <div style="font-size: 20px; font-weight: 900; letter-spacing: 0.05em; margin-bottom: 32px;">SUBVRS</div>
          <p style="font-size: 16px; color: #9e9890; margin-bottom: 24px;">Usa questo codice per scaricare la foto:</p>
          <div style="font-size: 48px; font-weight: 900; letter-spacing: 0.15em; color: #e8471a; margin-bottom: 24px;">${otp}</div>
          <p style="font-size: 13px; color: #9e9890;">Il codice scade tra 10 minuti.</p>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.json();
    return res.status(500).json({ error: err.message || 'Email error' });
  }

  return res.status(200).json({ success: true });
}
