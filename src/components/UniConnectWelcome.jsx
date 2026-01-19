 import React, { useState } from 'react';
import { Menu, X, ArrowRight, ExternalLink } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';

const UniConnectWelcome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { darkMode } = useTheme();

  // Custom colors from the original HTML
  const colors = {
    primary: "#07bc0c",
    bgLight: "#c2ebc2",
    bgDark: "#102210"
  };

  return (
    <div className="font-sans min-h-screen w-full flex flex-col bg-[#c2ebc2] dark:bg-[#102210] text-slate-900 dark:text-slate-50 transition-colors duration-300">
      
      {/* Wrapper to center content */}
      <div className="flex flex-col min-h-screen">
        
        {/* --- Header --- */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-[#c2ebc2]/80 dark:bg-[#102210]/90 backdrop-blur-md">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 lg:px-20 py-3 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-0">
              <img src="/logo/green_whitebg.png" alt="UniSpace" className="h-12 w-12 mb-1 object-contain" />
              <h2 className="text-lg font-bold leading-tight tracking-tight -ml-3">niSpace</h2>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm font-bold text-[#07bc0c]">Home</a>
                {['Dashboard', 'Explore', 'Referrals'].map((item) => (
                  <a key={item} href="#" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-[#07bc0c] transition-colors">
                    {item}
                  </a>
                ))}
              </div>
              {/* Profile Avatar */}
              <div 
                className="w-10 h-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdtuOE7T050iiDkaOzKuaa9iw64cL-uDwxuq08zx665j3cK-0ekFxdGeuYZHf2j0dsAs8T1Z-v9xRjTlVuC3NW5VN-7HL_T7siazt0zUCEjX1oGXMfMfAGtFc3UFt5vxbXL30tEim2q-_XMe_0xqfYkH8J4QrQfK-JRYKuFP691QQ2GphweSHpYu-Ze2oGrCPESaDYk-8A_7kVTkooAD8GtQJ5NBHTvwtFzIiKPISJc9sNLtLMaZS4eNkP0VFWsQL0YD1QcHj5dufL")' }}
                aria-label="User profile"
              />
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-slate-900 dark:text-slate-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#102210] animate-in slide-in-from-top-2">
              <div className="flex flex-col p-4 gap-4">
                <a href="#" className="text-base font-bold text-[#07bc0c] p-2 bg-[#07bc0c]/10 rounded-md">Home</a>
                {['Dashboard', 'Explore', 'Referrals'].map((item) => (
                  <a key={item} href="#" className="text-base font-medium p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* --- Main Content --- */}
        <main className="flex-1 flex justify-center py-8 px-4 md:px-10 lg:px-20">
          <div className="max-w-[960px] w-full flex flex-col gap-12">
            
            {/* Hero Section */}
            <div className="flex flex-col gap-6 text-center items-center animate-fade-in-up">
              <h1 className="text-slate-900 dark:text-slate-50 text-4xl md:text-5xl font-black leading-tight tracking-tight">
                Connect, Share, and <br className="hidden md:block"/>
                <span className="text-[#07bc0c]">Grow with UniSpace</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-normal leading-relaxed max-w-3xl">
                The ultimate digital ecosystem for Nigerian university students. Join our community to access resources, collaborate on projects, and discover new opportunities.
              </p>
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <button className="flex items-center justify-center rounded-lg h-12 px-8 bg-[#07bc0c] hover:bg-[#06a50a] text-white text-base font-bold shadow-lg shadow-[#07bc0c]/25 transition-all active:scale-95">
                  Get Started
                </button>
                <button className="flex items-center justify-center rounded-lg h-12 px-8 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 text-base font-bold transition-all active:scale-95">
                  Learn More
                </button>
              </div>
            </div>

            {/* Spotlight Section */}
            <div className="flex flex-col gap-8 p-6 md:p-8 rounded-xl bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800 shadow-sm">
              
              {/* Spotlight Header */}
              <div className="flex flex-col items-center text-center gap-2">
                <p className="text-[#07bc0c] text-sm font-bold tracking-widest uppercase">Student Spotlight</p>
                <h3 className="text-slate-900 dark:text-slate-50 text-2xl md:text-3xl font-bold">Meet Our Top Referrer!</h3>
                <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl">
                  Thanks to our referral program, outstanding students like Chidinma get the spotlight they deserve.
                </p>
              </div>

              {/* Spotlight Content Card */}
              <div className="flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 bg-[#c2ebc2] dark:bg-[#102210] rounded-xl border border-slate-200 dark:border-slate-800">
                
                {/* Left: Profile Info */}
                <div className="flex flex-col items-center text-center gap-4 flex-1">
                  <div 
                    className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-[#07bc0c]/50 shadow-xl"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdtuOE7T050iiDkaOzKuaa9iw64cL-uDwxuq08zx665j3cK-0ekFxdGeuYZHf2j0dsAs8T1Z-v9xRjTlVuC3NW5VN-7HL_T7siazt0zUCEjX1oGXMfMfAGtFc3UFt5vxbXL30tEim2q-_XMe_0xqfYkH8J4QrQfK-JRYKuFP691QQ2GphweSHpYu-Ze2oGrCPESaDYk-8A_7kVTkooAD8GtQJ5NBHTvwtFzIiKPISJc9sNLtLMaZS4eNkP0VFWsQL0YD1QcHj5dufL")' }}
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-slate-900 dark:text-slate-100 text-xl font-bold">Chidinma Okoro</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Computer Science, University of Lagos</p>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-base italic leading-relaxed">
                    "UniSpace has been a game-changer for my startup! The exposure from the referral program helped me connect with collaborators and early customers."
                  </p>
                </div>

                {/* Right: Featured Product */}
                <div className="flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800 w-full md:w-80 shadow-sm">
                  <div 
                    className="w-full aspect-video bg-cover bg-center rounded-lg"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAd1IDRpkakoL-coLXvqYid_n_C58cEyKPueHQqf6bAOCxCmy_kXwLfd0DZQXK9fQ2nTyfQukhR-DGqDS7geIv6dqikU0xonZeeB_Sid5n9vTkJ7ZV9rjsts2mGBao6Y9qu77NG_2bVdECxgG5fk6sQn_ZvdWjx9Sk0HKIf-UkDnP3ElFk6Y0UvM1t5Oi6-0U8SZE0ZQHmpqAmgwNkmZTFkC8p_imhAdCwLGnvsve3lSedSffofo-pIwllq13xUUWU-KiH5AriOfnUg")' }}
                  />
                  <div>
                    <p className="text-slate-900 dark:text-slate-100 font-bold text-lg">Academify</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">An AI-powered research assistant for students.</p>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#07bc0c] hover:bg-[#06a50a] text-white text-sm font-medium transition-colors">
                    <span>Check it out</span>
                    <ExternalLink size={16} />
                  </button>
                </div>

              </div>

              {/* Referral Call to Action */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-[#07bc0c]/10 dark:bg-[#07bc0c]/20 border border-[#07bc0c]/20">
                <p className="text-slate-800 dark:text-slate-200 font-medium text-center md:text-left">
                  Want to get your profile featured? Invite 10+ friends to join UniSpace!
                </p>
                <button className="whitespace-nowrap flex items-center justify-center rounded-lg h-10 px-6 bg-[#07bc0c] hover:bg-[#06a50a] text-white text-sm font-bold transition-colors">
                  Learn about Referrals
                </button>
              </div>

            </div>
          </div>
        </main>
      <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};

export default UniConnectWelcome;



