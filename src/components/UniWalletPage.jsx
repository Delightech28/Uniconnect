import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { doc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const actionButtons = [
  { icon: 'arrow_upward', label: 'Send Money', primary: false },
  { icon: 'arrow_downward', label: 'Receive Money', primary: true },
];

// --- Sub-components for better organization ---

const BalanceCard = ({ balance }) => (
  <div className="bg-primary rounded-xl shadow-lg p-6 text-white text-center">
    <p className="text-sm opacity-80">Available Balance</p>
    <p className="text-4xl font-bold mt-2 mb-1">
      ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>

    <div className="flex items-center justify-center gap-2 opacity-90 text-sm">
      <span>Account active</span>
      <span className="material-symbols-outlined text-base">verified</span>
    </div>
  </div>
);

const ActionButton = ({ icon, label, primary, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center gap-2 rounded-lg h-12 px-4 text-base font-semibold transition-transform hover:scale-105 ${primary
        ? 'bg-primary text-white'
        : 'bg-background-light dark:bg-slate-700 text-secondary dark:text-white'
      }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    <span>{label}</span>
  </button>
);

const TransactionItem = ({ transaction }) => {
  const colors = {
    red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-500' },
  };

  // Determine color based on transaction type if not explicitly set
  let colorKey = transaction.color;
  if (!colorKey) {
    if (transaction.type === 'credit') colorKey = 'green';
    else if (transaction.type === 'debit') colorKey = 'red';
    else colorKey = 'blue';
  }

  const color = colors[colorKey] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500' };

  // Format date
  let dateStr = 'Recently';
  if (transaction.timestamp) {
    // Handle Firestore Timestamp or standard Date object
    const date = transaction.timestamp.toDate ? transaction.timestamp.toDate() : new Date(transaction.timestamp);
    dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (transaction.date) {
    dateStr = transaction.date;
  }

  // Format amount
  const isCredit = transaction.type === 'credit';
  const sign = isCredit ? '+' : '-';
  const amountClass = isCredit ? 'text-green-500' : (transaction.type === 'debit' ? 'text-red-500' : 'text-secondary dark:text-white');

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors">
      <div className={`flex items-center justify-center size-10 rounded-full ${color.bg} ${color.text}`}>
        <span className="material-symbols-outlined">{transaction.icon || 'payments'}</span>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-secondary dark:text-white">{transaction.title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{dateStr}</p>
      </div>
      <p className={`font-bold ${amountClass}`}>
        {sign} ₦{parseFloat(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};


// --- Main Page Component ---
const UniWalletPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // 1. Listen to User Document for Balance
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setBalance(docSnap.data().walletBalance || 0);
          }
        });

        // 2. Listen to Transactions Subcollection
        const q = query(
          collection(db, 'users', currentUser.uid, 'transactions'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );

        const unsubTrans = onSnapshot(q, (snapshot) => {
          const txs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRecentTransactions(txs);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching transactions:", error);
          setLoading(false);
        });

        return () => {
          unsubUser();
          unsubTrans();
        };
      } else {
        setLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-background-light dark:bg-slate-900">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

      <main className="flex-1 overflow-y-auto px-4 sm:px-10 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-secondary dark:text-white text-3xl font-bold leading-tight font-display mb-8">
            My UniWallet
          </h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Balance & Actions */}
              <div className="md:col-span-1 flex flex-col gap-6">
                <BalanceCard balance={balance} />

                <div className="bg-white dark:bg-secondary rounded-xl shadow-md p-6 flex flex-col gap-4">
                  {actionButtons.map(btn => (
                    <ActionButton
                      key={btn.label}
                      {...btn}
                      onClick={() => {
                        if (btn.label === 'Fund Wallet') {
                          navigate('/fund-wallet');
                        } else if (btn.label === 'Send Money') {
                          navigate('/send-money');
                        } else if (btn.label === 'Receive Money') {
                          navigate('/receive-money');
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Transactions */}
              <div className="md:col-span-2 bg-white dark:bg-secondary rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-secondary dark:text-white text-xl font-bold font-display">
                    Recent Transactions
                  </h2>
                  <button className="text-primary text-sm font-medium hover:underline">
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => (
                      <TransactionItem key={tx.id} transaction={tx} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <p>No recent transactions</p>
                    </div>
                  )}

                  {recentTransactions.length > 0 && (
                    <button className="block w-full text-center text-primary text-sm font-medium mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 hover:text-primary/80">
                      View Full Transaction History
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default UniWalletPage;
