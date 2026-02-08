import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import {
  initializePayment,
  verifyPayment,
} from '../services/paystackService';

const ReceiveMoneyPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check for payment callback
  useEffect(() => {
    const handlePaymentCallback = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const paymentRef = reference || trxref;

      if (paymentRef) {
        try {
          setLoading(true);
          setErrorMessage('');
          
          // Get current user
          const currentUser = auth.currentUser;
          if (!currentUser) {
            navigate('/login');
            return;
          }

          // Verify payment with Paystack
          const paymentData = await verifyPayment(paymentRef);
          
          if (paymentData && paymentData.status === 'success') {
            // Check if transaction already processed
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              setErrorMessage('User not found');
              return;
            }

            // Check if transaction already exists
            const txQuery = query(
              collection(db, 'users', currentUser.uid, 'transactions'),
              where('reference', '==', paymentRef)
            );
            const txSnapshot = await getDocs(txQuery);

            if (!txSnapshot.empty) {
              // Transaction already processed
              setSuccessMessage('Payment already processed!');
              setTimeout(() => navigate('/uni-wallet'), 2000);
              return;
            }

            // Process payment
            const amountInNaira = paymentData.amount / 100;
            const currentBalance = userDoc.data().walletBalance || 0;
            const newBalance = currentBalance + amountInNaira;

            // Update wallet balance
            await updateDoc(userRef, {
              walletBalance: newBalance,
              lastFundingDate: serverTimestamp(),
            });

            // Log transaction
            await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
              type: 'credit',
              title: 'Wallet Funding',
              amount: amountInNaira,
              reference: paymentRef,
              paystackTransactionId: paymentData.id || 'unknown',
              timestamp: serverTimestamp(),
              status: 'completed',
              paymentMethod: paymentData.channel || 'unknown',
            });

            setSuccessMessage(`Wallet funded successfully! ₦${amountInNaira.toLocaleString()} added to your wallet.`);
            
            // Redirect after 2 seconds
            setTimeout(() => {
              navigate('/uni-wallet');
            }, 2000);
          } else {
            setErrorMessage('Payment verification failed. Please contact support if you were charged.');
          }
        } catch (error) {
          console.error('Payment callback error:', error);
          setErrorMessage('Error verifying payment. Please contact support if you were charged.');
        } finally {
          setLoading(false);
        }
      }
    };

    handlePaymentCallback();
  }, [searchParams, navigate]);

  // Load user on component mount
  useEffect(() => {
    const loadUser = async () => {
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
      } catch (error) {
        console.error('Error loading user:', error);
        setErrorMessage('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    // Only load user if not handling callback
    if (!searchParams.get('reference') && !searchParams.get('trxref')) {
      loadUser();
    }
  }, [navigate, searchParams]);

  // Handle fund wallet submission
  const handleFundWallet = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue < 50) {
      setErrorMessage('Minimum amount is ₦50');
      return;
    }

    if (amountValue > 1000000) {
      setErrorMessage('Maximum amount is ₦1,000,000');
      return;
    }

    if (!user || !user.email) {
      setErrorMessage('User information not available. Please try again.');
      return;
    }

    try {
      setProcessing(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Generate unique reference
      const reference = `UW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get callback URL (current page URL)
      const callbackUrl = `${window.location.origin}/receive-money`;

      // Initialize payment with Paystack
      const paymentData = await initializePayment(
        user.email,
        amountValue,
        reference,
        callbackUrl,
        ['card', 'bank', 'ussd', 'qr'] // Enable multiple payment channels
      );

      if (paymentData && paymentData.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Funding error:', error);
      setErrorMessage(error.message || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  // Show loading state if processing callback
  if (loading && (searchParams.get('reference') || searchParams.get('trxref'))) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-background-light dark:bg-slate-900">
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary dark:text-white">Verifying payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-background-light dark:bg-slate-900">
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
              Receive Money
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Fund your wallet with multiple payment options via Paystack
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in Naira"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  min="50"
                  step="50"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Minimum: ₦50 | Maximum: ₦1,000,000
              </p>
            </div>

            {/* Fund Button */}
            <button
              onClick={handleFundWallet}
              disabled={processing || !amount || parseFloat(amount) <= 0}
              className="w-full py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Redirecting to Paystack...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  Continue to Payment Page
                </>
              )}
            </button>

            {/* Payment Options Info */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold mb-2">
                Available Payment Methods:
              </p>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 list-disc list-inside">
                <li>Bank Card (Visa, Mastercard, Verve)</li>
                <li>Bank Transfer</li>
                <li>USSD</li>
                <li>QR Code</li>
              </ul>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-3">
                <strong>How it works:</strong> You'll be redirected to Paystack's secure payment page where you can choose your preferred payment method. Your wallet will be funded immediately after successful payment.
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
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default ReceiveMoneyPage;
