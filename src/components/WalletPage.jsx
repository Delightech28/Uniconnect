import React, { useState } from 'react'; 
import { useTheme } from '../hooks/useTheme';
// --- Static Data (No Backend) --- 
const USER_WALLET_ID = "@adekunle123"; 
const USER_QR_CODE_URL = 
"https://lh3.googleusercontent.com/aida-public/AB6AXuB9mbCQRsr1v804IMr0itFrO0mR4Hczkqufh2VXblir8Pe2vq6fGM7L8hwSFuNn_ocJ9Z8H1VGiIFv2EfB5sI7Fm8Vq6RreGN2bwEDftmjxWul8v6KmxYn6vykNKoSc6_8vT5x2M1-FbC-PBHF7SA78FhXbF2KQKBmeGr9NvEtpsZTMI7Sa7_CehrFJV7eMWiq116JJxaFMCN9WWmXeA5lXdRIgR2MaxuHtDBGieXDcIs15PCrHUTtc_FsaEqLiebeeOgS57eUF7eq_"; 
 
// --- Reusable Components --- 
 
// Header Component 
const AppHeader = () => ( 
  <header className="flex items-center justify-between 
whitespace-nowrap border-b border-solid border-slate-200 
dark:border-slate-700 px-4 md:px-10 py-3 bg-white dark:bg-secondary"> 
    <div className="flex items-center gap-8"> 
      <div className="flex items-center gap-4 text-secondary 
dark:text-white"> 
        <img src="/src/assets/logo/white_greenbg.png" alt="UniSpace" className="h-12 w-12 mb-1 object-contain" /> 
        <h2 className="text-xl font-bold leading-tight 
tracking-[-0.015em] -ml-3">niSpace</h2> 
      </div> 
      <nav className="hidden md:flex items-center gap-6"> 
        <a className="text-secondary dark:text-white text-sm 
font-medium" href="#">Dashboard</a> 
        <a className="text-secondary dark:text-white text-sm 
font-medium" href="#">Marketplace</a> 
        <a className="text-secondary dark:text-white text-sm 
font-medium" href="https://uni-space-study.vercel.app" target="_blank" rel="noopener noreferrer">UniDoc</a> 
        <a className="text-primary dark:text-primary font-bold text-sm" 
href="#">Wallet</a> 
      </nav> 
    </div> 
    <div className="flex flex-1 justify-end gap-2 md:gap-6"> 
 
 
      <button className="flex items-center justify-center rounded-lg h-10 
w-10 bg-background-light dark:bg-slate-800 text-secondary 
dark:text-white"> 
        <span 
className="material-symbols-outlined">notifications</span> 
      </button> 
      <div className="relative group"> 
        <div 
          className="bg-center bg-no-repeat aspect-square bg-cover 
rounded-full size-10" 
          style={{ backgroundImage: 
`url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oX
 pOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL
 8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke
 _YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrS
 yxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANM
 AlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI")` }} 
        /> 
        <div className="absolute right-0 mt-2 w-48 bg-white 
dark:bg-secondary rounded-md shadow-lg py-1 hidden 
group-hover:block z-10"> 
          <a className="block px-4 py-2 text-sm text-secondary 
dark:text-white hover:bg-background-light dark:hover:bg-slate-800" 
href="#">Profile</a> 
        </div> 
      </div> 
    </div> 
  </header> 
); 
 
