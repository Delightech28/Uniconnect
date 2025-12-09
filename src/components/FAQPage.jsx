import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

const FAQPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Data for Categories
  const categories = [
    { name: "All", active: true },
    { name: "UniWallet", active: false },
    { name: "UniMarket", active: false },
    { name: "StudyHub", active: false },
    { name: "Verification", active: false },
  ];

  // Data for FAQs
  const faqs = [
    {
      question: "How do I create an account?",
      answer: "To create an account, click the 'Sign Up' button on the homepage and follow the on-screen instructions. You will need to provide a valid email address and create a password. All users get instant access to UniWallet, UniMarket, and StudyHub."
    },
    {
      question: "How do I add funds to my UniWallet?",
      answer: "Navigate to the UniWallet section from the main dashboard. Click on 'Add Funds' and choose your preferred payment method, such as a bank transfer or card payment, to securely top up your wallet."
    },
    {
      question: "How can I list an item for sale on UniMarket?",
      answer: "In the UniMarket section, click the 'Sell an Item' button. You'll be prompted to upload photos, add a title and description, set a price, and choose a category. Once submitted, your listing will be visible to other students."
    },
    {
      question: "How do I join a study group in the StudyHub?",
      answer: "Go to the StudyHub and browse existing study groups by course or topic. Click on a group you're interested in and hit the 'Join Group' button. You can also create your own study group and invite others to join."
    },
    {
      question: "What is the process for student verification?",
      answer: "To get verified, go to your profile settings and find the 'Verification' section. You'll need to submit a valid student ID or other proof of enrollment. Our team will review it, and once approved, you'll gain access to exclusive features like posting on the CampusFeed."
    }
  ];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display">
      {/* Inline style for the Material Icon settings specifically */}
      <style>
        {`
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}
      </style>

      <div className="layout-container flex h-full grow flex-col">
        {/* Shared AppHeader */}
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

        {/* Main Content */}
        <main className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-4xl flex-1 gap-8">
            
            {/* Title Section */}
            <div className="flex flex-col items-center gap-4 text-center py-10">
              <p className="text-slate-900 dark:text-slate-50 text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em]">Help Center</p>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl">Find answers to your questions about UniConnect, from setting up your wallet to collaborating in study groups.</p>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3">
              <label className="flex flex-col min-w-40 h-14 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div className="text-slate-500 dark:text-slate-400 flex bg-slate-100 dark:bg-slate-800 items-center justify-center pl-4 rounded-l-lg border-r-0">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-slate-900 dark:text-slate-50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-slate-100 dark:bg-slate-800 h-full placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 pl-2 text-base font-normal leading-normal" 
                    placeholder="What can we help you with?" 
                  />
                </div>
              </label>
            </div>

            {/* Categories */}
            <div className="flex gap-3 p-3 flex-wrap justify-center">
              {categories.map((cat, index) => (
                <div 
                  key={index}
                  className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-lg pl-4 pr-4 ${
                    cat.active 
                      ? "bg-primary text-white" 
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <p className={`text-sm font-medium leading-normal ${!cat.active && "text-slate-700 dark:text-slate-300"}`}>
                    {cat.name}
                  </p>
                </div>
              ))}
            </div>

            {/* FAQ Accordion */}
            <div className="flex flex-col p-4">
              {faqs.map((faq, index) => (
                <details 
                  key={index} 
                  className="flex flex-col border-t border-slate-200 dark:border-slate-800 py-2 group" 
                  open={index === 0} // Open the first one by default to match HTML
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-6 py-4">
                    <p className="text-slate-800 dark:text-slate-200 text-base font-medium leading-normal">{faq.question}</p>
                    <div className="text-slate-600 dark:text-slate-400 transition-transform duration-200 group-open:rotate-180">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </summary>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal pb-2 max-w-3xl">
                    {faq.answer}
                  </p>
                </details>
              ))}
              {/* Bottom border for the list */}
              <div className="border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Support CTA */}
            <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-8 my-10 text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Still need help?</h3>
              <p className="text-slate-600 dark:text-slate-400">Can't find the answer you're looking for? Don't worry, our support team is here to help.</p>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] mt-4 hover:bg-primary/90 transition-colors">
                <span className="truncate">Contact Support</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-center p-6 border-t border-slate-200 dark:border-slate-800 mt-10">
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <a className="hover:text-primary" href="#">Terms of Service</a>
            <a className="hover:text-primary" href="#">Privacy Policy</a>
            <p>© 2024 UniConnect. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default FAQPage;