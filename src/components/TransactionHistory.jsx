import React from 'react';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';

// This data would typically come from an API, but for this example, it's hardcoded.
const transactions = [ 
  { 
    id: 1, 
    type: 'receive', 
    title: 'Payment from @JaneDoe', 
    description: 'Marketplace Sale: Textbook', 
    date: 'Apr 10, 2024', 
    status: 'Completed', 
    amount: 8500.00, 
  }, 
  { 
    id: 2, 
    type: 'send', 
    title: 'Payment to @TechGadgets', 
    description: 'Marketplace Purchase: Laptop', 
    date: 'Apr 8, 2024', 
    status: 'Completed', 
    amount: -150000.00, 
  }, 
  { 
    id: 3, 
    type: 'top-up', 
    title: 'Wallet Top-up', 
    description: 'From Bank Account', 
    date: 'Apr 5, 2024', 
 

    status: 'Completed', 
    amount: 20000.00, 
  }, 
  { 
    id: 4, 
    type: 'send', 
    title: 'Payment to @CampusEats', 
    description: 'Food Purchase', 
    date: 'Apr 4, 2024', 
    status: 'Completed', 
    amount: -1200.00, 
  }, 
]; 
 
const getTransactionStyles = (type) => { 
  switch (type) { 
    case 'receive':
      return {
        icon: 'call_received',
        bg: 'bg-green-100 dark:bg-green-900/40',
        text: 'text-green-600 dark:text-green-300',
        amountText: 'text-green-600 dark:text-green-400'
      };
    case 'send':
      return {
        icon: 'call_made',
        bg: 'bg-red-100 dark:bg-red-900/40',
        text: 'text-red-600 dark:text-red-400',
        amountText: 'text-red-600 dark:text-red-400'
      };
    case 'top-up':
      return {
        icon: 'account_balance_wallet',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-600 dark:text-blue-400',
        amountText: 'text-green-600 dark:text-green-400'
      };
    default: 
      return {}; 
  } 
}; 
 
const TransactionRow = ({ transaction }) => { 
  const styles = getTransactionStyles(transaction.type); 
   
  const formattedAmount = new Intl.NumberFormat('en-NG', { 
 

    style: 'currency', 
    currency: 'NGN', 
    signDisplay: 'always', // always show + or - 
  }).format(transaction.amount); 
 
  return ( 
    <tr> 
      <td className="p-4"> 
        <div className="flex items-center gap-3"> 
          <div className={`flex h-10 w-10 items-center justify-center 
rounded-full flex-shrink-0 ${styles.bg}`}> 
            <span className={`material-symbols-outlined 
${styles.text}`}>{styles.icon}</span> 
          </div> 
          <div> 
            <div className="font-medium text-secondary 
dark:text-white">{transaction.title}</div> 
            <div className="text-sm text-slate-500 
dark:text-dark-subtext">{transaction.description}</div> 
          </div> 
        </div> 
      </td> 
      <td className="p-4 text-slate-600 dark:text-dark-subtext 
whitespace-nowrap">{transaction.date}</td> 
      <td className="p-4"> 
        <span className="inline-flex items-center rounded-full 
bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 
dark:bg-green-900/40 dark:text-green-300"> 
          {transaction.status} 
        </span> 
      </td> 
      <td className={`p-4 text-right font-medium whitespace-nowrap 
${styles.amountText}`}>{formattedAmount}</td> 
    </tr> 
  ); 
}; 
 
 

const TransactionHistory = () => ( 
  <div className="bg-white dark:bg-dark-card rounded-xl shadow-md"> 
    <div className="p-6 border-b border-slate-200 
dark:border-slate-700"> 
      <h3 className="text-xl font-bold text-secondary 
dark:text-white">Transaction History</h3> 
    </div> 
    <div className="overflow-x-auto"> 
      <table className="w-full text-left min-w-[600px]"> 
        <thead className="border-b border-slate-200 
dark:border-slate-700"> 
          <tr> 
            <th className="p-4 text-sm font-semibold text-slate-500 
dark:text-slate-400">Transaction</th> 
            <th className="p-4 text-sm font-semibold text-slate-500 
dark:text-slate-400">Date</th> 
            <th className="p-4 text-sm font-semibold text-slate-500 
dark:text-slate-400">Status</th> 
            <th className="p-4 text-sm font-semibold text-slate-500 
dark:text-slate-400 text-right">Amount</th> 
          </tr> 
        </thead> 
        <tbody className="divide-y divide-slate-200 
dark:divide-slate-700"> 
          {transactions.map(tx => <TransactionRow key={tx.id} 
transaction={tx} />)} 
        </tbody> 
      </table> 
    </div>
  <Footer darkMode={darkMode} />
  </div> 
); 
 
export default TransactionHistory; 


