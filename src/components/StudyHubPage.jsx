import React, { useState, useEffect } from 'react';
// --- Data for UI elements ---
const navLinks = [
{ name: 'Dashboard', href: '#', active: false },
{ name: 'Marketplace', href: '#', active: false },
{ name: 'Study Hub', href: '#', active: true },
{ name: 'CampusFeed', href: '#', active: false },
{ name: 'Wallet', href: '#', active: false },
];
const featureCards = [
{
icon: 'menu_book',
title: 'Available Quizzes',
subtitle: 'Ready-made quizzes',
description: 'Browse a library of quizzes on various subjects uploaded by the community.',
buttonText: 'Explore Quizzes',
isSpecial: false,
},
{
icon: 'timeline',
title: 'Learning Paths',
subtitle: 'Structured courses',
description: 'Follow curated learning paths to master topics step-by-step.',
buttonText: 'Discover Paths',
isSpecial: false,
},
{
icon: 'verified_user',
title: 'Unlock Full Potential',
subtitle: 'Become a verified student',

description: 'Verify your student status to save your progress and get detailed performance analytics.',
buttonText: 'Verify Now',
isSpecial: true,
},
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
<h2 className="text-xl font-bold leading-tight
tracking-tight">UniConnect</h2>
</div>
<nav className="hidden lg:flex items-center gap-6">
{navLinks.map(link => (
<a key={link.name} href={link.href} className={`text-sm
font-medium ${link.active ? 'text-primary font-bold' : 'text-secondary dark:text-white'}`}>{link.name}</a>
))}
</nav>
</div>

<div className="flex flex-1 justify-end items-center gap-3
sm:gap-6">
<button onClick={toggleDarkMode} className="flex
items-center justify-center rounded-lg h-10 w-10 bg-background-light
dark:bg-slate-800 text-secondary dark:text-white" aria-label="Toggle
dark mode">
<span className="material-symbols-outlined">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
<button className="flex items-center justify-center rounded-lg
h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary
dark:text-white">
<span
className="material-symbols-outlined">notifications</span>
</button>
<div className="relative">
<button onClick={() => setIsProfileOpen(!isProfileOpen)}><div
className="bg-center bg-no-repeat aspect-square bg-cover
rounded-full size-10" style={{backgroundImage:
'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI")'}}></div></button>
{isProfileOpen && (
<div className="absolute right-0 mt-2 w-48 bg-white
dark:bg-secondary rounded-md shadow-lg py-1 z-10">
<a href="#" className="block px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800">Profile</a>
<a href="#" className="block px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800">Settings</a>
<a href="#" className="block px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Logout</a>

</div>
)}
</div>
<div className="lg:hidden"><button onClick={() =>
setIsMenuOpen(!isMenuOpen)} className="text-secondary
dark:text-white"><span className="material-symbols-outlined
text-3xl">{isMenuOpen ? 'close' : 'menu'}</span></button></div>
</div>
</header>
);
}
const FeatureCard = ({ icon, title, subtitle, description, buttonText,
isSpecial = false }) => (
<div className={`bg-white dark:bg-secondary rounded-xl shadow-md
p-6 flex flex-col ${isSpecial ? 'border border-dashed border-primary/50 dark:border-primary/40' : ''}`}>
<div className="flex items-center gap-4">
<div className="flex-shrink-0 size-12 rounded-lg bg-primary/10
flex items-center justify-center">
<span className="material-symbols-outlined text-primary
text-3xl">{icon}</span>
</div>
<div>
<h3 className="text-lg font-bold text-secondary
dark:text-white">{title}</h3>
<p className="text-sm text-slate-500
dark:text-slate-400">{subtitle}</p>
</div>
</div>
<p className="text-secondary dark:text-white mt-4
flex-grow">{description}</p>
<button className={`mt-4 w-full flex items-center justify-center
rounded-lg h-10 px-4 font-bold ${isSpecial ? 'bg-primary text-white' :
'bg-primary/10 text-primary'}`}>
<span>{buttonText}</span>
</button>

</div>
);
// --- Main Page Component ---
const StudyHubPage = () => {
const [darkMode, setDarkMode] = useState(true);
useEffect(() => {
if (darkMode) document.documentElement.classList.add('dark');
else document.documentElement.classList.remove('dark');
}, [darkMode]);
return (
<div className="relative flex min-h-screen w-full flex-col">
<Header darkMode={darkMode} toggleDarkMode={() =>
setDarkMode(!darkMode)} />
<main className="flex-1 px-4 sm:px-10 py-8">
<div className="max-w-7xl mx-auto">
<div className="text-center">
<h1 className="text-secondary dark:text-white text-3xl
sm:text-4xl font-bold">Welcome to the Study Hub</h1>
<p className="text-slate-500 dark:text-slate-400 mt-2
max-w-2xl mx-auto">
Your central space for learning. Upload materials, generate
quizzes, and get answers instantly.
</p>
</div>
<a href="#" className="mt-10 bg-white dark:bg-secondary
rounded-xl shadow-md p-8 max-w-3xl mx-auto block hover:shadow-lg
hover:ring-2 hover:ring-primary/50 transition-all duration-300">
<div className="text-center">
<div className="flex justify-center items-center size-16
bg-primary/10 rounded-full mx-auto">
<span className="material-symbols-outlined text-primary
text-3xl">cloud_upload</span>
</div>

<h2 className="text-xl font-bold text-secondary dark:text-white
mt-4">Start by Uploading Your Study Material</h2>
<p className="text-slate-500 dark:text-slate-400 mt-1">Upload
a PDF or document to generate quizzes and ask questions.</p>
<div className="mt-6 flex items-center justify-center gap-2
w-full max-w-xs mx-auto rounded-lg h-12 px-6 bg-primary text-white
text-base font-bold">
<span
className="material-symbols-outlined">upload_file</span>
<span>Upload Document</span>
</div>
</div>
<div className="mt-8 border-t border-slate-200
dark:border-slate-700 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6
text-center">
<div className="flex flex-col items-center">
<div className="flex justify-center items-center size-12
bg-primary/10 rounded-full"><span
className="material-symbols-outlined text-primary
text-2xl">quiz</span></div>
<h3 className="text-lg font-semibold text-secondary
dark:text-white mt-3">AI Quiz Generation</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm
mt-1">Automatically create quizzes from your uploaded documents to
test your knowledge.</p>
</div>
<div className="flex flex-col items-center">
<div className="flex justify-center items-center size-12
bg-primary/10 rounded-full"><span
className="material-symbols-outlined text-primary
text-2xl">help_outline</span></div>
<h3 className="text-lg font-semibold text-secondary
dark:text-white mt-3">Ask Your Document</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm
mt-1">Get quick answers and summaries for specific questions about
your study material.</p>
</div>

</div>
</a>
<div className="mt-12">
<div className="flex justify-between items-center mb-6">
<h2 className="text-2xl font-bold text-secondary
dark:text-white">Explore &amp; Learn</h2>
<a className="text-primary font-medium text-sm
hover:underline" href="#">View All</a>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6">
{featureCards.map(card => (
<FeatureCard key={card.title} {...card} />
))}
</div>
</div>
</div>
</main>
</div>
);
};
export default StudyHubPage;