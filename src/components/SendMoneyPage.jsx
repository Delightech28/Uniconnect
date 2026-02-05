import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { chargeWithPaystackInline, fetchBanks, verifyAccountNumber } from '../services/paystackService';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'YOUR_PAYSTACK_PUBLIC_KEY';

const SendMoneyPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    selectedBank: '',
    accountNumber: '',
    amount: '',
    note: '',
  });

  const [accountVerified, setAccountVerified] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  // Load user on mount
  useEffect(() => {
    const loadUserAndBanks = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser({ id: currentUser.uid, ...userDoc.data() });
        }

        // Fetch banks
        const banksList = await fetchBanks();
        setBanks(banksList);
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Failed to load page');
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

      // Call backend to verify account
      const resp = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/verify-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: formData.accountNumber,
          bankCode: formData.selectedBank,
        }),
      });

      const result = await resp.json();
      if (!resp.ok || !result.success) {
        console.error('Verification failed', result);
        setVerificationError(result.error || 'Account verification failed. Please check your details.');
        return;
      }

      const verificationResult = result.data;
      setAccountName(verificationResult.account_name);
      setAccountVerified(true);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Error verifying account. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Handle send money submission
  const handleSendMoney = async () => {
    // start spinner immediately for UX
    setProcessing(true);

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setProcessing(false);
      return;
    }

    if (!accountVerified) {
      setErrorMessage('Please verify the account first');
      setProcessing(false);
      return;
    }

    const amount = parseFloat(formData.amount);

    if (amount > (user.walletBalance || 0)) {
      // show animated insufficient funds modal
      setShowInsufficientModal(true);
      setProcessing(false);
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');

      // Generate unique reference
      const reference = `SM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Call backend to create recipient and initiate transfer from platform balance
      const resp = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: formData.accountNumber,
          bankCode: formData.selectedBank,
          accountName: accountName,
          amount: amount,
          reference,
        }),
      });

      const result = await resp.json();
      if (!resp.ok || !result.success) {
        console.error('Transfer failed', result);
        setErrorMessage(result.error || 'Transfer failed.');
        return;
      }

      const transferData = result.data;

      // Transfer initiated successfully — deduct from sender wallet and log
      const senderRef = doc(db, 'users', user.id);
      const newSenderBalance = (user.walletBalance || 0) - amount;

      await updateDoc(senderRef, {
        walletBalance: newSenderBalance,
        lastTransactionDate: serverTimestamp(),
      });

      // Log transaction
      await addDoc(collection(db, 'users', user.id, 'transactions'), {
        type: 'debit',
        title: `Sent to ${accountName}`,
        amount,
        bankDetails: {
          bankCode: formData.selectedBank,
          bankName: banks.find(b => b.code === formData.selectedBank)?.name,
          accountNumber: formData.accountNumber,
          accountName: accountName,
        },
        reference: reference,
        paystack_transfer_id: transferData.id,
        transfer_status: transferData.status,
        note: formData.note,
        timestamp: serverTimestamp(),
        status: transferData.status === 'success' ? 'completed' : 'pending',
      });

      setSuccessMessage(`Transfer initiated ₦${amount.toLocaleString()} to ${accountName}.`);

      // Reset form
      setFormData({
        selectedBank: '',
        accountNumber: '',
        amount: '',
        note: '',
      });
      setAccountVerified(false);
      setAccountName('');

      // Update local user balance
      setUser(prev => ({
        ...prev,
        walletBalance: newSenderBalance,
      }));

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/uni-wallet');
      }, 2000);
    } catch (error) {
      console.error('Send error:', error);
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
                Send Money
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Send money to other UniConnect students
              </p>
            </div>

            {/* Current Balance */}
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Current Balance:</strong> ₦{(user?.walletBalance || 0).toLocaleString()}
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
              {/* Bank Selection */}
              <div className="mb-8">
                <label className="block text-secondary dark:text-white font-semibold mb-3">
                  Bank <span className="text-red-500">*</span>
                </label>
                <select
                  name="selectedBank"
                  value={formData.selectedBank}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose recipient's bank...</option>
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
                    placeholder="Enter account number"
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength="10"
                  />
                  <button
                    onClick={handleVerifyAccount}
                    disabled={verifying || !formData.selectedBank || !formData.accountNumber}
                    className="px-3 sm:px-6 py-3 bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                      {accountName}
                    </p>
                  </div>
                )}
              </div>

              {/* Amount Section */}
              <div className="mb-8">
                <label className="block text-secondary dark:text-white font-semibold mb-3">
                  Amount <span className="text-red-500">*</span>
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
                  Available to send: ₦{(user?.walletBalance || 0).toLocaleString()}
                </p>
              </div>

              {/* Note Section (Optional) */}
              <div className="mb-8">
                <label className="block text-secondary dark:text-white font-semibold mb-3">
                  Note <span className="text-slate-500 text-sm">(optional)</span>
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Add a note for the recipient..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows="3"
                />
              </div>

              {/* Summary */}
              {accountVerified && formData.amount && (
                <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">To:</span>
                      <span className="text-secondary dark:text-white font-semibold">{accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Bank:</span>
                      <span className="text-secondary dark:text-white font-semibold">{banks.find(b => b.code === formData.selectedBank)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Account:</span>
                      <span className="text-secondary dark:text-white font-semibold">{formData.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                      <span className="text-secondary dark:text-white font-semibold">₦{parseFloat(formData.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 dark:border-slate-600 pt-2">
                      <span className="text-secondary dark:text-white font-semibold">Total:</span>
                      <span className="text-secondary dark:text-white font-bold text-lg">₦{parseFloat(formData.amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendMoney}
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
                    <span className="material-symbols-outlined">send</span>
                    Send ₦{formData.amount || '0'}
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  <strong>How it works:</strong> The recipient will receive the money immediately in their wallet. 
                  Both you and the recipient will receive transaction confirmations.
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
                    Your transaction is secure
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                    Payments are processed securely through Paystack encryption. Your wallet balance is updated instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Insufficient funds modal */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-secondary rounded-xl p-6 w-full max-w-sm mx-4 text-center shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center"></span>
                </span>
                <span className="animate-ping absolute inline-flex h-24 w-24 rounded-full bg-red-400 opacity-75"></span>
                <div className="relative z-10 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl">
                  <span className="material-symbols-outlined">close</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-red-700">Insufficient Funds</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">You don't have enough balance to complete this transfer.</p>
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default SendMoneyPage;
