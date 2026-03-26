// Paystack API Service
// Replace with your actual Paystack Public Key
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'YOUR_PAYSTACK_PUBLIC_KEY';
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY || 'YOUR_PAYSTACK_SECRET_KEY';

/**
 * Fetch all available banks from Paystack
 */
export const fetchBanks = async () => {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch banks');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
};

/**
 * Verify account number with Paystack
 */
export const verifyAccountNumber = async (accountNumber, bankCode) => {
  try {
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify account');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error verifying account:', error);
    return null;
  }
};

/**
 * Initialize payment transaction with Paystack
 * This is used to collect money FROM the user TO your wallet
 * @param {string} email - User's email
 * @param {number} amount - Amount in Naira
 * @param {string} reference - Unique transaction reference
 * @param {string} callbackUrl - URL to redirect after payment
 * @param {string[]} channels - Payment channels to enable (e.g., ['card', 'bank', 'ussd', 'qr', 'mobile_money'])
 */
export const initializePayment = async (email, amount, reference, callbackUrl = null, channels = ['card', 'bank', 'ussd', 'qr']) => {
  try {
    const payload = {
      email,
      amount: amount * 100, // Paystack uses kobo (multiply by 100)
      reference,
      channels: channels, // Enable multiple payment channels
    };

    // Add callback URL if provided
    if (callbackUrl) {
      payload.callback_url = callbackUrl;
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to initialize payment');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw error;
  }
};

/**
 * Verify payment transaction with Paystack
 */
export const verifyPayment = async (reference) => {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return null;
  }
};

/**
 * Create transfer recipient (for wallet withdrawal later)
 */
export const createTransferRecipient = async (accountNumber, bankCode, recipientName) => {
  try {
    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: recipientName,
        account_number: accountNumber,
        bank_code: bankCode,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create transfer recipient');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating transfer recipient:', error);
    return null;
  }
};

/**
 * Initiate transfer from Paystack (for wallet withdrawal)
 */
export const initiateTransfer = async (recipient, amount, reference) => {
  try {
    const response = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        recipient,
        amount: amount * 100, // in kobo
        reference,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate transfer');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error initiating transfer:', error);
    return null;
  }
};

/**
 * Load Paystack script for inline payment
 */
export const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.body.appendChild(script);
  });
};

/**
 * Charge with Paystack inline (client-side)
 */
export const chargeWithPaystackInline = async (email, amount, publicKey) => {
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
        amount: amount * 100, // in kobo
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
