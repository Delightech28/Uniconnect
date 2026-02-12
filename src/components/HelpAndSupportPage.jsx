import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';
// --- Data for FAQs and Contact Methods ---
const faqs = [
{
question: 'Why did my verification fail?',
answer: 'Verification can fail for several reasons, such as a blurry or unreadable document, an expired ID, or a mismatch between the name on your document and your profile. Please return to the previous page for a detailed list of common issues.',
},
{
question: 'What documents are accepted?',
answer: 'We accept valid, unexpired student ID cards and official university registration documents. Ensure the document clearly shows your full name, your university, and the current academic session.',
},
{
question: 'How long does verification take?',
answer: 'Verification is typically an automated process that takes only a few minutes. If manual review is required, it may take up to 24 hours. We will notify you via email as soon as your status is updated.',
},
];
const contactMethods = [
{ icon: 'email', text: 'unispaceinnovationhub@gmail.com', href:
'mailto:unispaceinnovationhub@gmail.com' },
{ icon: 'call', text: '+234 123 456 789', href: 'tel:+234123456789' }
];
// --- Sub-components for better organization ---
const FAQItem = ({ question, answer }) => {
const [isOpen, setIsOpen] = useState(false);
return (
<>
<div
className="flex items-center justify-between cursor-pointer
list-none text-black dark:text-white font-semibold"
onClick={() => setIsOpen(!isOpen)}
aria-expanded={isOpen}
>
<span>{question}</span>
<span className={`material-symbols-outlined transition-transform
duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}>
expand_more
</span>
</div>
{isOpen && (
<p className="text-gray-600 dark:text-gray-400 text-base
font-normal leading-normal mt-2">
{answer}
</p>
)}
</>
);
};
const ContactCard = ({ icon, text, href }) => (
<a
className="flex items-center gap-3 rounded-lg bg-gray-100
dark:bg-gray-700 px-4 py-3 text-black dark:text-white hover:bg-gray-200
dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
href={href}
>
<span className="material-symbols-outlined">{icon}</span>
<span className="text-base font-semibold">{text}</span>
</a>
)
// --- Main Page Component ---
const HelpAndSupportPage = () => {
const { darkMode, toggleTheme } = useTheme();
const navigate = useNavigate();
return (
<div className="relative flex min-h-screen w-full flex-col">
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
<main className="flex flex-1 justify-center py-10 sm:py-20 px-4">
<div className="flex w-full max-w-3xl flex-col items-center gap-8
rounded-xl bg-background-light dark:bg-gray-900/50 p-6 sm:p-10">
<div className="flex flex-col gap-3 text-center">
<p className="text-black dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl
font-black leading-tight tracking-tighter">
Help &amp; Support
</p>
<p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-base
font-normal leading-normal max-w-xl mx-auto">
Having trouble with verification? Find answers to common
questions below or contact our support team for assistance.
</p>
</div>
<div className="w-full flex flex-col gap-8">
<div className="w-full rounded-lg border border-gray-200
dark:border-gray-700 p-6">
<h3 className="text-black dark:text-white text-xl font-bold
leading-tight tracking-tight mb-4">
Frequently Asked Questions
</h3>
<div className="flex flex-col gap-4">
{faqs.map((faq, index) => (
<React.Fragment key={index}>
<FAQItem question={faq.question} answer={faq.answer} />
{index < faqs.length - 1 && <hr
className="border-gray-200 dark:border-gray-700" />}
</React.Fragment>
))}
</div>
</div>
<div className="w-full rounded-lg border border-gray-200
dark:border-gray-700 p-6">
<h3 className="text-black dark:text-white text-xl font-bold
leading-tight tracking-tight mb-4">
Contact Support
</h3>
<p className="text-gray-600 dark:text-gray-300 text-base
font-normal leading-normal mb-4">
If you've tried uploading again and still face issues, our
support team is here to help. Reach out to us with your username and a
clear description of the problem.
</p>
<div className="flex flex-col sm:flex-row gap-4">
{contactMethods.map(method => <ContactCard
key={method.icon} {...method}/>)}
</div>
</div>
</div>
<div className="flex w-full flex-col sm:flex-row items-center
gap-4 mt-6">
<button 
onClick={() => navigate('/faq')}
className="w-full sm:w-auto px-8 py-3 rounded-lg
bg-primary text-white text-base font-bold tracking-wide transition-colors
hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary
focus:ring-offset-2 dark:focus:ring-offset-background-dark flex-1">
View Full FAQ
</button>
</div>
</div>
</main>
<Footer darkMode={darkMode} />
</div>
);
};
export default HelpAndSupportPage;


