  import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageSquare, 
  Mail, 
  Link as LinkIcon, 
  UserCheck, 
  Star 
} from 'lucide-react';

const StudentReferral = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const referralLink = "https://uniconnect.ng/invite?ref=user1234";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    // Main Container with background colors from the original HTML
    <div className="min-h-screen w-full font-sans bg-[#f5f8f6] dark:bg-[#102210] text-slate-900 dark:text-slate-50 transition-colors duration-300">
      
      {/* Wrapper to center content nicely */}
      <div className="flex flex-col min-h-screen">
        
        {/* --- Header --- */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-[#f5f8f6]/80 dark:bg-[#102210]/90 backdrop-blur-md">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 text-[#07bc0c]">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold leading-tight">UniConnect</h2>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                {['Home', 'Dashboard', 'Explore'].map((item) => (
                  <a key={item} href="#" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-[#07bc0c] transition-colors">
                    {item}
                  </a>
                ))}
                <a href="#" className="text-sm font-bold text-[#07bc0c]">Referrals</a>
              </div>
              {/* Profile Pic */}
              <div 
                className="w-10 h-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdtuOE7T050iiDkaOzKuaa9iw64cL-uDwxuq08zx665j3cK-0ekFxdGeuYZHf2j0dsAs8T1Z-v9xRjTlVuC3NW5VN-7HL_T7siazt0zUCEjX1oGXMfMfAGtFc3UFt5vxbXL30tEim2q-_XMe_0xqfYkH8J4QrQfK-JRYKuFP691QQ2GphweSHpYu-Ze2oGrCPESaDYk-8A_7kVTkooAD8GtQJ5NBHTvwtFzIiKPISJc9sNLtLMaZS4eNkP0VFWsQL0YD1QcHj5dufL")' }}
              />
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-slate-900 dark:text-slate-50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#102210]">
              <div className="flex flex-col p-4 gap-4">
                <a href="#" className="text-base font-medium py-2">Home</a>
                <a href="#" className="text-base font-medium py-2">Dashboard</a>
                <a href="#" className="text-base font-medium py-2">Explore</a>
                <a href="#" className="text-base font-bold text-[#07bc0c] py-2">Referrals</a>
              </div>
            </div>
          )}
        </header>

        {/* --- Main Content --- */}
        <main className="flex-1 flex justify-center py-8 px-4 md:px-10 lg:px-20">
          <div className="max-w-[960px] w-full flex flex-col gap-8 md:gap-12">
            
            {/* Hero Section */}
            <div className="flex flex-col gap-3 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-50">
                Invite Friends, <span className="text-[#07bc0c]">Get Featured</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl">
                Share your unique link and get your profile featured on our homepage when you successfully invite 10 friends to UniConnect.
              </p>
            </div>

            {/* Interactive Section (Split Layout) */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Link & Share */}
              <div className="flex flex-col gap-6 flex-1">
                
                {/* Copy Link Card */}
                <div className="p-4 rounded-xl shadow-sm bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col gap-3">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">Your Unique Referral Link</p>
                    <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg bg-[#f5f8f6] dark:bg-[#102210] border border-slate-200 dark:border-slate-700">
                      <p className="w-full text-slate-600 dark:text-slate-400 text-sm truncate font-mono select-all">
                        {referralLink}
                      </p>
                      <button 
                        onClick={handleCopy}
                        className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[#07bc0c] hover:bg-[#06a50a] text-white text-sm font-medium transition-colors"
                      >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Share Icons */}
                <div className="flex flex-wrap gap-4">
                  <ShareOption icon={<Share2 size={24} />} label="Share Link" />
                  {/* Additional dummy share buttons to match design */}
                  <div className="hidden sm:flex gap-4">
                    <ShareOption icon={<MessageSquare size={24} />} label="SMS" />
                    <ShareOption icon={<Mail size={24} />} label="Email" />
                  </div>
                </div>
              </div>

              {/* Right Column: Progress Widget */}
              <div className="lg:w-80 p-6 rounded-xl shadow-sm bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-50">Your Progress</p>
                  <p className="text-[#07bc0c] text-sm font-bold">7 / 10</p>
                </div>
                {/* Progress Bar Container */}
                <div className="w-full rounded-full bg-slate-200 dark:bg-slate-700 h-2.5 overflow-hidden">
                  <div className="bg-[#07bc0c] h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: '70%' }}></div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  You're only <span className="font-bold text-slate-800 dark:text-slate-200">3 referrals</span> away from being featured!
                </p>
              </div>
            </div>

            {/* How It Works Grid */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StepItem 
                  icon={<LinkIcon />} 
                  title="1. Share Your Link" 
                  desc="Copy your unique link above and share it with friends at Nigerian universities." 
                />
                <StepItem 
                  icon={<UserCheck />} 
                  title="2. Friends Sign Up" 
                  desc="Your friends must sign up and get their student status verified on UniConnect." 
                />
                <StepItem 
                  icon={<Star />} 
                  title="3. Get Featured" 
                  desc="Once 10 friends are verified, your profile gets a spot on our homepage!" 
                />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

// --- Helper Components for cleaner code ---

const ShareOption = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-2 w-24 cursor-pointer group">
    <div className="p-3.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors">
      {icon}
    </div>
    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
  </div>
);

const StepItem = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center text-center gap-3">
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#07bc0c]/20 text-[#07bc0c] mb-2">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <p className="font-bold text-slate-900 dark:text-slate-100">{title}</p>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default StudentReferral;
