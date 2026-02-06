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

    // Phone is required by Paystack for dedicated accounts
    const phoneNumber = phone && phone.trim() !== '' ? phone : '08000000000';

    // Step 1: Create or get customer
    const customerResp = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber,
      }),
    });

    const customerData = await customerResp.json();
    console.log('Paystack customer response:', customerData);

    if (!customerResp.ok || !customerData.data) {
      console.error('Customer creation failed:', customerData);
      return res.status(400).json({ 
        error: 'Failed to create customer account', 
        details: customerData.message || 'Unknown error'
      });
    }

    const customerId = customerData.data.id;

    // Step 2: Create dedicated virtual account for this customer
    const accountResp = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerId,
        preferred_bank: 'wema-bank',
      }),
    });

    const accountData = await accountResp.json();
    console.log('Paystack dedicated_account response:', accountData);

    if (!accountResp.ok || !accountData.data) {
      console.error('Virtual account creation failed:', accountData);
      return res.status(400).json({ 
        error: 'Failed to create virtual account', 
        details: accountData.message || JSON.stringify(accountData)
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
        paystackCustomerId: customerId,
        paystackAccountId: virtualAccount.id,
      }
    });
  } catch (err) {
    console.error('Create virtual account error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
