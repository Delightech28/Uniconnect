import React from 'react';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';

// Data for StudyHub Plans
const studyPlans = [
  {
    title: "Basic Scholar",
    subtitle: "Essential tools for focused study.",
    price: "1,000",
    features: [
      "Limited quiz section access",
      "1 upload per week",
      "10 quizzes total",
      "1 quiz retake per week"
    ],
    buttonText: "Subscribe",
    isPopular: false,
    highlight: false
  },
  {
    title: "Campus Pro",
    subtitle: "Full access for the active student.",
    price: "2,500",
    features: [
      "Unlimited uploads per week",
      "Up to 20 quizzes",
      "5 quiz retakes or 5 topics",
      "5 inputs for Ask AI"
    ],
    buttonText: "Subscribe Now",
    isPopular: true,
    highlight: true // Applies the green border and primary color logic
  },
  {
    title: "UniSpace Elite",
    subtitle: "Maximum resources for top achievers.",
    price: "10,000",
    features: [
      "Unlimited uploads & quizzes",
      "4 weeks of full study access",
      "10 inputs for Ask AI",
      "Exclusive study resources"
    ],
    buttonText: "Subscribe",
    isPopular: false,
    highlight: false
  }
];

// Data for Business Plans
const businessPlans = [
  {
    title: "Basic Seller",
    subtitle: "Start selling to the campus.",
    price: "2,000",
    features: [
      "Limited marketplace access",
      "1 upload per week",
      "3 product posts/week (Days plan)",
      "Basic analytics"
    ],
    buttonText: "Subscribe",
    isRecommended: false,
    accentColor: "blue" // Fallback, though we override in render
  },
  {
    title: "Campus Pro Seller",
    subtitle: "Grow your campus business.",
    price: "4,500",
    features: [
      "Unlimited uploads per week",
      "Up to 10 active listings",
      "3 days to post on the Days plan",
      "AI-powered market insights (5)"
    ],
    buttonText: "Subscribe Now",
    isRecommended: true,
    accentColor: "amber"
  },
  {
    title: "UniSpace Elite Seller",
    subtitle: "Dominate the market.",
    price: "25,000",
    features: [
      "Unlimited uploads & active listings",
      "Multiple sell posts (Days plan)",
      "Business AI Chat System",
      "Dedicated Account Manager"
    ],
    buttonText: "Subscribe",
    isRecommended: false,
    accentColor: "blue"
  }
];

// Data for Pay As You Go
const payAsYouGoItems = [
  {
    title: "UniMarket Listing",
    price: "₦500",
    desc: "Post a single item for sale to the entire campus network. Listing stays active for 30 days.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDR1CJlHY0zz7pP_DBfPlKCInHoD3NljK0u0KxV8QcU7EDZBmPX8fSP9SWwb3QESI2gtUtY3MtJmVsBAmn7m_3c8JT4H3HYsEA3WUbYW0ZIl608TH5fdjs45HCFzSJE9JX3fI6RP2cnXgJu76SEdLQeITlgzSR9D3IPsH2KEbWHe9eZ11vL6UY4G_W2WMJUbf7fLH5PfgFNamzzfFxSilt59IcX3lIST---Phy1blOCxqnFDjJ4EWirpmIIsD_YhVrgdwaIcm81qoB"
  },
  {
    title: "StudyHub Quiz Access",
    price: "₦200 / ₦300",
    desc: "Get instant access to a premium quiz. ₦200 per quiz for students, ₦300 per quiz for guest users.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-ezRA9le-U2xF80I0w0X272b8IdRK0ESkykEuHHQ9KCAb8aGRcKFPdw8hRGta-zjZgabnCA2sj__IaPHAlTODE3VSbs5BzMH1b0gb-m7XHxGtoIsfr91aWx3T9b0v7qL1Hs0Ot-ivmlD5nSNPKB_olnlI8IEFSk4O4TfWUqUgbpSUPxyb5sj5EjI8cshenf_J7ZCc8ydteVYhyZsxdA0-AwC9lDDjI5S-yXlD5QKpIiZdLZfTFHDYlpJJw7tv_ZBiCTH6K2NAwZS8"
  },
  {
    title: "Tutor Connection",
    price: "₦1,500",
    desc: "Book a 1-hour session with a verified peer tutor in your department.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXpfXiLcl2vPHXTIR27FXIEO17SphjvdScSQ823SZT_SNkdCeJzwyf59t1yJshIAeqaumVGxfehXrXGXPhNPXZJ3YNETikp03cM2VJS5GPyWiIuiidEIK8Zh2AJjM4puS107LfReBeko5L7hdQX2bWCi_ItZu_GyiTVaijjzKqoS6z-7rrliUPALNijmrKdBSmFMbarwPU3fO9ccRNWV4F3w0Ym68lnvCzpGMCxVX-oW7ze4QISuy_YoVUWr5azk4iJUrQQSs2b7A0"
  },
  {
    title: "Event Promotion",
    price: "₦800",
    desc: "Promote your campus event on the main UniSpace dashboard for 24 hours.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwhdkvPwJwDa-vrHibqL6BO3qRLnZjP08lHRZyU01cO39rHsg2sv2n-D_aWUeXM-yuIwEadNnNo-z8iBUIOIZxcBwktksF6bZPDkjAXiWAk_IIY4gHswBX216n_CNvme-WDOPQglWH1sMd5XpcRQKUBa5iL3sihoS0RHzcYIn6f1jNuch5CEG_gknAm2kKZIpLLhl-fUDawUSNRlVk2eeE5YSIrEMmrmV9bmHmkrwIv6uO65PcTnfflPf_qM-vVNc4OVjOKNm9AwP0"
  }
];