// Send Money Form Component 
const SendMoneyForm = ({ onSend }) => { 
  const [recipient, setRecipient] = useState(''); 
  const [amount, setAmount] = useState(''); 
  const [note, setNote] = useState(''); 
 
  const handleSubmit = (e) => { 
 
 
    e.preventDefault(); 
    if (!recipient || !amount || parseFloat(amount) <= 0) { 
      alert("Please enter a valid recipient and amount."); 
      return; 
    } 
    // In a real app, you'd show a confirmation modal here. 
    // For this example, we call the onSend function passed from the 
parent. 
    onSend(parseFloat(amount)); 
 
    // Reset form 
    setRecipient(''); 
    setAmount(''); 
    setNote(''); 
  }; 
 
  return ( 
    <div className="bg-white dark:bg-secondary rounded-xl shadow-md 
p-6 h-full"> 
      <h2 className="text-secondary dark:text-white text-xl font-bold 
leading-tight tracking-[-0.015em] mb-6">Send Money</h2> 
      <form className="space-y-6" onSubmit={handleSubmit}> 
        <div> 
          <label className="text-sm font-medium text-slate-700 
dark:text-slate-300" htmlFor="recipient"> 
            Recipient's UniSpace ID 
          </label> 
          <div className="relative mt-1"> 
            <span className="material-symbols-outlined absolute left-3 
top-1/2 -translate-y-1/2 text-slate-400">person</span> 
            <input 
              className="form-input w-full rounded-lg border-slate-300 
dark:border-slate-600 bg-background-light dark:bg-slate-800 
text-secondary dark:text-white pl-10 placeholder:text-slate-400 
focus:border-primary focus:ring-primary" 
              id="recipient" 
              placeholder="@username or wallet_id" 
 
 
              type="text" 
              value={recipient} 
              onChange={(e) => setRecipient(e.target.value)} 
              required 
            /> 
          </div> 
        </div> 
        <div> 
          <label className="text-sm font-medium text-slate-700 
dark:text-slate-300" htmlFor="amount"> 
            Amount (₦) 
          </label> 
          <div className="relative mt-1"> 
            <span className="absolute left-3 top-1/2 -translate-y-1/2 
font-bold text-slate-400">₦</span> 
            <input 
              className="form-input w-full rounded-lg border-slate-300 
dark:border-slate-600 bg-background-light dark:bg-slate-800 
text-secondary dark:text-white pl-8 placeholder:text-slate-400 
focus:border-primary focus:ring-primary" 
              id="amount" 
              placeholder="0.00" 
              type="number" 
              step="0.01" 
              min="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              required 
            /> 
          </div> 
        </div> 
        <div> 
          <label className="text-sm font-medium text-slate-700 
dark:text-slate-300" htmlFor="note"> 
            Note (Optional) 
          </label> 
          <textarea 
  
            className="form-textarea mt-1 block w-full rounded-lg 
border-slate-300 dark:border-slate-600 bg-background-light 
dark:bg-slate-800 text-secondary dark:text-white 
placeholder:text-slate-400 focus:border-primary focus:ring-primary" 
            id="note" 
            placeholder="For lunch, books, etc." 
            rows="2" 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
          ></textarea> 
        </div> 
        <div className="flex items-center gap-2 text-slate-500 
dark:text-slate-400 text-xs"> 
          <span className="material-symbols-outlined 
text-base">security</span> 
          <span>Transactions are secure and encrypted.</span> 
        </div> 
        <button type="submit" className="w-full flex items-center 
justify-center rounded-lg h-12 px-6 bg-primary text-white text-base 
font-bold hover:bg-green-700 transition-colors"> 
          <span className="truncate">Review & Send</span> 
        </button> 
      </form> 
    </div> 
  ); 
}; 
 
