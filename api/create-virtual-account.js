// Vercel Serverless Function: Create Virtual Account
// POST /api/create-virtual-account

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
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email' });
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create dedicated virtual account on Paystack
    const accountResp = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || '',
        preferred_bank: 'wema-bank', // or use another bank code if preferred
      }),
    });

    const accountData = await accountResp.json();

    if (!accountResp.ok || !accountData.data) {
      console.error('Virtual account creation failed:', accountData);
      return res.status(400).json({ 
        error: 'Failed to create virtual account', 
        details: accountData.message || 'Unknown error' 
      });
    }

    const virtualAccount = accountData.data;

    return res.status(200).json({ 
      success: true, 
      data: {
        accountNumber: virtualAccount.account_number,
        bankName: virtualAccount.bank?.name || 'Wema Bank',
        bankCode: virtualAccount.bank?.code || '035',
        accountName: `${firstName} ${lastName}`,
        paystackCustomerId: virtualAccount.customer?.id,
        paystackAccountId: virtualAccount.id,
      }
    });
  } catch (err) {
    console.error('Create virtual account error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