const UniSpaceUpgrade = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="bg-[#f5f8f6] dark:bg-black text-[#111811] dark:text-white font-['Lexend'] min-h-screen flex flex-col overflow-x-hidden">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

      {/* Main Content */}
      <div className="flex flex-1 justify-center py-10 px-4 sm:px-10">
        <div className="w-full max-w-[1200px] flex flex-col gap-12">
          
          {/* Hero Section */}
          <section className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#07bb0d] text-xl">verified</span>
                <span className="text-[#07bb0d] font-bold text-sm uppercase tracking-wider">Verified Student Status</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] text-[#111811] dark:text-white">Unlock Your Full Potential</h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-normal leading-normal">Choose a plan that fits your semester. Pay as you go for flexibility or save with a monthly subscription.</p>
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
          </section>

          {/* StudyHub Plans */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-[#111811] dark:text-white">StudyHub Monthly Plans</h2>
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">For Scholars</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyPlans.map((plan, idx) => (
                <PricingCard 
                  key={idx}
                  {...plan}
                  primaryColor="text-[#07bb0d]"
                  borderColor="border-[#07bb0d]"
                  bgColor="bg-[#07bb0d]"
                  checkColor="text-[#07bb0d]"
                />
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px bg-gray-200 dark:bg-gray-800 my-4"></div>

          {/* Business Plans */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-[#111811] dark:text-white">Business & Market Monthly Plans</h2>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-bold px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">For Entrepreneurs</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessPlans.map((plan, idx) => (
                <PricingCard 
                  key={idx}
                  {...plan}
                  isPopular={plan.isRecommended}
                  primaryColor="text-amber-600 dark:text-amber-500"
                  borderColor="border-amber-500"
                  bgColor="bg-amber-500"
                  checkColor="text-amber-500"
                  label="RECOMMENDED"
                  hoverColor="hover:bg-amber-600"
                />
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px bg-gray-200 dark:bg-gray-800 my-4"></div>

          {/* Pay As You Go */}
          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-6">Pay-As-You-Go Options</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {payAsYouGoItems.map((item, idx) => (
                <PayGoCard key={idx} {...item} />
              ))}
            </div>
          </section>

          {/* Policy Section */}
          <section className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700 mt-6">
            <h3 className="text-xl font-bold text-[#111811] dark:text-white mb-4">Payment & Subscription Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <p className="font-bold text-[#111811] dark:text-white mb-2">How do deductions work?</p>
                <p>All payments are deducted directly from your UniWallet balance. Ensure you have sufficient funds before selecting an option. If your balance is low, you will be prompted to top up via bank transfer or card.</p>
              </div>
              <div>
                <p className="font-bold text-[#111811] dark:text-white mb-2">Can I cancel my subscription?</p>
                <p>Yes, you can cancel monthly subscriptions at any time from your settings. Benefits will remain active until the end of the billing period. Pay-as-you-go purchases are non-refundable once used.</p>
              </div>
            </div>
          </section>

          <div className="h-10"></div>
        </div>
      </div>
    </div>
  );
};

// Reusable Pricing Card Component
const PricingCard = ({ 
  title, subtitle, price, features, buttonText, 
  isPopular = false, 
  primaryColor, borderColor, bgColor, checkColor, label = "POPULAR", hoverColor
}) => {
  return (
    <div className={`relative flex flex-col h-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm transition-all ${isPopular ? `border-2 ${borderColor} shadow-md transform md:-translate-y-2` : `border border-gray-200 dark:border-gray-700 hover:border-[#07bb0d]/50`}`}>
      {isPopular && (
        <div className={`absolute top-0 right-0 ${bgColor} text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg`}>
          {label}
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
      
      <div className="mb-6">
        <span className={`text-4xl font-bold ${isPopular ? primaryColor : 'text-gray-900 dark:text-white'}`}>₦{price}</span>
        <span className="text-gray-500 dark:text-gray-400">/mo</span>
      </div>
      
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className={`material-symbols-outlined text-[20px] ${isPopular ? checkColor : 'text-[#07bb0d]'}`}>check_circle</span>
            {feature}
          </li>
        ))}
      </ul>
      
      <button className={`w-full py-3 px-4 font-bold rounded-lg transition-colors border ${isPopular 
          ? `${bgColor} text-white ${hoverColor || 'hover:bg-[#06a00b]'} shadow-sm border-transparent`
          : 'bg-[#f5f8f6] dark:bg-gray-800 text-[#111811] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
};

// Reusable Pay As You Go Card Component
const PayGoCard = ({ title, price, desc, img }) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
        <div 
          className="absolute inset-0 bg-center bg-cover" 
          style={{ backgroundImage: `url(${img})` }}
        ></div>
      </div>
      
      <div className="flex flex-col flex-1 justify-between py-1">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-[#111811] dark:text-white text-lg font-bold leading-tight">{title}</h3>
            <span className="text-[#07bb0d] font-bold">{price}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-normal leading-normal">{desc}</p>
        </div>
        
        <div className="flex justify-end mt-4">
          <button className="flex items-center justify-center gap-2 cursor-pointer rounded-lg h-9 px-4 bg-[#f0f5f0] hover:bg-[#dbe6db] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#111811] dark:text-white text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>Pay from Wallet</span>
          </button>
        </div>
      <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};

export default UniSpaceUpgrade;


