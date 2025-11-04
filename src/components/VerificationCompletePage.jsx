import React, { useState, useEffect } from 'react';
// --- Data for the "What's Next?" section (cleaner than hardcoding) ---
const whatsNextFeatures = [
{
icon: 'storefront',
text: 'Access to the exclusive student market place',
},
{
icon: 'auto_awesome',
text: 'Full access to the AI-powered Study Zone section',
},
{
icon: 'feed',
text: 'Unlimited Access to the Campus Feed',
},
];
// --- Sub-component for each feature item ---
const FeatureItem = ({ icon, text }) => (
<div className="flex items-center gap-4">
<div className="text-primary flex items-center justify-center
rounded-lg bg-primary/20 shrink-0 size-10">
<span className="material-symbols-outlined">{icon}</span>
</div>
<p className="text-black dark:text-white text-base font-normal
leading-normal flex-1">
{text}
</p>
</div>
);
// --- Main Page Component ---
const VerificationCompletePage = () => {
const [darkMode, setDarkMode] = useState(false);
// Effect to toggle dark mode class on the html element
useEffect(() => {
const root = window.document.documentElement;
if (darkMode) {
root.classList.add('dark');
} else {
root.classList.remove('dark');
}
}, [darkMode]);
return (
<div className="relative flex min-h-screen w-full flex-col">
{/* Dark Mode Toggle - Added for interactivity demo */}
<div className="absolute top-4 right-4 z-10">
<button
onClick={() => setDarkMode(!darkMode)}
className="flex items-center justify-center size-10 rounded-full
bg-gray-100 dark:bg-gray-800 shadow-md"
aria-label="Toggle dark mode"
>
<span className="material-symbols-outlined">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
</div>
<header className="flex items-center justify-between
whitespace-nowrap border-b border-solid border-gray-200
dark:border-gray-700 px-6 sm:px-10 py-4">
<div className="flex items-center gap-4 text-black
dark:text-white">
<div className="size-6 text-primary">
<svg fill="currentColor" viewBox="0 0 48 48"
xmlns="http://www.w3.org/2000/svg">
<path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
</svg>
</div>
<h2 className="text-xl font-bold leading-tight
tracking-tight">UniConnect</h2>
</div>
</header>
<main className="flex flex-1 justify-center py-10 sm:py-20 px-4">
<div className="flex w-full max-w-2xl flex-col items-center gap-8
rounded-xl border border-gray-200 dark:border-gray-700
bg-background-light dark:bg-gray-900/50 p-6 sm:p-10 text-center
shadow-sm">
<div className="flex size-20 items-center justify-center
rounded-full bg-primary/20 text-primary">
<span className="material-symbols-outlined
!text-5xl">check_circle</span>
</div>
<div className="flex flex-col gap-3">
<p className="text-black dark:text-white text-3xl sm:text-4xl
font-black leading-tight tracking-tighter">
Congratulations, you're verified!
</p>
<p className="text-gray-600 dark:text-gray-300 text-base
font-normal leading-normal max-w-lg mx-auto">
You are now a verified UniConnect student. You've unlocked full
access to our digital ecosystem.
</p>
</div>
<div className="w-full border-t border-gray-200
dark:border-gray-700"></div>
<div className="flex w-full flex-col gap-4 text-left">
<h3 className="text-black dark:text-white text-lg font-bold
leading-tight tracking-tight">
What's Next?
</h3>
<div className="flex flex-col gap-3">
{whatsNextFeatures.map((feature) => (
<FeatureItem key={feature.icon} icon={feature.icon}
text={feature.text} />
))}
</div>
</div>
<button className="w-full sm:w-auto mt-4 px-8 py-3 rounded-lg
bg-primary text-white text-base font-bold leading-normal tracking-wide
transition-colors hover:bg-opacity-90 focus:outline-none focus:ring-2
focus:ring-primary focus:ring-offset-2
dark:focus:ring-offset-background-dark">
Explore UniConnect
</button>
</div>
</main>
<footer className="text-center py-6 px-4">
<p className="text-sm text-gray-500 dark:text-gray-400">
Need help?{' '}
<a className="text-primary font-medium hover:underline"
href="#">
Visit our Support Center
</a>
</p>
</footer>
</div>
);
};
export default VerificationCompletePage;