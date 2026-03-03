 import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';
import { 
  Menu, 
  X, 
  PartyPopper, 
  ArrowRight, 
  Info, 
  User 
} from 'lucide-react';

const ReferralReward = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Custom colors matching your original config
  const colors = {
    primary: "#07bc0c",
    bgLight: "#c2ebc2",
    bgDark: "#102210"
  };

  return (
    <div className="font-sans min-h-screen w-full flex flex-col bg-[#c2ebc2] dark:bg-[#102210] text-slate-900 dark:text-slate-50 transition-colors duration-300">
      
      {/* --- Header --- */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-[#c2ebc2]/80 dark:bg-[#102210]/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 lg:px-20 py-3">
          <div className="flex items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <img src="/logo/green_whitebg.png" alt="UniSpace" className="h-12 w-12 mb-1 object-contain" />
              <h2 className="text-lg font-bold leading-tight tracking-tight -ml-3">niConnect</h2>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-9">
                {['Home', 'Dashboard', 'Explore'].map((item) => (
                  <a key={item} href="#" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-[#07bc0c] transition-colors">
                    {item}
                  </a>
                ))}
                <a href="#" className="text-sm font-bold text-[#07bc0c]">Referrals</a>
              </div>
              
              {/* User Profile Pic */}
              <div 
                className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdtuOE7T050iiDkaOzKuaa9iw64cL-uDwxuq08zx665j3cK-0ekFxdGeuYZHf2j0dsAs8T1Z-v9xRjTlVuC3NW5VN-7HL_T7siazt0zUCEjX1oGXMfMfAGtFc3UFt5vxbXL30tEim2q-_XMe_0xqfYkH8J4QrQfK-JRYKuFP691QQ2GphweSHpYu-Ze2oGrCPESaDYk-8A_7kVTkooAD8GtQJ5NBHTvwtFzIiKPISJc9sNLtLMaZS4eNkP0VFWsQL0YD1QcHj5dufL")' }}
                aria-label="User Profile"
              />
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#102210] shadow-lg animate-in slide-in-from-top-2">
            <div className="flex flex-col p-4 gap-2">
              <a href="#" className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Home</a>
              <a href="#" className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Dashboard</a>
              <a href="#" className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Explore</a>
              <a href="#" className="p-3 rounded-lg bg-[#07bc0c]/10 text-[#07bc0c] font-bold">Referrals</a>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div 
                  className="size-8 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdtuOE7T050iiDkaOzKuaa9iw64cL-uDwxuq08zx665j3cK-0ekFxdGeuYZHf2j0dsAs8T1Z-v9xRjTlVuC3NW5VN-7HL_T7siazt0zUCEjX1oGXMfMfAGtFc3UFt5vxbXL30tEim2q-_XMe_0xqfYkH8J4QrQfK-JRYKuFP691QQ2GphweSHpYu-Ze2oGrCPESaDYk-8A_7kVTkooAD8GtQJ5NBHTvwtFzIiKPISJc9sNLtLMaZS4eNkP0VFWsQL0YD1QcHj5dufL")' }}
                />
                <span className="text-sm font-medium">My Profile</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex justify-center py-10 px-4 md:px-10">
        <div className="w-full max-w-[960px] flex flex-col items-center justify-center">
          
          {/* Card Container */}
          <div className="w-full flex flex-col items-center justify-center text-center gap-8 py-12 px-6 rounded-xl shadow-lg bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
            
            {/* Header / Icon */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center size-24 rounded-full bg-[#07bc0c]/10 text-[#07bc0c] ring-4 ring-[#07bc0c]/5">
                <PartyPopper size={48} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="text-slate-900 dark:text-slate-50 text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight tracking-tight\">
                  Congratulations! <br className="hidden sm:block\" />
                  You've Earned Your Spot!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base lg:text-lg font-normal leading-relaxed max-w-2xl mx-auto\">
                  You've successfully invited 10+ students to UniConnect. As a reward, your profile is now eligible to be featured on our landing page for everyone to see!
                </p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="w-full max-w-lg flex flex-col items-center gap-6 mt-2">
              
              {/* Primary Action */}
              <a 
                href="#" 
                className="group flex min-w-[200px] w-full sm:w-auto items-center justify-center rounded-lg h-10 sm:h-11 px-4 sm:px-8 bg-[#07bc0c] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#07bc0c]/30 hover:bg-[#07bc0c]/90 hover:scale-[1.02] transition-all duration-300"
              >
                <span>View Your Profile on Landing Page</span>
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </a>

              {/* Info Box */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 w-full text-left">
                <Info className="text-slate-500 dark:text-slate-400 mt-1 shrink-0" size={20} />
                <div>
                  <p className="text-slate-800 dark:text-slate-200 font-bold mb-1">Keep Your Profile Fresh</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    To make the best impression, ensure your profile and any listed products are up-to-date. This will attract more visitors to your page.
                  </p>
                </div>
              </div>

              {/* Secondary Action */}
              <button className="flex min-w-[180px] w-full sm:w-auto items-center justify-center rounded-lg h-11 px-6 bg-transparent text-slate-600 dark:text-slate-400 text-sm font-bold border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                Update My Profile
              </button>

            </div>
          </div>

        </div>
      </main>
    <Footer darkMode={darkMode} />
    </div>
  );
};

export default ReferralReward;



