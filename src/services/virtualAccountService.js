// Virtual Account Service
// Handles creation and management of Paystack virtual accounts

const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '/api';
};

export const createVirtualAccount = async (firstName, lastName, email, phone = '') => {
  try {
    const response = await fetch(`${getApiBase()}/create-virtual-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.details || data.error || 'Failed to create virtual account');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating virtual account:', error);
    throw error;
  }
};

export const fetchBankList = async () => {
  try {
    const response = await fetch('https://api.paystack.co/bank?currency=NGN', {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_PAYSTACK_PUBLIC_KEY}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch banks');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw error;
  }
};
