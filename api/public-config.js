// Expose only a recognized public Supabase browser key. Fail closed on misconfiguration.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
  // Modern publishable keys and legacy anonymous JWTs are supported.
  // Decoding a JWT here is only a disclosure guard, not authentication.
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publicKey && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
    try { publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')).role === 'anon'; } catch {}
  }
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) && publicKey;
  return res.status(200).json({
    supabaseUrl: configured ? url : '',
    supabasePublishableKey: configured ? key : ''
  });
}
