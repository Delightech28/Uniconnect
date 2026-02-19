import React from 'react';
import AppHeader from './AppHeader';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';

const TermsOfServicePage = () => {
  // Navigation links data to keep the sidebar clean
  const navLinks = [
    { id: "introduction", label: "1. Introduction" },
    { id: "user-responsibilities", label: "2. User Responsibilities" },
    { id: "privacy-policy", label: "3. Privacy Policy" },
    { id: "marketplace-rules", label: "4. Marketplace Rules" },
    { id: "wallet-terms", label: "5. UniWallet Terms" },
    { id: "disclaimers", label: "6. Disclaimers" },
  ];

  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="relative flex w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display min-h-screen">
      {/* 
        Injecting custom styles for smooth scrolling and icon settings. 
        In a real app, 'html { scroll-behavior: smooth }' is usually in global.css 
      */}
      <style>
        {`
          html {
            scroll-behavior: smooth;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}
      </style>

      <div className="layout-container flex flex-col w-full">
        {/* Shared AppHeader */}
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

        {/* Main Content */}
        <main className="px-4 sm:px-6 md:px-10 lg:px-20 flex flex-1 justify-center py-8 w-full overflow-y-auto">
          <div className="layout-content-container flex flex-col w-full gap-8">
            
            {/* Title Block */}
            <div className="flex flex-col items-center gap-4 text-center py-10">
              <h1 className="text-slate-900 dark:text-slate-50 text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em]">Terms of Service</h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl">Last Updated: December 10, 2025</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Sidebar Navigation - scrollable on mobile, sticky on desktop */}
              <aside className="lg:w-1/4 lg:sticky lg:top-20 h-fit order-2 lg:order-1">
                <nav className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Table of Contents</h3>
                  {navLinks.map((link) => (
                    <a 
                      key={link.id}
                      className="text-slate-600 dark:text-slate-400 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary py-2 px-3 rounded-md transition-colors font-medium" 
                      href={`#${link.id}`}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </aside>

              {/* Content Sections */}
              <div className="lg:w-3/4 flex flex-col gap-8 lg:gap-10 order-1 lg:order-2">
                <section className="space-y-4" id="introduction">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2">1. Introduction</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Welcome to UniSpace. These Terms of Service ("Terms") govern your use of the UniSpace platform, including our website, applications, and services. By accessing or using UniSpace, you agree to be bound by these Terms. Our platform provides a digital ecosystem for Nigerian university students, integrating commerce, collaborative learning, and community engagement. All users, including guests, have access to UniWallet, the marketplace, and Study Zone features. Verified students gain additional access to post on the CampusFeed.</p>
                </section>

                <section className="space-y-4" id="user-responsibilities">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2">2. User Responsibilities</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">You agree to use UniSpace responsibly and in compliance with all applicable laws. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree not to engage in any of the following prohibited activities:</p>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 pl-4">
                    <li>Impersonating another person or entity.</li>
                    <li>Using the platform for any illegal or unauthorized purpose.</li>
                    <li>Posting content that is hateful, defamatory, obscene, or discriminatory.</li>
                    <li>Interfering with the proper functioning of the UniSpace platform.</li>
                  </ul>
                </section>

                <section className="space-y-4" id="privacy-policy">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2">3. Privacy Policy</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Our Privacy Policy, which is incorporated into these Terms, describes how we collect, use, and share your personal information. By using UniSpace, you agree to the collection and use of information in accordance with our Privacy Policy. Please review it carefully to understand our practices.</p>
                </section>

                <section className="space-y-4" id="marketplace-rules">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2">4. Marketplace Rules</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">All users can buy and sell items on the UniMarket. You agree to provide accurate and complete information for all listings. Prohibited items include, but are not limited to, illegal goods, counterfeit products, and hazardous materials. UniSpace is not a party to any transaction between buyers and sellers and is not responsible for the quality, safety, or legality of items listed.</p>
                </section>

                <section className="space-y-4" id="wallet-terms">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2">5. UniWallet Terms</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">The UniWallet allows you to store funds for transactions on the platform. All users have full access. You are responsible for all transactions made through your wallet. We may impose limits on wallet transactions and are not liable for any unauthorized use of your UniWallet. Ensure your account information is secure at all times.</p>
                </section>

                <section className="space-y-4" id="disclaimers">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2">6. Disclaimers</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">UniSpace is provided "as is" without any warranties, express or implied. We do not guarantee that the platform will be error-free or uninterrupted. We are not responsible for any content posted by users or for the conduct of any user of the platform. Your use of UniSpace is at your own risk.</p>
                </section>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-center p-6 border-t border-slate-200 dark:border-slate-800 mt-10">
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <a className="hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary" href="#">Terms of Service</a>
            <a className="hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary" href="#">Privacy Policy</a>
            <p>© 2025 UniSpace. All rights reserved.</p>
          </div>
        </footer>
      <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};

export default TermsOfServicePage;


