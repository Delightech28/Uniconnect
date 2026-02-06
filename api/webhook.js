// Vercel Serverless Function: Paystack Webhook Handler
// POST /api/webhook

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const admin = require('firebase-admin');

let db;

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

db = admin.firestore();

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Paystack webhook signature
    const hash = require('crypto')
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    console.log(`Webhook event: ${event}`);

    // Handle transfer success
    if (event === 'transfer.success') {
      const { recipient, amount, reference, status } = data;

      if (status !== 'success') {
        return res.status(200).json({ success: false, message: 'Transfer not successful' });
      }

      // Find user by paystackCustomerId or email
      const usersRef = db.collection('users');
      const snapshot = await usersRef
        .where('paystackCustomerId', '==', recipient?.toString())
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`No user found for recipient: ${recipient}`);
        return res.status(200).json({ success: false, message: 'User not found' });
      }

      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      const amountInNaira = amount / 100; // Paystack sends amount in kobo

      // Update user's wallet balance
      await userDoc.ref.update({
        walletBalance: admin.firestore.FieldValue.increment(amountInNaira),
      });

      // Log transaction
      await db.collection('users').doc(userId).collection('transactions').add({
        type: 'credit',
        amount: amountInNaira,
        description: 'Received via bank transfer',
        reference: reference,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
      });

      console.log(`✅ Updated wallet for user ${userId}: +₦${amountInNaira}`);
      return res.status(200).json({ success: true, message: 'Wallet updated' });
    }

    // Handle charge success (card payments)
    if (event === 'charge.success') {
      const { customer, amount, reference, status } = data;

      if (status !== 'success') {
        return res.status(200).json({ success: false, message: 'Charge not successful' });
      }

      // Find user by email
      const usersRef = db.collection('users');
      const snapshot = await usersRef
        .where('email', '==', customer?.email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`No user found for email: ${customer?.email}`);
        return res.status(200).json({ success: false, message: 'User not found' });
      }

      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      const amountInNaira = amount / 100; // Paystack sends amount in kobo

      // Update wallet balance
      await userDoc.ref.update({
        walletBalance: admin.firestore.FieldValue.increment(amountInNaira),
      });

      // Log transaction
      await db.collection('users').doc(userId).collection('transactions').add({
        type: 'credit',
        amount: amountInNaira,
        description: 'Wallet funded via card',
        reference: reference,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
      });

      console.log(`✅ Updated wallet for user ${userId}: +₦${amountInNaira}`);
      return res.status(200).json({ success: true, message: 'Wallet updated' });
    }

    // Other events
    return res.status(200).json({ success: true, message: 'Event received' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
