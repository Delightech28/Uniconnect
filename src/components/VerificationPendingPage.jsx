import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
// --- Data for Links and Icons (Cleaner than hardcoding in JSX) ---
const footerLinks = [
{ name: 'Terms of Service', href: '#' },
{ name: 'Privacy Policy', href: '#' },
{ name: 'Contact Us', href: '#' },
];
const socialIcons = [
{
name: 'Facebook',
href: '#',
icon: (
<svg fill="none" height="24" stroke="currentColor"
strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
viewBox="0 0 24 24" width="24"><path d="M18 2h-3a5 5 0 0 0-5
5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
),
},
{
name: 'Twitter',
href: '#',
icon: (
<svg fill="none" height="24" stroke="currentColor"
strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
viewBox="0 0 24 24" width="24"><path d="M23 3a10.9 10.9 0 0 1-3.14
1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64
11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0
23 3z"></path></svg>
),
},
{
name: 'Instagram',
href: '#',
icon: (
<svg fill="none" height="24" stroke="currentColor"
strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
viewBox="0 0 24 24" width="24"><rect height="20" rx="5" ry="5"
width="20" x="2" y="2"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4
4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5"
y2="6.5"></line></svg>
),
},
{
name: 'LinkedIn',
href: '#',
icon: (
<svg fill="none" height="24" stroke="currentColor"
strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
viewBox="0 0 24 24" width="24"><path d="M16 8a6 6 0 0 1 6
6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1
6-6z"></path><rect height="12" width="4" x="2" y="9"></rect><circle
cx="4" cy="4" r="2"></circle></svg>
),
},
];
// --- Sub-components for better organization ---
const Header = ({ darkMode, toggleDarkMode }) => (
<header className="flex items-center justify-between
whitespace-nowrap px-6 py-4 md:px-10 md:py-5 bg-content-light
dark:bg-content-dark rounded-xl border border-border-light
dark:border-border-dark">
<div className="flex items-center gap-4">
<div className="text-primary size-7">
<svg fill="currentColor" viewBox="0 0 48 48"
xmlns="http://www.w3.org/2000/svg">
<path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
</svg>
</div>
<h2 className="text-text-primary-light dark:text-text-primary-dark
text-xl font-bold tracking-tight">UniConnect</h2>
</div>
<button
onClick={toggleDarkMode}
className="flex cursor-pointer items-center justify-center
rounded-full h-10 w-10 bg-background-light dark:bg-background-dark
text-text-primary-light dark:text-text-primary-dark"
aria-label="Toggle dark mode"
>
<span className="material-symbols-outlined text-2xl">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
</header>
);
const Footer = () => (
<footer className="flex flex-col gap-8 px-5 py-10 text-center">
<div className="flex flex-wrap items-center justify-center gap-x-8
gap-y-4">
{footerLinks.map((link) => (
<a key={link.name} href={link.href}
className="text-text-secondary-light dark:text-text-secondary-dark
hover:text-primary dark:hover:text-primary text-base">
{link.name}
</a>
))}
</div>
<div className="flex flex-wrap justify-center gap-6">
{socialIcons.map((social) => (
<a key={social.name} href={social.href}
className="text-text-secondary-light dark:text-text-secondary-dark
hover:text-primary dark:hover:text-primary">
{social.icon}
</a>
))}
</div>
<p className="text-text-secondary-light
dark:text-text-secondary-dark text-sm">
© 2024 UniConnect. All rights reserved.
</p>
</footer>
);
// --- Main Page Component ---
const VerificationPendingPage = () => {
const navigate = useNavigate();
const { darkMode, toggleTheme } = useTheme();
const handleDashboardClick = () => navigate('/dashboard');
return (
<div className="relative flex min-h-screen w-full flex-col">
<div className="flex flex-1 justify-center py-5 px-4 sm:px-8
md:px-20 lg:px-40">
<div className="flex flex-col max-w-[960px] flex-1">
<Header darkMode={darkMode}
toggleDarkMode={toggleTheme} />
<main className="flex-grow flex items-center justify-center
py-10">
<div className="flex flex-col items-center gap-8 w-full max-w-lg
bg-content-light dark:bg-content-dark rounded-xl border
border-border-light dark:border-border-dark p-6 sm:p-8 md:p-12
text-center">
<div className="flex flex-col items-center gap-5">
<div className="flex h-20 w-20 items-center justify-center
rounded-full bg-primary/20 text-primary">
<span className="material-symbols-outlined !text-5xl
animate-spin" style={{ animationDuration: '2s' }}>hourglass_top</span>
</div>
<div className="flex max-w-[480px] flex-col items-center
gap-3">
<p className="text-text-primary-light
dark:text-text-primary-dark text-2xl font-bold tracking-tight">
Verification in Progress
</p>
<p className="text-text-secondary-light
dark:text-text-secondary-dark text-base leading-relaxed">
Thank you for submitting your document. Our team is
currently reviewing it. This usually takes 24-48 hours. We'll notify you via
email once the process is complete.
</p>
</div>
<button 
onClick={handleDashboardClick}
className="flex min-w-[84px] cursor-pointer
items-center justify-center rounded-lg h-12 px-6 bg-primary text-white
text-base font-bold w-full sm:w-auto mt-3 hover:bg-primary/90">
Go to Dashboard
</button>
</div>
<div className="flex justify-center w-full">
<div className="flex flex-col sm:flex-row flex-1 gap-4
flex-wrap max-w-[480px] justify-center pt-4 border-t border-border-light
dark:border-border-dark">
<button className="flex cursor-pointer items-center
justify-center rounded-lg h-10 px-4 text-text-secondary-light 
dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary
text-sm font-bold grow">
Contact Support
</button>
<button className="flex cursor-pointer items-center
justify-center rounded-lg h-10 px-4 text-text-secondary-light
dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary
text-sm font-bold grow">
Read our Verification FAQ
</button>
</div>
</div>
</div>
</main>
<Footer />
</div>
</div>
</div>
);
};
export default VerificationPendingPage;