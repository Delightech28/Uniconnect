import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';

const PricingPage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [cardIndex, setCardIndex] = useState(1); // Start with Premium (center)

  const allPlans = [
    {
      name: 'Basic',
      description: 'Try out basic plan',
      price: '₦2000',
      period: '/month',
      buttonText: '7 Days Free Trial',
      badge: 'Getting Started',
      badgeColor: 'bg-gray-500',
      features: [
        'Monthly Assessments: 4 Quizzes per month',
        'AI Interaction: Unlimited access to AI Chat'
      ]
    },
    {
      name: 'Premium',
      description: 'All th basic features to boost your start up',
      price: '₦8000',
      period: '/month',
      buttonText: '7 Days Free Trial',
      badge: 'Most Popular',
      badgeColor: 'bg-primary',
      features: [
        'Weekly Assessments: 2 Quizzes per week (8 per month)',
        'AI Interaction: Unlimited access to AI Chat',
        'Resource Access: Full access to the UniDoc'
      ]
    },
    {
      name: 'Professional +',
      description: 'Enjoy all features and AI, No limit',
      price: '₦15,000',
      period: '/month',
      buttonText: '7 Days Free Trial',
      badge: 'Unlimited Power',
      badgeColor: 'bg-purple-600',
      features: [
        'Assessment Limit: Unlimited Quizzes',
        'AI Interaction: Unlimited access to AI Chat',
        'Resource Access: Unlimited access to the UniDoc',
        'Multimedia: Exclusive access to the Podcast library'
      ]
    }
  ];

  // Get the 3 cards to display (left, center, right)
  const getDisplayedCards = () => {
    const left = allPlans[(cardIndex - 1 + allPlans.length) % allPlans.length];
    const center = allPlans[cardIndex];
    const right = allPlans[(cardIndex + 1) % allPlans.length];
    return { left, center, right };
  };

  const { left, center, right } = getDisplayedCards();

  const handlePrevious = () => {
    setCardIndex((cardIndex - 1 + allPlans.length) % allPlans.length);
  };

  const handleNext = () => {
    setCardIndex((cardIndex + 1) % allPlans.length);
  };

  return (
    <div>
    <div className="w-full h-screen flex flex-col overflow-x-hidden">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
      
      <main className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <section className="bg-[#f5f8f6] dark:bg-gradient-to-b dark:from-[#050805] dark:to-[#1e4004] py-8 md:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-between items-start lg:items-center mb-8">
              <div className="flex flex-col gap-3 max-w-2xl w-full">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-secondary dark:text-white mb-4">
                  Upgrade Your <span className="text-primary drop-shadow-lg" style={{textShadow: '0 0 20px rgba(7, 188, 12, 0.6)'}}>Space</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-secondary dark:text-gray-300 max-w-3xl">
                  Unlock the Potential of Innovation, Discover Advance tools Guilding Student Toward{' '}
                  <span className="text-primary font-bold">Creative, Precision</span> and timeless possibilities
                </p>
              </div>
              
              {/* Wallet Widget */}
              <div className="w-full lg:w-auto lg:min-w-[300px] bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-[#dbe6db] dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-[#07bb0d]/10 rounded-lg text-[#07bb0d]">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <button className="text-xs sm:text-sm font-medium text-[#07bb0d] hover:underline">Top Up</button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium leading-normal">Current Wallet Balance</p>
                <p className="text-[#111811] dark:text-white tracking-light text-2xl sm:text-3xl font-bold leading-tight mt-1">₦5,400</p>
              </div>
            </div>

            {/* Billing Toggle - Always Horizontal */}
            <div className="flex items-center justify-center mb-8 lg:mb-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex flex-row space-x-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex items-center px-4 sm:px-6 py-2 font-medium text-xs sm:text-sm transition-all rounded-full whitespace-nowrap ${
                    billingCycle === 'monthly'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('payAsYouGo')}
                  className={`flex items-center px-4 sm:px-6 py-2 font-medium text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${
                    billingCycle === 'payAsYouGo'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Pay as you Go
                </button>
              </div>
            </div>

            {/* Pricing Cards Carousel */}
            <div className="relative flex items-center justify-center mt-8 lg:mt-12 h-96 sm:h-[450px] lg:h-[500px]">
              {/* Left Arrow - visible on all screens */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 lg:left-2 z-20 p-2 rounded-full opacity-40 hover:opacity-70 transition-opacity"
                aria-label="Previous plan"
              >
                <ChevronLeft className="w-5 lg:w-6 h-5 lg:h-6 text-secondary dark:text-gray-400" />
              </button>

              {/* Cards Container - Absolute positioning for layered effect */}
              <div className="relative w-full h-full flex items-center justify-center px-2 sm:px-4 overflow-visible">
                {/* Left Card - Behind, slightly visible */}
                <div 
                  onClick={handlePrevious} 
                  className="absolute rounded-3xl p-3 sm:p-4 lg:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer transition-all duration-500 ease-out opacity-60 hover:opacity-70"
                  style={{
                    width: '140px',
                    height: '280px',
                    left: 'calc(50% - 120px)',
                    transform: 'translateX(-80px) scale(0.85)',
                    zIndex: 1
                  }}
                >
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${left.badgeColor} text-white px-3 py-0.5 rounded-full text-xs font-semibold`}>
                    {left.badge}
                  </div>
                  <div className="mb-3">
                    <h3 className="text-sm lg:text-lg font-bold text-secondary dark:text-white mb-1">
                      {left.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {left.description}
                    </p>
                  </div>
                  <div className="mb-4">
                    <div className="text-lg lg:text-2xl font-black text-secondary dark:text-white">
                      {left.price}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/signup')}
                    className="w-full py-1.5 lg:py-2 rounded-full font-bold text-xs transition-all bg-secondary dark:bg-gray-700 text-white hover:bg-secondary/90"
                  >
                    Try Free
                  </button>
                </div>

                {/* Center Card (Premium) - On top, fully visible and largest */}
                <div 
                  className="absolute rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-primary bg-white dark:bg-gray-900 shadow-2xl cursor-pointer transition-all duration-500 ease-out"
                  style={{
                    width: '200px',
                    height: '400px',
                    zIndex: 10
                  }}
                >
                  <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${center.badgeColor} text-white px-4 py-1 rounded-full text-xs lg:text-sm font-semibold`}>
                    {center.badge}
                  </div>
                  <div className="mb-5">
                    <h3 className="text-lg lg:text-2xl font-bold text-secondary dark:text-white mb-2">
                      {center.name}
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                      {center.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="text-2xl lg:text-4xl font-black text-secondary dark:text-white">
                      {center.price}
                      <span className="text-xs lg:text-base text-gray-600 dark:text-gray-400">
                        {center.period}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/signup')}
                    className="w-full py-2 lg:py-3 rounded-full font-bold mb-4 lg:mb-5 transition-all text-sm bg-primary text-white hover:bg-primary/90"
                  >
                    {center.buttonText}
                  </button>

                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-4 lg:mb-5">
                    No credit card required
                  </p>

                  <div className="space-y-2 lg:space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 lg:pt-5 max-h-32 lg:max-h-40 overflow-y-auto">
                    {center.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5 w-3 lg:w-4 h-3 lg:h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-xs lg:text-sm text-secondary dark:text-gray-300 line-clamp-2">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Card - Behind, slightly visible */}
                <div 
                  onClick={handleNext} 
                  className="absolute rounded-3xl p-3 sm:p-4 lg:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer transition-all duration-500 ease-out opacity-60 hover:opacity-70"
                  style={{
                    width: '140px',
                    height: '280px',
                    right: 'calc(50% - 120px)',
                    transform: 'translateX(80px) scale(0.85)',
                    zIndex: 1
                  }}
                >
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${right.badgeColor} text-white px-3 py-0.5 rounded-full text-xs font-semibold`}>
                    {right.badge}
                  </div>
                  <div className="mb-3">
                    <h3 className="text-sm lg:text-lg font-bold text-secondary dark:text-white mb-1">
                      {right.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {right.description}
                    </p>
                  </div>
                  <div className="mb-4">
                    <div className="text-lg lg:text-2xl font-black text-secondary dark:text-white">
                      {right.price}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/signup')}
                    className="w-full py-1.5 lg:py-2 rounded-full font-bold text-xs transition-all bg-secondary dark:bg-gray-700 text-white hover:bg-secondary/90"
                  >
                    Try Free
                  </button>
                </div>
              </div>
              {/* Right Arrow - visible on all screens */}
              <button
                onClick={handleNext}
                className="absolute right-0 lg:right-2 z-20 p-2 rounded-full opacity-40 hover:opacity-70 transition-opacity"
                aria-label="Next plan"
              >
                <ChevronRight className="w-6 h-6 text-secondary dark:text-gray-400" />
              </button>
            </div>
          </div>
        </section>

        {/* Policy Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700 mt-6 max-w-7xl mx-auto">
          <h3 className="text-xl font-bold text-secondary dark:text-white mb-4">Payment & Subscription Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <p className="font-bold text-secondary dark:text-white mb-2">How do deductions work?</p>
              <p>All payments are deducted directly from your UniWallet balance. Ensure you have sufficient funds before selecting an option. If your balance is low, you will be prompted to top up via bank transfer or card.</p>
            </div>
            <div>
              <p className="font-bold text-secondary dark:text-white mb-2">Can I cancel my subscription?</p>
              <p>Yes, you can cancel monthly subscriptions at any time from your settings. Benefits will remain active until the end of the billing period. Pay-as-you-go purchases are non-refundable once used.</p>
            </div>
          </div>
        </section>
      </main>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default PricingPage;


