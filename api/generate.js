// AI generation is intentionally unavailable until server-verified authentication,
// persistent per-user quotas, and an explicit owner-approved cost policy exist.
// Do not enable paid AI by setting an environment flag alone.
// This fail-closed endpoint makes zero upstream provider requests.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(503).json({
    error: 'Paid AI generation is not available. Free template-based tools remain available.'
  });
}
