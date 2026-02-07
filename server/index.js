import express from 'express';
import cors from 'cors';
// using Node's global `fetch` (available in Node 18+)
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import crypto from 'crypto';

dotenv.config();

// Initialize Firebase Admin
// You need to set FIREBASE_SERVICE_ACCOUNT in your .env
// It should be the JSON content of your service account key
// OR set individual fields
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

    if (serviceAccount.projectId) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized');
    } else {
      console.warn('Firebase Admin NOT initialized: Missing credentials');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

const db = admin.firestore();
const app = express();

// Allow configuring the allowed frontend origin via env (e.g. https://yourdomain.com)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN }));

// Parse JSON bodies
app.use(express.json());

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET) {
  console.warn('Warning: PAYSTACK_SECRET_KEY is not set in server environment');
}

// --- WEBHOOK HANDLER ---
app.post('/webhook', async (req, res) => {
  try {
    // 1. Verify Paystack Signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;
    console.log(`Webhook received: ${event}`, data?.reference);

    // 2. Handle Transfer Success (Money Received via Virtual Account) or Card Charge
    if (event === 'transfer.success' || event === 'charge.success') {
      const amount = data.amount / 100; // Convert kobo to naira
      const reference = data.reference;
      let userId = null;
      let userDoc = null;

      // Strategy to find user:
      // A. If it's a dedicated account transfer, use the recipient code (paystackDedicatedAccountId)
      // B. If it's a card charge, look up by email

      if (event === 'transfer.success') {
        const recipientCode = data.recipient.recipient_code || data.recipient;

        // Try finding user by dedicated account ID
        let userQuery = await db.collection('users')
          .where('paystackDedicatedAccountId', '==', String(recipientCode))
          .limit(1)
          .get();

        if (userQuery.empty) {
          // Fallback: Try customer ID/Code if stored
          // Some integrations store 'customer_code' or 'id'
          // We can broaden search if needed, but dedicated_account_id is most reliable
          console.log(`No user found for recipient code: ${recipientCode}`);
        } else {
          userDoc = userQuery.docs[0];
          userId = userDoc.id;
        }
      } else if (event === 'charge.success') {
        // Card payment
        const email = data.customer.email;
        const userQuery = await db.collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          userDoc = userQuery.docs[0];
          userId = userDoc.id;
        }
      }

      if (userId && userDoc) {
        // 3. Update User Wallet
        await userDoc.ref.update({
          walletBalance: admin.firestore.FieldValue.increment(amount)
        });

        // 4. Log Transaction
        // Check if transaction already exists to avoid duplicates
        const txQuery = await db.collection('users').doc(userId).collection('transactions')
          .where('reference', '==', reference)
          .limit(1)
          .get();

        if (txQuery.empty) {
          await db.collection('users').doc(userId).collection('transactions').add({
            type: 'credit',
            amount: amount,
            title: event === 'transfer.success' ? 'Received Transfer' : 'Wallet Funding',
            description: event === 'transfer.success'
              ? `Received from ${data.source?.details?.account_name || 'Bank Transfer'}`
              : 'Card Payment',
            reference: reference,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'success',
            metadata: data
          });
          console.log(`✅ Credited ₦${amount} to user ${userId}`);
        } else {
          console.log(`Transaction ${reference} already processed`);
        }
      } else {
        console.warn('Could not find user for webhook event', data);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.sendStatus(500);
  }
});

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

app.post('/create-virtual-account', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email' });
    }

    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' });
    }

    // Phone is required by Paystack for dedicated accounts
    const phoneNumber = phone && phone.trim() !== '' ? phone : '08000000000';

    // Step 1: Create customer
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

    if (!customerResp.ok) {
      console.error('Customer creation/fetch failed:', customerData);
      return res.status(400).json({
        error: 'Failed to create customer account',
        details: customerData.message || 'Unknown error'
      });
    }

    let customerId = customerData.data?.id;
    let customerCode = customerData.data?.customer_code;

    // If customer exists but has no phone, update the customer with phone
    if (customerData.data && !customerData.data.phone) {
      console.log('Updating customer with phone number...');
      const updateResp = await fetch(`https://api.paystack.co/customer/${customerCode || customerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber,
        }),
      });

      const updateData = await updateResp.json();

      if (!updateResp.ok) {
        console.error('Customer update failed:', updateData);
        // Continue anyway - dedicated account might still work
      }
    }

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

    return res.json({
      success: true,
      data: {
        accountNumber: virtualAccount.account_number,
        bankName: virtualAccount.bank?.name || 'Wema Bank',
        bankCode: virtualAccount.bank?.code || '035',
        accountName: virtualAccount.account_name || `${firstName} ${lastName}`,
        paystackCustomerId: customerId,
        paystackCustomerCode: customerCode, // Useful for future
        paystackAccountId: virtualAccount.id,
        // dedicated_account_id is crucial for identifying transfers!
        paystackDedicatedAccountId: virtualAccount.id
      }
    });
  } catch (err) {
    console.error('Create virtual account error:', err);
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
