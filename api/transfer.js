// Vercel Serverless Function: Money Transfer
// POST /api/transfer

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
    const { accountNumber, bankCode, accountName, amount, reference } = req.body;

    if (!accountNumber || !bankCode || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 1. Create transfer recipient
    const recipientResp = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName || 'Recipient',
        account_number: accountNumber,
        bank_code: bankCode,
      }),
    });

    const recipientData = await recipientResp.json();
    if (!recipientResp.ok || !recipientData.data) {
      return res.status(500).json({ error: 'Failed to create transfer recipient', details: recipientData });
    }

    const recipientCode = recipientData.data.recipient_code;

    // 2. Initiate transfer
    const transferResp = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        recipient: recipientCode,
        amount: Math.round(parseFloat(amount) * 100),
        reference: reference || `TRF-${Date.now()}`,
      }),
    });

    const transferData = await transferResp.json();
    if (!transferResp.ok) {
      return res.status(500).json({ error: 'Failed to initiate transfer', details: transferData });
    }

    return res.status(200).json({ success: true, data: transferData.data });
  } catch (err) {
    console.error('Transfer error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
