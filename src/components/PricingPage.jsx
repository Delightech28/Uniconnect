import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';

const PricingPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
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
      <AppHeader />
      
      <main className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <section className="bg-background-light dark:bg-background-dark py-8 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center mb-8">
              <div className="flex flex-col gap-3 max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-extrabold text-secondary dark:text-white mb-4">
                  Upgrade Your <span className="text-primary drop-shadow-lg" style={{textShadow: '0 0 20px rgba(7, 188, 12, 0.6)'}}>Space</span>
                </h1>
                <p className="text-lg text-secondary dark:text-gray-300 max-w-3xl">
                  Unlock the Potential of Innovation, Discover Advance tools Guilding Student Toward{' '}
                  <span className="text-primary font-bold">Creative, Precision</span> and timeless possibilities
                </p>
              </div>
              
              {/* Wallet Widget */}
              <div className="w-full md:w-auto md:min-w-[300px] bg-white dark:bg-gray-900 rounded-xl p-6 border border-[#dbe6db] dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-[#07bb0d]/10 rounded-lg text-[#07bb0d]">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <button className="text-sm font-medium text-[#07bb0d] hover:underline">Top Up</button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">Current Wallet Balance</p>
                <p className="text-[#111811] dark:text-white tracking-light text-3xl font-bold leading-tight mt-1">₦5,400</p>
              </div>
            </div>

            {/* Billing Toggle - Like UniDoc Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex space-x-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex items-center px-6 py-2 font-medium text-sm transition-all rounded-full whitespace-nowrap ${
                    billingCycle === 'monthly'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('payAsYouGo')}
                  className={`flex items-center px-6 py-2 font-medium text-sm rounded-full transition-all whitespace-nowrap ${
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
            <div className="relative flex items-center justify-center mt-12">
              {/* Left Arrow */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 z-10 p-2 rounded-full opacity-30 hover:opacity-60 transition-opacity"
                aria-label="Previous plan"
              >
                <ChevronLeft className="w-6 h-6 text-secondary dark:text-gray-400" />
              </button>

              {/* Cards Container */}
              <div className="w-full max-w-6xl px-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {/* Left Card */}
                  <div onClick={handlePrevious} className="rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg opacity-70 scale-95 transition-all duration-500 ease-out cursor-pointer hover:opacity-90 hover:scale-100 relative">
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${left.badgeColor} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
                      {left.badge}
                    </div>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-secondary dark:text-white mb-2">
                        {left.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {left.description}
                      </p>
                    </div>

                    <div className="mb-8">
                      <div className="text-4xl font-black text-secondary dark:text-white">
                        {left.price}
                        <span className="text-base text-gray-600 dark:text-gray-400">
                          {left.period}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/signup')}
                      className="w-full py-3 rounded-full font-bold mb-8 transition-all bg-secondary dark:bg-gray-700 text-white hover:bg-secondary/90 dark:hover:bg-gray-600"
                    >
                      {left.buttonText}
                    </button>

                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-8">
                      No credit card required
                    </p>

                    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
                      {left.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-secondary dark:text-gray-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Center Card (Premium) */}
                  <div className="rounded-3xl p-8 border-2 border-primary bg-white dark:bg-gray-900 shadow-2xl transform md:scale-105 relative transition-all duration-500 ease-out">
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${center.badgeColor} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
                      {center.badge}
                    </div>

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-secondary dark:text-white mb-2">
                        {center.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {center.description}
                      </p>
                    </div>

                    <div className="mb-8">
                      <div className="text-4xl font-black text-secondary dark:text-white">
                        {center.price}
                        <span className="text-base text-gray-600 dark:text-gray-400">
                          {center.period}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/signup')}
                      className="w-full py-3 rounded-full font-bold mb-8 transition-all bg-primary text-white hover:bg-primary/90"
                    >
                      {center.buttonText}
                    </button>

                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-8">
                      No credit card required
                    </p>

                    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
                      {center.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-secondary dark:text-gray-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Card */}
                  <div onClick={handleNext} className="rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg opacity-70 scale-95 transition-all duration-500 ease-out cursor-pointer hover:opacity-90 hover:scale-100 relative">
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${right.badgeColor} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
                      {right.badge}
                    </div>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-secondary dark:text-white mb-2">
                        {right.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {right.description}
                      </p>
                    </div>

                    <div className="mb-8">
                      <div className="text-4xl font-black text-secondary dark:text-white">
                        {right.price}
                        <span className="text-base text-gray-600 dark:text-gray-400">
                          {right.period}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/signup')}
                      className="w-full py-3 rounded-full font-bold mb-8 transition-all bg-secondary dark:bg-gray-700 text-white hover:bg-secondary/90 dark:hover:bg-gray-600"
                    >
                      {right.buttonText}
                    </button>

                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-8">
                      No credit card required
                    </p>

                    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
                      {right.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-secondary dark:text-gray-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                className="absolute right-0 z-10 p-2 rounded-full opacity-30 hover:opacity-60 transition-opacity"
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


