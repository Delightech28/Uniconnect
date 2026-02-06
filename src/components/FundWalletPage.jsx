import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  fetchBanks,
  verifyAccountNumber,
  chargeWithPaystackInline,
  createTransferRecipient,
} from '../services/paystackService';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'YOUR_PAYSTACK_PUBLIC_KEY';

// Determine API base: Vercel (/api), or fallback to VITE_API_BASE, or localhost
const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  // On production (Vercel), use /api (same domain)
  return '/api';
};

const FundWalletPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    selectedBank: '',
    accountNumber: '',
    accountName: '',
  });

  const [accountVerified, setAccountVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load user and banks on component mount
  useEffect(() => {
    const loadUserAndBanks = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser({ id: currentUser.uid, ...userDoc.data() });
        }

        // Fetch banks
        const banksList = await fetchBanks();
        setBanks(banksList);
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndBanks();
  }, [navigate]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Reset verification when user changes bank or account number
    if (name === 'selectedBank' || name === 'accountNumber') {
      setAccountVerified(false);
      setAccountName('');
      setVerificationError('');
    }
  };

  // Verify account number
  const handleVerifyAccount = async () => {
    if (!formData.selectedBank || !formData.accountNumber) {
      setVerificationError('Please select a bank and enter account number');
      return;
    }

    if (formData.accountNumber.length < 10) {
      setVerificationError('Account number must be at least 10 digits');
      return;
    }

    try {
      setVerifying(true);
      setVerificationError('');

      const verificationResult = await verifyAccountNumber(
        formData.accountNumber,
        formData.selectedBank
      );

      if (verificationResult) {
        setFormData(prev => ({
          ...prev,
          accountName: verificationResult.account_name,
        }));
        setAccountVerified(true);
      } else {
        setVerificationError('Account verification failed. Please check your details.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Error verifying account. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Handle fund wallet submission
  const handleFundWallet = async () => {
    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    if (!accountVerified) {
      setErrorMessage('Please verify your account first');
      return;
    }

    try {
      setProcessing(true);
      setErrorMessage('');
      setSuccessMessage('');

      const amount = parseFloat(formData.amount);

      // Generate unique reference
      const reference = `UW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Charge card with Paystack
      const paymentResult = await chargeWithPaystackInline(
        user.email,
        amount,
        PAYSTACK_PUBLIC_KEY
      );

      if (paymentResult && paymentResult.status === 'success') {
        // Payment successful, now update user's wallet in Firestore
        const userRef = doc(db, 'users', user.id);
        const currentBalance = user.walletBalance || 0;
        const newBalance = currentBalance + amount;

        console.log('Funding wallet:', { currentBalance, amount, newBalance });

        // Update user's wallet balance
        await updateDoc(userRef, {
          walletBalance: newBalance,
          lastFundingDate: serverTimestamp(),
        });

        console.log('Wallet balance updated in Firestore');

        // Log transaction
        await addDoc(collection(db, 'users', user.id, 'transactions'), {
          type: 'credit',
          title: 'Wallet Funding',
          amount,
          reference: paymentResult.reference,
          paystackTransactionId: paymentResult.id,
          accountNumber: formData.accountNumber,
          bankCode: formData.selectedBank,
          timestamp: serverTimestamp(),
          status: 'completed',
        });

        console.log('Transaction logged');

        // Save account for future use (optional)
        await addDoc(collection(db, 'users', user.id, 'bankAccounts'), {
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          bankCode: formData.selectedBank,
          bankName: banks.find(b => b.code === formData.selectedBank)?.name,
          savedAt: serverTimestamp(),
          isDefault: !(user.defaultBankAccount),
        });

        setSuccessMessage(`Wallet funded successfully! ₦${amount.toLocaleString()} added to your wallet.`);
        
        // Update local user state with new balance
        setUser(prev => ({
          ...prev,
          walletBalance: newBalance,
        }));

        console.log('Local state updated with new balance:', newBalance);
        
        // Reset form
        setFormData({
          amount: '',
          selectedBank: '',
          accountNumber: '',
          accountName: '',
        });
        setAccountVerified(false);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/uni-wallet');
        }, 2000);
      }
    } catch (error) {
      console.error('Funding error:', error);
      setErrorMessage(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full min-h-screen flex flex-col">
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
        <main className="flex-1 px-4 sm:px-10 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/uni-wallet')}
                className="flex items-center gap-2 text-primary hover:underline mb-4"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Back to Wallet</span>
              </button>
              <h1 className="text-secondary dark:text-white text-3xl font-bold font-display">
                Fund Your Wallet
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Add funds to your UniWallet using your bank account
              </p>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/50 border border-green-500 rounded-lg">
                <p className="text-green-700 dark:text-green-200 text-sm">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-700 dark:text-red-200 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Main Form Card */}
            <div className="bg-white dark:bg-secondary rounded-xl shadow-md p-8">
              {/* Amount Section */}
              <div className="mb-8">
                <label className="block text-secondary dark:text-white font-semibold mb-3">
                  Amount to Fund <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-2xl text-slate-400">₦</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount in Naira"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    step="100"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Minimum: ₦100 | Maximum: ₦1,000,000
                </p>
              </div>

              {/* Bank Selection */}
              <div className="mb-8">
                <label className="block text-secondary dark:text-white font-semibold mb-3">
                  Select Bank <span className="text-red-500">*</span>
                </label>
                <select
                  name="selectedBank"
                  value={formData.selectedBank}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose your bank...</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div className="mb-8">
                <label className="block text-secondary dark:text-white font-semibold mb-3">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your account number"
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength="10"
                  />
                  <button
                    onClick={handleVerifyAccount}
                    disabled={verifying || !formData.selectedBank || !formData.accountNumber}
                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                {verificationError && (
                  <p className="text-red-500 text-sm mt-2">{verificationError}</p>
                )}

                {accountVerified && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                    <p className="text-green-700 dark:text-green-300 text-sm font-semibold">
                      ✓ Account Verified
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                      {formData.accountName}
                    </p>
                  </div>
                )}
              </div>

              {/* Fund Button */}
              <button
                onClick={handleFundWallet}
                disabled={processing || !accountVerified || !formData.amount}
                className="w-full py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    Fund Wallet with ₦{formData.amount || '0'}
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  <strong>How it works:</strong> Your payment will be processed through Paystack securely. 
                  The funds will be credited to your wallet immediately after verification.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl flex-shrink-0">
                  lock
                </span>
                <div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                    Your information is secure
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                    We use industry-standard encryption and partner with Paystack for secure payment processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default FundWalletPage;
