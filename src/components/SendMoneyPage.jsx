import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { chargeWithPaystackInline, fetchBanks, verifyAccountNumber } from '../services/paystackService';

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
    username: '',
    amount: '',
    note: '',
  });

  const [transferType, setTransferType] = useState('bank'); // 'bank' or 'username'
  const [accountVerified, setAccountVerified] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [paystackVerifyDetails, setPaystackVerifyDetails] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [recipientUser, setRecipientUser] = useState(null);
  const [searchingUsername, setSearchingUsername] = useState(false);

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
    
    // Reset username search when username changes
    if (name === 'username' && transferType === 'username') {
      setRecipientUser(null);
      setAccountVerified(false);
    }
  };

  // Handle username lookup
  const handleSearchUsername = async () => {
    const username = formData.username?.trim().toLowerCase().replace('@', '');
    
    if (!username) {
      setVerificationError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setVerificationError('Username must be at least 3 characters');
      return;
    }

    try {
      setSearchingUsername(true);
      setVerificationError('');
      setRecipientUser(null);

      // Search for user by username
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '==', username)
      );
      const snapshot = await getDocs(usernameQuery);

      if (snapshot.empty) {
        setVerificationError('User not found. Please check the username.');
        return;
      }

      const recipientDoc = snapshot.docs[0];
      const recipientData = recipientDoc.data();

      // Don't allow sending to yourself
      if (recipientDoc.id === user.id) {
        setVerificationError('You cannot send money to yourself');
        return;
      }

      setRecipientUser({
        id: recipientDoc.id,
        ...recipientData
      });
      setAccountName(recipientData.displayName || recipientData.email || username);
      setAccountVerified(true);
    } catch (error) {
      console.error('Error searching username:', error);
      setVerificationError('Error searching for user. Please try again.');
    } finally {
      setSearchingUsername(false);
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
      const resp = await fetch(`${getApiBase()}/verify-account`, {
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
        // save Paystack details for UI
        setPaystackVerifyDetails(result.details || result);
        // prefer Paystack message when available
        const paystackMessage = result.details?.message || result.message || result.error;
        setVerificationError(paystackMessage || 'Account verification failed. Please check your details.');
        return;
      }

      const verificationResult = result.data;
      setAccountName(verificationResult.account_name);
      setAccountVerified(true);
      setPaystackVerifyDetails(null);
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
      setErrorMessage(transferType === 'username' ? 'Please search and verify the username first' : 'Please verify the account first');
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

      if (transferType === 'username') {
        // Direct wallet-to-wallet transfer
        const senderRef = doc(db, 'users', user.id);
        const recipientRef = doc(db, 'users', recipientUser.id);
        
        const senderDoc = await getDoc(senderRef);
        const recipientDoc = await getDoc(recipientRef);
        
        if (!senderDoc.exists() || !recipientDoc.exists()) {
          setErrorMessage('User not found. Please try again.');
          setProcessing(false);
          return;
        }

        const senderBalance = senderDoc.data().walletBalance || 0;
        const recipientBalance = recipientDoc.data().walletBalance || 0;
        
        const newSenderBalance = senderBalance - amount;
        const newRecipientBalance = recipientBalance + amount;

        // Update both wallets atomically (in a batch would be better, but this works)
        await updateDoc(senderRef, {
          walletBalance: newSenderBalance,
          lastTransactionDate: serverTimestamp(),
        });

        await updateDoc(recipientRef, {
          walletBalance: newRecipientBalance,
          lastTransactionDate: serverTimestamp(),
        });

        // Log transaction for sender
        await addDoc(collection(db, 'users', user.id, 'transactions'), {
          type: 'debit',
          title: `Sent to @${recipientUser.username}`,
          amount,
          recipientUsername: recipientUser.username,
          recipientId: recipientUser.id,
          recipientName: accountName,
          reference: reference,
          note: formData.note,
          timestamp: serverTimestamp(),
          status: 'completed',
        });

        // Log transaction for recipient
        await addDoc(collection(db, 'users', recipientUser.id, 'transactions'), {
          type: 'credit',
          title: `Received from @${user.username || user.email}`,
          amount,
          senderUsername: user.username,
          senderId: user.id,
          senderName: user.displayName || user.email,
          reference: reference,
          note: formData.note,
          timestamp: serverTimestamp(),
          status: 'completed',
        });

        setSuccessMessage(`Sent ₦${amount.toLocaleString()} to @${recipientUser.username}.`);

        // Reset form
        setFormData({
          selectedBank: '',
          accountNumber: '',
          username: '',
          amount: '',
          note: '',
        });
        setAccountVerified(false);
        setAccountName('');
        setRecipientUser(null);

        // Update local user balance
        setUser(prev => ({
          ...prev,
          walletBalance: newSenderBalance,
        }));

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/uni-wallet');
        }, 2000);
      } else {
        // Bank transfer (existing logic)
        const resp = await fetch(`${getApiBase()}/transfer`, {
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
          
          // Show more detailed error message
          let errorMsg = result.error || 'Transfer failed.';
          
          // Add helpful context based on error code
          if (result.code === 'INSUFFICIENT_BALANCE') {
            errorMsg = 'Transfer failed: Your Paystack account has insufficient balance. Please contact support.';
          } else if (result.code === 'INVALID_RECIPIENT') {
            errorMsg = 'Transfer failed: Invalid recipient account. Please verify the account details and try again.';
          } else if (result.details?.message) {
            errorMsg = `Transfer failed: ${result.details.message}`;
          }
          
          setErrorMessage(errorMsg);
          setProcessing(false);
          return;
        }

        const transferData = result.data;
        console.log('Transfer initiated successfully:', transferData);

        // Transfer initiated successfully — deduct from sender wallet and log
        const senderRef = doc(db, 'users', user.id);
        const newSenderBalance = (user.walletBalance || 0) - amount;

        console.log('Updating sender wallet:', { 
          userId: user.id, 
          oldBalance: user.walletBalance, 
          amount, 
          newBalance: newSenderBalance 
        });

        await updateDoc(senderRef, {
          walletBalance: newSenderBalance,
          lastTransactionDate: serverTimestamp(),
        });

        console.log('Wallet updated successfully');

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

        console.log('Transaction logged successfully');

        setSuccessMessage(`Transfer initiated ₦${amount.toLocaleString()} to ${accountName}.`);

        // Reset form
        setFormData({
          selectedBank: '',
          accountNumber: '',
          username: '',
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

        console.log('Local state updated, balance:', newSenderBalance);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/uni-wallet');
        }, 2000);
      }
    } catch (error) {
      console.error('Send error:', error);
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
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
              {/* Transfer Type Toggle */}
              <div className="mb-8">
                <label className="block text-secondary dark:text-white font-semibold mb-3">
                  Send Money To
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferType('bank');
                      setAccountVerified(false);
                      setAccountName('');
                      setRecipientUser(null);
                      setVerificationError('');
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                      transferType === 'bank'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined align-middle mr-2">account_balance</span>
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferType('username');
                      setAccountVerified(false);
                      setAccountName('');
                      setRecipientUser(null);
                      setVerificationError('');
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                      transferType === 'username'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined align-middle mr-2">person</span>
                    Username
                  </button>
                </div>
              </div>

              {transferType === 'username' ? (
                /* Username Input */
                <div className="mb-8">
                  <label className="block text-secondary dark:text-white font-semibold mb-3">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-3.5 text-slate-400">@</span>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Enter username"
                        className="w-full pl-8 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        maxLength="20"
                      />
                    </div>
                    <button
                      onClick={handleSearchUsername}
                      disabled={searchingUsername || !formData.username}
                      className="px-3 sm:px-6 py-3 bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {searchingUsername ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {verificationError && (
                    <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                      <p className="text-red-700 dark:text-red-300 text-sm font-semibold mb-2">❌ {verificationError}</p>
                    </div>
                  )}

                  {accountVerified && recipientUser && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                      <p className="text-green-700 dark:text-green-300 text-sm font-semibold">
                        ✓ User Found
                      </p>
                      <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                        {accountName} (@{recipientUser.username})
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Bank Selection (existing code) */
                <>
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
                  <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm font-semibold mb-2">❌ Verification Failed</p>
                    <p className="text-red-600 dark:text-red-400 text-sm mb-2">
                      {verificationError}
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-xs">
                      💡 Please check:
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• Account number is correct (usually 10 digits)</li>
                        <li>• You selected the correct bank</li>
                        <li>• The account is active and valid</li>
                      </ul>
                    </p>
                    {paystackVerifyDetails && (
                      <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap bg-red-50 dark:bg-red-900/30 p-2 rounded">{typeof paystackVerifyDetails === 'string' ? paystackVerifyDetails : JSON.stringify(paystackVerifyDetails, null, 2)}</pre>
                    )}
                  </div>
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
              </>
              )}

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
                      <span className="text-secondary dark:text-white font-semibold">
                        {transferType === 'username' ? `@${recipientUser?.username}` : accountName}
                      </span>
                    </div>
                    {transferType === 'bank' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Bank:</span>
                          <span className="text-secondary dark:text-white font-semibold">{banks.find(b => b.code === formData.selectedBank)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Account:</span>
                          <span className="text-secondary dark:text-white font-semibold">{formData.accountNumber}</span>
                        </div>
                      </>
                    )}
                    {transferType === 'username' && recipientUser && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Name:</span>
                        <span className="text-secondary dark:text-white font-semibold">{accountName}</span>
                      </div>
                    )}
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
                  <strong>How it works:</strong> {
                    transferType === 'username' 
                      ? 'Send money directly to another UniConnect user\'s wallet. The transfer is instant and both parties will receive notifications.'
                      : 'The recipient will receive the money immediately in their wallet. Both you and the recipient will receive transaction confirmations.'
                  }
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
