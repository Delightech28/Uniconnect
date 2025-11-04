   import React, { useState, useEffect } from 'react'; 
 
// --- Data for UI elements --- 
const navLinks = [ 
    { name: 'Dashboard', href: '#', active: false }, { name: 'Marketplace', 
href: '#', active: false }, { name: 'Study Hub', href: '#', active: false }, { 
name: 'CampusFeed', href: '#', active: false }, { name: 'Wallet', href: '#', 
active: true }, 
]; 
 
const actionButtons = [ 
    { icon: 'account_balance_wallet', label: 'Fund Wallet', primary: true }, 
    { icon: 'arrow_upward', label: 'Send Money', primary: false }, 
    { icon: 'arrow_downward', label: 'Receive Money', primary: false }, 
]; 
 
const transactions = [ 
    { type: 'debit', icon: 'arrow_upward', title: 'Sent to @bisi', date: 'June 15, 2024', amount: '- ₦2,500.00', color: 'red' }, 
    { type: 'credit', icon: 'arrow_downward', title: 'Wallet Funding', date: 
'June 14, 2024', amount: '+ ₦5,000.00', color: 'green' }, 
    { type: 'purchase', icon: 'shopping_cart', title: 'UniMarket Purchase', 
date: 'June 12, 2024', amount: '- ₦18,500.00', color: 'blue' }, 
    { type: 'credit', icon: 'arrow_downward', title: 'Received from@chinedu', date: 'June 11, 2024', amount: '+ ₦1,000.00', color: 'green' }, 
]; 
  
 
// --- Sub-components for better organization --- 
 
const Header = ({ darkMode, toggleDarkMode }) => { 
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const [isProfileOpen, setIsProfileOpen] = useState(false); 
    return ( 
     <header className="sticky top-0 z-20 flex items-center 
justify-between whitespace-nowrap border-b border-solid 
border-slate-200 dark:border-slate-700 px-4 sm:px-10 py-3 bg-white 
dark:bg-secondary"> 
        <div className="flex items-center gap-4 lg:gap-8"> 
            <div className="flex items-center gap-4 text-secondary 
dark:text-white"> 
                <div className="size-6 text-primary"><svg fill="currentColor" 
viewBox="0 0 48 48"><path d="M44 
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path></svg>
 </div> 
                <h2 className="text-xl font-bold leading-tight tracking-tight 
font-display">UniConnect</h2> 
            </div> 
            <nav className="hidden lg:flex items-center gap-6"> 
                {navLinks.map(link => <a key={link.name} href={link.href} 
className={`text-sm font-medium ${link.active ? 'text-primary font-bold' 
: 'text-secondary dark:text-white'}`}>{link.name}</a>)} 
            </nav> 
        </div> 
        <div className="flex flex-1 justify-end items-center gap-3 
sm:gap-6"> 
            <button onClick={toggleDarkMode} className="flex 
items-center justify-center rounded-lg h-10 w-10 bg-background-light 
dark:bg-slate-800 text-secondary dark:text-white" aria-label="Toggle 
dark mode"><span className="material-symbols-outlined">{darkMode 
? 'light_mode' : 'dark_mode'}</span></button> 
            <button className="flex items-center justify-center rounded-lg 
h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white"><span 
className="material-symbols-outlined">notifications</span></button> 
            <div className="relative"> 
                <button onClick={() => setIsProfileOpen(!isProfileOpen)}><div 
className="bg-center bg-no-repeat aspect-square bg-cover 
rounded-full size-10" style={{backgroundImage: 
'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI")'}}></div></button> 
                {isProfileOpen && (<div className="absolute right-0 mt-2 
w-48 bg-white dark:bg-secondary rounded-md shadow-lg py-1 z-10"><a 
href="#" className="block px-4 py-2 text-sm text-secondary 
dark:text-white hover:bg-background-light 
dark:hover:bg-slate-800">Profile</a><a href="#" className="block px-4 
py-2 text-sm text-secondary dark:text-white hover:bg-background-light 
dark:hover:bg-slate-800">Settings</a><a href="#" className="block 
px-4 py-2 text-sm text-secondary dark:text-white 
hover:bg-background-light dark:hover:bg-slate-800">Logout</a></div>)} 
            </div> 
             <div className="lg:hidden"><button onClick={() => 
setIsMenuOpen(!isMenuOpen)} className="text-secondary 
dark:text-white"><span className="material-symbols-outlined 
text-3xl">{isMenuOpen ? 'close' : 'menu'}</span></button></div> 
        </div> 
     </header> 
    ); 
} 
 
