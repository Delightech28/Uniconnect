import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';
import AppHeader from './AppHeader';
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
const [marketplaceTab, setMarketplaceTab] = useState('listings');
const { darkMode, toggleTheme } = useTheme();
return (
<div className="relative flex min-h-screen w-full flex-col">
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
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