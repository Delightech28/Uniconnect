import express from 'express';
import cors from 'cors';
// using Node's global `fetch` (available in Node 18+)
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Allow configuring the allowed frontend origin via env (e.g. https://yourdomain.com)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET) {
  console.warn('Warning: PAYSTACK_SECRET_KEY is not set in server environment');
}

app.post('/verify-account', async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({ error: 'Missing account number or bank code' });
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

    return res.json({ success: true, data: verifyData.data });
  } catch (err) {
    console.error('Verify account error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.post('/transfer', async (req, res) => {
  try {
    const { accountNumber, bankCode, accountName, amount, reference } = req.body;

    if (!accountNumber || !bankCode || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    return res.json({ success: true, data: transferData.data });
  } catch (err) {
    console.error('Transfer error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Paystack transfer server running on port ${PORT} (CORS origin: ${FRONTEND_ORIGIN})`));