const BalanceCard = () => ( 
    <div className="bg-primary rounded-xl shadow-lg p-6 text-white 
text-center"> 
        <p className="text-sm opacity-80">Available Balance</p> 
        <p className="text-4xl font-bold mt-2 mb-1">₦15,000.00</p> 
 
 
        <div className="flex items-center justify-center gap-2 opacity-90 
text-sm"> 
            <span>Account active</span> 
            <span className="material-symbols-outlined 
text-base">verified</span> 
        </div> 
    </div> 
); 
 
const ActionButton = ({ icon, label, primary }) => ( 
    <button className={`w-full flex items-center justify-center gap-2 
rounded-lg h-12 px-4 text-base font-semibold transition-transform 
hover:scale-105 ${primary ? 'bg-primary text-white' : 
'bg-background-light dark:bg-slate-700 text-secondary dark:text-white'}`}> 
        <span className="material-symbols-outlined">{icon}</span> 
        <span>{label}</span> 
    </button> 
); 
 
const TransactionItem = ({ transaction }) => { 
    const colors = { 
        red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-500' }, 
        green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 
'text-green-500' }, 
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-500' }, 
    }; 
    const color = colors[transaction.color] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500' }; 
 
    return ( 
        <div className="flex items-center gap-4 p-3 rounded-lg 
hover:bg-background-light dark:hover:bg-slate-800/50"> 
            <div className={`flex items-center justify-center size-10 
rounded-full ${color.bg} ${color.text}`}> 
                <span 
className="material-symbols-outlined">{transaction.icon}</span> 
 
            </div> 
            <div className="flex-1"> 
                <p className="font-semibold text-secondary 
dark:text-white">{transaction.title}</p> 
                <p className="text-sm text-slate-500 
dark:text-slate-400">{transaction.date}</p> 
            </div> 
            <p className={`font-bold ${transaction.type === 'credit' ? 
'text-green-500' : transaction.type === 'debit' ? 'text-red-500' : 
'text-secondary dark:text-white'}`}> 
                {transaction.amount} 
            </p> 
        </div> 
    ); 
}; 
 
 
// --- Main Page Component --- 
const UniWalletPage = () => { 
  const [darkMode, setDarkMode] = useState(false); 
  useEffect(() => { if (darkMode) 
document.documentElement.classList.add('dark'); else 
document.documentElement.classList.remove('dark'); }, [darkMode]); 
 
  return ( 
    <div className="relative flex min-h-screen w-full flex-col"> 
      <Header darkMode={darkMode} toggleDarkMode={() => 
setDarkMode(!darkMode)} /> 
      <main className="flex-1 px-4 sm:px-10 py-8"> 
        <div className="max-w-4xl mx-auto"> 
          <h1 className="text-secondary dark:text-white text-3xl font-bold 
leading-tight font-display mb-8">My UniWallet</h1> 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> 
            <div className="md:col-span-1 flex flex-col gap-6"> 
              <BalanceCard /> 
              <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-6 flex flex-col gap-4"> 
 
                {actionButtons.map(btn => <ActionButton key={btn.label} 
{...btn} />)} 
              </div> 
            </div> 
            <div className="md:col-span-2 bg-white dark:bg-secondary 
rounded-xl shadow-md p-6"> 
              <div className="flex justify-between items-center mb-6"> 
                <h2 className="text-secondary dark:text-white text-xl 
font-bold font-display">Recent Transactions</h2> 
                <a className="text-primary text-sm font-medium 
hover:underline" href="#">View All</a> 
              </div> 
              <div className="space-y-4"> 
                {transactions.map((tx, index) => <TransactionItem key={index} 
transaction={tx} />)} 
                <a className="block w-full text-center text-primary text-sm 
font-medium mt-6 pt-4 border-t border-slate-200 dark:border-slate-700" 
href="#">View Full Transaction History</a> 
              </div> 
            </div> 
          </div> 
        </div> 
      </main> 
    </div> 
  ); 
}; 
 
export default UniWalletPage; 