// Receive Money Card Component 
const ReceiveMoneyCard = () => { 
    const [isCopied, setIsCopied] = useState(false); 
 
    const handleCopy = () => { 
        navigator.clipboard.writeText(USER_WALLET_ID).then(() => { 
            setIsCopied(true); 
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 
seconds 
        }); 
  
    }; 
 
    return ( 
        <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-6 h-full flex flex-col"> 
            <h2 className="text-secondary dark:text-white text-xl font-bold 
leading-tight tracking-[-0.015em] mb-6">Receive Money</h2> 
            <div className="flex-grow flex flex-col items-center 
justify-center text-center gap-4"> 
                <div className="bg-white p-3 rounded-lg border 
border-slate-200 dark:border-slate-700"> 
                    <img alt="QR Code" className="w-40 h-40" 
src={USER_QR_CODE_URL} /> 
                </div> 
                <div className="w-full"> 
                    <p className="text-slate-500 dark:text-slate-400 
text-sm">Your UniSpace ID</p> 
                    <div className="relative mt-1"> 
                        <input 
                            className="form-input w-full text-center rounded-lg 
border-slate-300 dark:border-slate-600 bg-background-light 
dark:bg-slate-800 text-secondary dark:text-white pr-10" 
                            readOnly 
                            type="text" 
                            value={USER_WALLET_ID} 
                        /> 
                        <button onClick={handleCopy} className="absolute 
right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 
hover:text-primary"> 
                            <span 
className="material-symbols-outlined">{isCopied ? 'check' : 
'content_copy'}</span> 
                        </button> 
                    </div> 
                </div> 
            </div> 
            <div className="flex gap-3 mt-6"> 
  
                <button className="flex-1 flex items-center justify-center 
gap-2 rounded-lg h-10 px-4 bg-background-light dark:bg-slate-700 
text-secondary dark:text-white text-sm font-medium hover:bg-slate-200 
dark:hover:bg-slate-600 transition-colors"> 
                    <span className="material-symbols-outlined 
text-lg">share</span> 
                    <span>Share</span> 
                </button> 
                <button className="flex-1 flex items-center justify-center 
gap-2 rounded-lg h-10 px-4 bg-background-light dark:bg-slate-700 
text-secondary dark:text-white text-sm font-medium hover:bg-slate-200 
dark:hover-bg-slate-600 transition-colors"> 
                    <span className="material-symbols-outlined 
text-lg">download</span> 
                    <span>Download</span> 
                </button> 
            </div> 
        </div> 
    ); 
} 
 
// --- Main Page Component --- 
function WalletPage() { 
  const [balance, setBalance] = useState(15000); 
  const { darkMode, toggleTheme } = useTheme();
 
  const handleSendMoney = (amount) => { 
    if (balance >= amount) { 
      setBalance(balance - amount); 
      alert(`Successfully sent ₦${amount.toLocaleString()}!`); 
    } else { 
      alert("Insufficient balance."); 
    } 
  }; 
   
  return ( 
    <div className="bg-background-light dark:bg-background-dark 
font-display text-secondary dark:text-slate-200 min-h-screen"> 
  
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => toggleTheme()}
          className="flex items-center justify-center size-12 rounded-full bg-white dark:bg-gray-800 shadow-md text-slate-700 dark:text-slate-200"
          aria-label="Toggle dark mode"
        >
          <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      <div className="relative flex h-auto w-full flex-col"> 
        <AppHeader /> 
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8"> 
          <div className="flex flex-col max-w-7xl mx-auto"> 
            <div className="flex flex-col sm:flex-row sm:items-center 
sm:justify-between mb-6"> 
              <h1 className="text-secondary dark:text-white tracking-light 
text-[32px] font-bold leading-tight text-left"> 
                Send & Receive Money 
              </h1> 
              <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-4 mt-4 sm:mt-0 text-center"> 
                <p className="text-slate-500 dark:text-slate-400 text-sm 
font-normal leading-normal"> 
                  Available Balance 
                </p> 
                <p className="text-primary text-2xl font-semibold 
leading-tight"> 
                  ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 
2, maximumFractionDigits: 2 })} 
                </p> 
              </div> 
            </div> 
 
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8"> 
              <div className="lg:col-span-3"> 
                <SendMoneyForm onSend={handleSendMoney} /> 
              </div> 
              <div className="lg:col-span-2"> 
                <ReceiveMoneyCard /> 
              </div> 
            </div> 
          </div> 
        </main> 
      </div> 
    </div> 
  ); 
 
 
} 
export default WalletPage; 