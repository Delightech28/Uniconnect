import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
// --- Data for the feature list (cleaner than hardcoding in JSX) ---
const guestFeatures = [
{
icon: 'account_balance_wallet',
text: 'Use your UniWallet for secure transactions',
enabled: true,
},
{
icon: 'storefront',
text: 'Full Marketplace access to buy and sell',
enabled: true,
},
{
icon: 'school',
text: 'Access all Study Zone features',
enabled: true,
},
{
icon: 'block',
text: 'Posting on CampusFeed is for verified students',
enabled: false, // This flag will control the styling
},
];
const GuestWelcomePage = () => {
const { darkMode, toggleTheme } = useTheme();
const navigate = useNavigate();
return (
<div className="relative flex min-h-screen w-full flex-col
overflow-x-hidden bg-background-light dark:bg-background-dark">
{/* Dark Mode Toggle - Added for interactivity demo */}
<div className="absolute top-4 right-4 z-10">
<button
onClick={() => toggleTheme()}
className="flex items-center justify-center size-12
rounded-full bg-white dark:bg-gray-800 shadow-md text-slate-700
dark:text-slate-200"
aria-label="Toggle dark mode"
>
<span className="material-symbols-outlined">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
</div>
<div className="flex flex-1 justify-center items-center px-4 py-5">
<div className="flex flex-col w-full max-w-md flex-1 bg-white
dark:bg-background-dark/50 shadow-lg rounded-xl p-6 md:p-8">
<div className="flex flex-col items-center gap-4 text-center">
<div className="flex h-16 w-16 items-center justify-center
rounded-full bg-primary/10 text-primary">
<span className="material-symbols-outlined
text-4xl">waving_hand</span>
</div>
<h1 className="text-slate-900 dark:text-white tracking-light
text-3xl font-bold leading-tight">
Welcome to UniSpace!
</h1>
<p className="text-slate-600 dark:text-slate-300 text-base
font-normal leading-normal">
You're now exploring as a guest. Here's what you can do with
your account.
</p>
</div>
<div className="flex flex-col gap-3 py-6">
{guestFeatures.map((feature, index) => {
const iconContainerClass = feature.enabled ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40' : 'text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-background-dark/70';
return (
<div key={index} className="flex items-center gap-4
bg-slate-50 dark:bg-background-dark/30 px-4 py-3 rounded-lg
min-h-14">
<div className={`flex items-center justify-center rounded-lg
shrink-0 size-10 ${iconContainerClass}`}>
<span
className="material-symbols-outlined">{feature.icon}</span>
</div>
<p className="text-slate-800 dark:text-slate-200 text-base
font-normal leading-normal flex-1">
{feature.text}
</p>
</div>
);
})}
</div>
<div className="flex flex-col gap-3 pt-2">
<button onClick={() => navigate('/guest-dashboard')} className="flex h-12 w-full items-center justify-center
rounded-lg bg-primary px-6 text-base font-semibold text-white
transition-colors hover:bg-primary/90 focus-visible:outline
focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-primary">
Continue as a Guest
</button>
<button className="flex h-12 w-full items-center justify-center
rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent
px-6 text-base font-semibold text-primary transition-colors
hover:bg-primary/10 dark:hover:bg-primary/10">
Verify to become a Student
</button>
</div>
      </div>
    </div>
    <Footer darkMode={darkMode} />
  </div>
);
};
export default GuestWelcomePage;


