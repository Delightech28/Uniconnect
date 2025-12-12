import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';
// --- Data for UI elements (Makes JSX cleaner and easier to manage) ---
const navLinks = ['Dashboard', 'Marketplace', 'Study Hub', 'Wallet'];
const marketplaceItems = [
{
id: 1,
name: 'Nike Air Max 270',
status: 'Active',
statusColor: 'text-green-500',
price: '₦25,000',
imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB9mXk_qbIXJYUVxnWvbQg_bozBnGEKHRrM8v4t3KcQmZHd-FxDm81WKa7Sjga6pBF5VoxZvEEjD7WxHkR-DpYU-kBAS_JQ3aZOjZDUbu09QoakvbG-jN-BHaJPSPzt0JmZ7cKqJF3_8xN3ykop63r1dxxeepW0l6UN313C0kraBIyJwgjjuR6zyRJNmmuyswyUC0MXK2t5hBQwgo56w1dZUdskGE0AkKY2pzcLLwQC0Q8r_QgnJdJCVMPqCCKl5ZzE8Oc34XLJWDCt',
},
{
id: 2,
name: 'Beats by Dre Headset',
status: 'Sold',
statusColor: 'text-red-500',
price: '₦18,500',
imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuAt2vO4nW3jgysnaq7rVPGh4kxysZPvVF0dgOq5fmj6WjyVAPR1e31WNOWNAllcIDOi5id5virHcgCS2BhAkBV6ga5JIKGnUCh7H3rOM2p9xc1F4hCq-O2Qauvaj6OqGfw7tAZUfsijY9JOu_ngQ8weiLKe0av6rUq92H0XLQdUAU3Pc7dBkeoaqTMTa86L9gxOt9dkQexjL-w7HItHs_vm9o31WwXgq33PfWVg41_O4_Ke6OmFSG83_GAK54tKaGqvADnHvh6JDNj4',
},

];
// --- Sub-components for better organization ---
const Logo = () => (
<div className="flex items-center gap-4 text-secondary
dark:text-white">
<div className="size-6 text-primary">
<svg fill="currentColor" viewBox="0 0 48 48"
xmlns="http://www.w3.org/2000/svg">
<path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
</svg>
</div>
<h2 className="text-xl font-bold leading-tight
tracking-tight">UniSpace</h2>
</div>
);
const ProgressCircle = ({ percentage }) => (
<div className="relative size-32">
<svg className="size-full" width="36" height="36" viewBox="0 0 36
36" xmlns="http://www.w3.org/2000/svg">
<circle
className="stroke-current text-background-light
dark:text-slate-700"
cx="18" cy="18" r="16" strokeWidth="3" fill="none"
></circle>
<circle
className="stroke-current text-primary"
cx="18" cy="18" r="16" fill="none"
strokeWidth="3"
strokeDasharray={`${percentage} 100`}
strokeDashoffset="25"
></circle>
</svg>

<div className="absolute inset-0 flex items-center justify-center">
<span className="text-2xl font-bold
text-primary">{percentage}%</span>
</div>
</div>
);
// --- Main Dashboard Component ---
const GuestDashboard = () => {
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isProfileOpen, setIsProfileOpen] = useState(false);
const [marketplaceTab, setMarketplaceTab] = useState('listings');
const { darkMode, toggleTheme } = useTheme();
return (
<div className="relative flex min-h-screen w-full flex-col">
{/* --- Header --- */}
<header className="sticky top-0 z-20 flex items-center
justify-between whitespace-nowrap border-b border-solid
border-slate-200 dark:border-slate-700 px-4 sm:px-10 py-3 bg-white
dark:bg-secondary">
<div className="flex items-center gap-4 lg:gap-8">
<Logo />
{/* Desktop Navigation */}
<nav className="hidden lg:flex items-center gap-6">
{navLinks.map((link) => (
<a key={link} className="text-secondary dark:text-white
text-sm font-medium leading-normal" href="#">{link}</a>

))}
</nav>
</div>
<div className="flex flex-1 justify-end items-center gap-3
sm:gap-6">
<label className="hidden sm:flex flex-col min-w-40 !h-10
max-w-64">
<div className="flex w-full flex-1 items-stretch rounded-lg
h-full">
<div className="text-slate-500 flex items-center justify-center
pl-4 rounded-l-lg bg-background-light dark:bg-slate-800">
<span
className="material-symbols-outlined">search</span>
</div>
<input
className="form-input w-full min-w-0 flex-1 rounded-r-lg
text-secondary dark:text-white focus:outline-none focus:ring-0
border-none bg-background-light dark:bg-slate-800 h-full
placeholder:text-slate-500 px-4 text-base"
placeholder="Search"
/>
</div>
</label>
{/* --- Header Icons --- */}
<button onClick={() => toggleTheme()}
className="flex cursor-pointer items-center justify-center rounded-lg
h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary
dark:text-white" aria-label="Toggle dark mode">
<span className="material-symbols-outlined">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
<button className="flex cursor-pointer items-center justify-center
rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800
text-secondary dark:text-white">

<span
className="material-symbols-outlined">notifications</span>
</button>
{/* --- Profile Dropdown --- */}
<div className="relative">
<button onClick={() => setIsProfileOpen(!isProfileOpen)}
className="block">
<div
className="bg-center bg-no-repeat aspect-square bg-cover
rounded-full size-10"
style={{ backgroundImage:
'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI")' }}
></div>
</button>
{isProfileOpen && (
<div className="absolute right-0 mt-2 w-48 bg-white
dark:bg-secondary rounded-md shadow-lg py-1">
<a className="block px-4 py-2 text-sm text-secondary
dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
href="#">Profile</a>
<Link className="block px-4 py-2 text-sm text-secondary
dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
to="/settings">Settings</Link>
<a className="block px-4 py-2 text-sm text-secondary
dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
href="#">Logout</a>
</div>
)}
</div>
{/* --- Mobile Menu Button --- */}

<div className="lg:hidden">
<button onClick={() => setIsMenuOpen(!isMenuOpen)}
className="text-secondary dark:text-white">
<span className="material-symbols-outlined
text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
</button>
</div>
</div>
</header>
{/* --- Mobile Menu --- */}
{isMenuOpen && (
<div className="lg:hidden bg-white dark:bg-secondary border-b
border-slate-200 dark:border-slate-700 p-4">
{navLinks.map((link) => (
<a key={link} href="#" className="block py-2 px-4
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800 rounded">{link}</a>
))}
</div>
)}
{/* --- Main Content --- */}
<main className="flex-1 px-4 sm:px-10 py-8">
<div className="flex flex-col max-w-7xl mx-auto">
<h1 className="text-secondary dark:text-white tracking-light
text-2xl sm:text-3xl font-bold leading-tight px-4 text-left pb-6">
Good morning, Adekunle!
</h1>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
{/* --- Left Column --- */}
<div className="lg:col-span-1 flex flex-col gap-6">
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6 flex flex-col gap-4">
<p className="text-secondary dark:text-white text-xl
font-bold">UniWallet</p>
<div className="text-center">
<p className="text-slate-500 dark:text-slate-400
text-sm">Available Balance</p>
<p className="text-secondary dark:text-white text-2xl
font-semibold">₦15,000.00</p>
</div>
<div className="flex justify-center gap-3 mt-2">
<button className="flex-1 rounded-lg h-10 px-4 bg-primary
text-white">Add Funds</button>
<button className="flex-1 rounded-lg h-10 px-4
bg-background-light dark:bg-slate-700 text-secondary
dark:text-white">Send Money</button>
</div>
<a className="text-center text-primary text-sm font-medium
mt-2" href="#">View full transaction history</a>
</div>
</div>
{/* --- Right Column --- */}
<div className="lg:col-span-2 flex flex-col gap-6">
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6 flex-1">
<p className="text-secondary dark:text-white text-xl font-bold
mb-4">Recent Marketplace Activity</p>
<div className="flex border-b border-slate-200
dark:border-slate-700">
<button onClick={() => setMarketplaceTab('listings')}
className={`py-2 px-4 text-sm font-medium ${marketplaceTab ===
'listings' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-white'}`}>My
Listings
</button>
<button onClick={() => setMarketplaceTab('purchases')}
className={`py-2 px-4 text-sm font-medium ${marketplaceTab ===
'purchases' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-white'}`}>My
Purchases
</button>
</div>
<div className="mt-4 space-y-4">
{marketplaceTab === 'listings' ? (
marketplaceItems.map((item) => (
<div key={item.id} className="flex items-center gap-4">
<img className="w-16 h-16 rounded-lg object-cover"
alt={item.name} src={item.imageUrl} />
<div className="flex-1">
<p className="font-semibold text-secondary
dark:text-white">{item.name}</p>
<p className="text-sm text-slate-500
dark:text-slate-400">Status: <span
className={item.statusColor}>{item.status}</span></p>
</div>
<p className="font-bold text-secondary
dark:text-white">{item.price}</p>
</div>
))
) : (
<p className="text-slate-500 dark:text-slate-400 p-4
text-center">No purchases found.</p>

)}
</div>
<a className="block text-center text-primary text-sm
font-medium mt-4" href="#">View All Listings</a>
</div>
</div>
</div>
</div>
</main>
</div>
);
};
export default GuestDashboard;