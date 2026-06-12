// Verifica la password admin lato server: non viene mai inviata al browser.
// La password vive solo nella env ADMIN_PASSWORD (Vercel), mai nel codice.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD;

  if (expected && password === expected) {
    return res.status(200).json({ success: true });
  }
  return res.status(401).json({ error: 'Password errata' });
}
