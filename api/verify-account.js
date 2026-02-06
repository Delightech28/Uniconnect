// Vercel Serverless Function: Account Verification
// POST /api/verify-account

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({ error: 'Missing account number or bank code' });
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const verifyResp = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const verifyData = await verifyResp.json();
    if (!verifyResp.ok || !verifyData.data) {
      return res.status(400).json({ error: 'Account verification failed', details: verifyData });
    }

    return res.status(200).json({ success: true, data: verifyData.data });
  } catch (err) {
    console.error('Verify account error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
