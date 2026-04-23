


import { getFunctions, httpsCallable } from 'firebase/functions';
import { enforceClientRateLimit } from '../utils/rateLimit';


const PAYSTACK_PUBLIC_KEY = 'pk_live_9a3e74823eb174a31acb13ce91cb855a5f848b14';


const functions = getFunctions();


const fetchPaystackBanksFn = httpsCallable(functions, 'fetchPaystackBanks');
const verifyPaystackAccountFn = httpsCallable(functions, 'verifyPaystackAccount');
const initializePaystackPaymentFn = httpsCallable(functions, 'initializePaystackPayment');
const verifyPaystackPaymentFn = httpsCallable(functions, 'verifyPaystackPayment');
const createPaystackRecipientFn = httpsCallable(functions, 'createPaystackRecipient');
const initiatePaystackTransferFn = httpsCallable(functions, 'initiatePaystackTransfer');


export const fetchBanks = async () => {
  try {
    enforceClientRateLimit('paystack-fetch-banks', 1500);
    const result = await fetchPaystackBanksFn();
    return result.data;
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
};


export const verifyAccountNumber = async (accountNumber, bankCode) => {
  try {
    enforceClientRateLimit('paystack-verify-account', 2500);
    const result = await verifyPaystackAccountFn({ accountNumber, bankCode });
    return result.data;
  } catch (error) {
    console.error('Error verifying account:', error);
    return null;
  }
};


export const initializePayment = async (email, amount, reference, callbackUrl = null, channels = ['card', 'bank', 'ussd', 'qr']) => {
  try {
    enforceClientRateLimit('paystack-initialize-payment', 3000);
    const result = await initializePaystackPaymentFn({
      email,
      amount,
      reference,
      callbackUrl,
      channels
    });
    return result.data;
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw error;
  }
};


export const verifyPayment = async (reference) => {
  try {
    enforceClientRateLimit('paystack-verify-payment', 2000);
    const result = await verifyPaystackPaymentFn({ reference });
    return result.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return null;
  }
};


export const createTransferRecipient = async (accountNumber, bankCode, recipientName) => {
  try {
    enforceClientRateLimit('paystack-create-transfer-recipient', 4000);
    const result = await createPaystackRecipientFn({
      accountNumber,
      bankCode,
      recipientName
    });
    return result.data;
  } catch (error) {
    console.error('Error creating transfer recipient:', error);
    return null;
  }
};


export const initiateTransfer = async (recipient, amount, reference) => {
  try {
    enforceClientRateLimit('paystack-initiate-transfer', 5000);
    const result = await initiatePaystackTransferFn({
      recipient,
      amount,
      reference
    });
    return result.data;
  } catch (error) {
    console.error('Error initiating transfer:', error);
    return null;
  }
};


export const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.body.appendChild(script);
  });
};


export const chargeWithPaystackInline = async (email, amount, publicKey = PAYSTACK_PUBLIC_KEY) => {
  try {
    await loadPaystackScript();

    return new Promise((resolve, reject) => {
      if (!window.PaystackPop) {
        reject(new Error('Paystack script not loaded'));
        return;
      }

      window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: amount * 100,
        onClose: () => {
          reject(new Error('Transaction cancelled'));
        },
        onSuccess: (response) => {
          resolve(response);
        },
      });

      window.PaystackPop.openIframe();
    });
  } catch (error) {
    console.error('Error with Paystack inline charge:', error);
    throw error;
  }
};