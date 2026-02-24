import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import { 
  Menu, 
  X, 
  Copy, 
  Check, 
  Share2, 
  Link as LinkIcon, 
  UserCheck, 
  Star 
} from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { notifyReferralJoined, notifyReferralReward } from '../services/notificationService';

const StudentReferral = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [referralsCount, setReferralsCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    let referralsUnsub = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setReferralLink(userData.referralLink || "");
            setIsVerified(userData.verified || false);

            // Count referrals by matching referredByCode to this user's referralCode
            const myCode = userData.referralCode;
            if (myCode) {
              const q = query(
                collection(db, 'users'),
                where('referredByCode', '==', myCode),
                where('verified', '==', true)
              );
              referralsUnsub = onSnapshot(q, async (snap) => {
                const count = snap.size;
                setReferralsCount(count);
                // Sync the count back to the user's doc in Firestore
                try {
                  await updateDoc(userDocRef, { referralsCount: count });
                  
                  // Send notification when new referral joins
                  snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                      const refereeData = change.doc.data();
                      try {
                        notifyReferralJoined(user.uid, {
                          id: change.doc.id,
                          referreeName: refereeData.displayName || refereeData.email?.split('@')[0] || 'A new user',
                          refereeId: change.doc.id,
                        });
                      } catch (notifErr) {
                        console.warn('Failed to send referral notification:', notifErr);
                      }
                    }
                  });
                } catch (err) {
                  console.warn('Failed to update referralsCount in DB:', err);
                }
              }, (err) => {
                console.error('Failed to listen for referrals:', err);
              });
            } else {
              setReferralsCount(0);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load referral information');
        }
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (typeof referralsUnsub === 'function') referralsUnsub();
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Link copied to clipboard!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join UniSpace',
          text: `Join me on UniSpace! Use my referral link to sign up and get verified.`,
          url: referralLink,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  return (
    <div>
    <div className="w-full h-screen flex flex-col">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
      <main className="flex-1 overflow-y-auto flex justify-center py-8 px-4 md:px-10 lg:px-20">
          <div className="max-w-[960px] w-full flex flex-col gap-8 md:gap-12">
            
            {/* Hero Section */}
            <div className="flex flex-col gap-3 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-50">
                Invite Friends, <span className="text-[#07bc0c]">Get Featured</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl">
                Share your unique link and get your profile featured on our homepage when you successfully invite 10 friends to UniSpace.
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600 dark:text-slate-400">Loading your referral information...</div>
              </div>
            )}

            {/* Not Verified Message */}
            {!isLoading && !isVerified && (
              <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-amber-900 dark:text-amber-200 font-medium">
                  📋 Complete student verification to access the referral program and start earning rewards!
                </p>
              </div>
            )}

            {/* Interactive Section (Split Layout) - Only show if verified */}
            {!isLoading && isVerified && (
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Left Column: Link & Share */}
                <div className="flex flex-col gap-6 flex-1">
                  
                  {/* Copy Link Card */}
                  <div className="p-4 rounded-xl shadow-sm bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-3">
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-50">Your Unique Referral Link</p>
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg bg-[#c2ebc2] dark:bg-[#102210] border border-slate-200 dark:border-slate-700">
                        <p className="w-full text-slate-600 dark:text-slate-400 text-sm truncate font-mono select-all">
                          {referralLink}
                        </p>
                        <button 
                          onClick={handleCopy}
                          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[#07bc0c] hover:bg-[#06a50a] text-white text-sm font-medium transition-colors"
                        >
                          <Copy size={16} />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Share Icons */}
                  <div className="flex flex-wrap gap-4">
                    <button onClick={handleShare} className="flex flex-col items-center gap-2 w-24 cursor-pointer group hover:opacity-80 transition-opacity">
                      <div className="p-3.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors">
                        <Share2 size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Share Link</p>
                    </button>
                  </div>
                </div>

                {/* Right Column: Progress Widget */}
                <div className="lg:w-80 p-6 rounded-xl shadow-sm bg-white dark:bg-[#102210]/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-4">
                  <div className="flex justify-between items-center">
                    <p className="text-base font-bold text-slate-900 dark:text-slate-50">Your Progress</p>
                    <p className="text-[#07bc0c] text-sm font-bold">{referralsCount} / 10</p>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="w-full rounded-full bg-slate-200 dark:bg-slate-700 h-2.5 overflow-hidden">
                    <div className="bg-[#07bc0c] h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(referralsCount * 10, 100)}%` }}></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    You're only <span className="font-bold text-slate-800 dark:text-slate-200">{Math.max(10 - referralsCount, 0)} referrals</span> away from being featured!
                  </p>
                </div>
              </div>
            )}

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
                  desc="Your friends must sign up and get their student status verified on UniSpace." 
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



