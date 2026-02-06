import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { createVirtualAccount } from '../services/virtualAccountService';

const ReceiveMoneyPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankDetails, setBankDetails] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ id: currentUser.uid, ...userData });
          
          // Check if user already has a virtual account
          if (userData.virtualAccount) {
            setBankDetails(userData.virtualAccount);
            setLoading(false);
          } else {
            // Auto-generate virtual account if not exists
            await generateVirtualAccount(userData);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load your details');
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  // Copy to clipboard function
  const handleCopyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Generate virtual account for user
  const generateVirtualAccount = async (userData) => {
    try {
      const firstName = userData.displayName?.split(' ')[0] || userData.fullName?.split(' ')[0] || 'User';
      const lastName = userData.displayName?.split(' ')[1] || userData.fullName?.split(' ')[1] || 'Account';
      const email = userData.email || auth.currentUser?.email;
      let phone = userData.phone || '';

      // Phone is required by Paystack - use a placeholder if not available
      if (!phone || phone.trim() === '') {
        phone = '08000000000'; // Placeholder - user should update their profile
      }

      toast.loading('Creating your virtual account...');

      const accountData = await createVirtualAccount(firstName, lastName, email, phone);

      // Save virtual account to Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        virtualAccount: accountData,
      });

      setBankDetails(accountData);
      toast.dismiss();
      toast.success('Virtual account created successfully!');
    } catch (error) {
      console.error('Error generating virtual account:', error);
      toast.dismiss();
      toast.error(`Failed to create virtual account: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col">
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary dark:text-white">Loading...</p>
          </div>
        </main>
        <Footer darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-background-light dark:bg-slate-900">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
      
      <main className="flex-1 overflow-y-auto px-4 sm:px-10 py-8 relative z-0">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-secondary dark:text-white text-3xl font-bold mb-2">
              Receive Money
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Share your bank details with others so they can send you money
            </p>
          </div>

          {/* User Info Card */}
          <div className="bg-white dark:bg-secondary rounded-xl shadow-md p-8 mb-8">
            {/* User Name */}
            <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                Recipient Name
              </h2>
              <p className="text-2xl font-bold text-secondary dark:text-white">
                {user?.displayName || user?.fullName || user?.email || 'Your Name'}
              </p>
            </div>

            {/* Bank Details */}
            {bankDetails ? (
              <>
                {/* Account Number */}
                <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                    Account Number
                  </h3>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-xl font-mono font-bold text-secondary dark:text-white">
                      {bankDetails.accountNumber}
                    </p>
                    <button
                      onClick={() => handleCopyToClipboard(bankDetails.accountNumber, 'Account Number')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        copiedField === 'Account Number'
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {copiedField === 'Account Number' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Bank Name */}
                <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                    Bank Name
                  </h3>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-lg font-semibold text-secondary dark:text-white">
                      {bankDetails.bankName}
                    </p>
                    <button
                      onClick={() => handleCopyToClipboard(bankDetails.bankName, 'Bank Name')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        copiedField === 'Bank Name'
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {copiedField === 'Bank Name' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Bank Code (if available) */}
                {bankDetails.bankCode && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                      Bank Code
                    </h3>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-lg font-mono font-semibold text-secondary dark:text-white">
                        {bankDetails.bankCode}
                      </p>
                      <button
                        onClick={() => handleCopyToClipboard(bankDetails.bankCode, 'Bank Code')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          copiedField === 'Bank Code'
                            ? 'bg-green-500 text-white'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {copiedField === 'Bank Code' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Virtual account creation in progress...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 How it works
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <li>• Share your account details with anyone who wants to send you money</li>
              <li>• They can use the "Send Money" feature and enter your details</li>
              <li>• The money will be transferred directly to your bank account</li>
              <li>• Click "Copy" to easily share your details via chat or email</li>
            </ul>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/uni-wallet')}
            className="w-full mt-8 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            ← Back to Wallet
          </button>
        </div>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default ReceiveMoneyPage;
