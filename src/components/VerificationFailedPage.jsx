import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
// --- Data for the failure reasons list (cleaner than hardcoding) ---
const failureReasons = [
{
title: 'Blurry or Unclear Image:',
description: 'Ensure your document is clear, well-lit, and all text is readable.',
},
{
title: 'Incorrect or Expired Document:',
description: 'Make sure you have uploaded a valid, current student ID card or official university document.',
},
{
title: 'Information Mismatch:',
description: 'The name on your document must match the name on your UniConnect profile.',
},
];
// --- Sub-component for each reason item ---
const ReasonItem = ({ title, description }) => (
<div className="flex items-start gap-4">
<div className="text-error flex items-center justify-center shrink-0
size-6">
<span className="material-symbols-outlined">close</span>
</div>
<p className="text-black dark:text-white text-base font-normal
leading-normal flex-1">
<strong>{title}</strong> {description}
</p>
</div>
);
// --- Main Page Component ---
const VerificationFailedPage = () => {
const { darkMode, toggleTheme } = useTheme();
return (
<div className="relative flex min-h-screen w-full flex-col">
{/* Dark Mode Toggle - Added for interactivity demo */}
<div className="absolute top-4 right-4 z-10">
<button
onClick={() => toggleTheme()}
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
rounded-full bg-error/20 text-error">
<span className="material-symbols-outlined
!text-5xl">error</span>
</div>
<div className="flex flex-col gap-3">
<p className="text-black dark:text-white text-3xl sm:text-4xl
font-black leading-tight tracking-tighter">
Verification Failed
</p>
<p className="text-gray-600 dark:text-gray-300 text-base
font-normal leading-normal max-w-lg mx-auto">
We were unable to verify your student status with the
documents you provided. Please review the common issues below and
try again.
</p>
</div>
<div className="w-full rounded-lg bg-primary/10
dark:bg-primary/20 p-6 text-left">
<h3 className="text-black dark:text-white text-lg font-bold
leading-tight tracking-tight mb-4">
Common Reasons for Failure
</h3>
<div className="flex flex-col gap-3">
{failureReasons.map((reason, index) => (
<ReasonItem key={index} title={reason.title}
description={reason.description} />
))}
</div>
</div>
<div className="flex w-full flex-col sm:flex-row items-center
gap-4 mt-4">
<button className="w-full sm:w-auto px-8 py-3 rounded-lg
bg-primary text-white text-base font-bold leading-normal tracking-wide
transition-colors hover:bg-opacity-90 focus:outline-none focus:ring-2
focus:ring-primary focus:ring-offset-2
dark:focus:ring-offset-background-dark flex-1">
Upload Documents Again
</button>
<button className="w-full sm:w-auto px-8 py-3 rounded-lg
bg-gray-100 dark:bg-gray-700 text-black dark:text-white text-base
font-bold leading-normal tracking-wide transition-colors
hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none
focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500
focus:ring-offset-2 dark:focus:ring-offset-background-dark">
Get Help
</button>
</div>
</div>
</main>
</div>
);
};
export default VerificationFailedPage;