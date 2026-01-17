import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import useVerified from '../hooks/useVerified';
import toast from 'react-hot-toast';

const AppHeader = ({ darkMode, toggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('/default_avatar.png');
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const navigate = useNavigate();

  const INACTIVITY_TIMEOUT = 3000; // 3 seconds of inactivity before hiding

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
      // Always show header when scrolling
      setIsHeaderVisible(true);
      
      // If scrolled down, reset inactivity timer
      if (window.scrollY > 0) {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }

        const timer = setTimeout(() => {
          setIsHeaderVisible(false);
        }, INACTIVITY_TIMEOUT);

        setInactivityTimer(timer);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [inactivityTimer]);

  // Handle user activity to show/hide header (only when scrolled down)
  useEffect(() => {
    const handleUserActivity = () => {
      // Always show header
      setIsHeaderVisible(true);

      // If at top of page, don't apply fade out
      if (scrollPosition === 0) {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        return;
      }

      // Clear existing timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      // Set new timer to hide header after inactivity (only if scrolled down)
      const timer = setTimeout(() => {
        setIsHeaderVisible(false);
      }, INACTIVITY_TIMEOUT);

      setInactivityTimer(timer);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [inactivityTimer, scrollPosition]);

  // Fetch current user's avatar from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().avatarUrl) {
            setUserAvatar(userDoc.data().avatarUrl);
          }
        } catch (err) {
          if (err && err.code === 'permission-denied') {
            console.warn('Permission denied when fetching user avatar; using placeholder');
            setUserAvatar('/default_avatar.png');
          } else {
            console.error('Error fetching user avatar:', err);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Watch for unread count changes from InboxPage
  useEffect(() => {
    const checkUnreadCount = () => {
      const count = window.inboxUnreadCount || 0;
      setUnreadCount(count);
    };
    
    const interval = setInterval(checkUnreadCount, 500);
    return () => clearInterval(interval);
  }, []);

  // hide/disable some features for unverified/failed users
  const { isLoading: verifyingLoading, verified, status, registerAs } = useVerified();

  return (
    <>
      <header className={`sticky top-0 z-20 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-700 px-4 sm:px-10 py-3 bg-background-light/80 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-4 lg:gap-8">
          <NavLink to={currentUser ? "/dashboard" : "/"} className="flex items-center gap-0 text-secondary hover:opacity-80 transition-opacity">
            <img src="/logo/white_greenbg.png" alt="UniSpace" className="h-12 w-12 mb-1 object-contain"/>
            <h2 className="text-xl font-bold leading-tight tracking-tight -ml-3">niSpace</h2>
          </NavLink>
          <nav className="hidden lg:flex items-center gap-6">
            <NavLink to="/dashboard" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              Dashboard
            </NavLink>
            <NavLink to="/unimarket" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              Marketplace
            </NavLink>
            <NavLink to="/ai-tool" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              UniDoc
            </NavLink>
            <NavLink to="/uni-doc" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              StudyHub
            </NavLink>
            <NavLink to="/campusfeed" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              CampusFeed
            </NavLink>
            <NavLink to="/uni-wallet" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              Wallet
            </NavLink>
            <NavLink to="/student-referral" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              Referral
            </NavLink>
            <NavLink to="/pricing" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'}`}>
              Pricing
            </NavLink>
          </nav>
        </div>
        <div className="flex flex-1 justify-end items-center gap-3 sm:gap-6">
          <button onClick={toggleDarkMode} className="flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white hover:dark:text-green-400" aria-label="Toggle dark mode">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>

          {currentUser ? (
            <>
              <button onClick={() => navigate('/notifications')} className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white hover:dark:text-green-400">
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
              {verified ? (
                <button onClick={() => navigate('/inbox')} className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white hover:dark:text-green-400">
                  <span className="material-symbols-outlined">mail</span>
                  {unreadCount > 0 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </button>
              ) : (
                <button onClick={() => {
                  if (verifyingLoading) return toast('Checking verification...');
                  if (status === 'failed') return toast.error('Your verification failed. Please reupload documents or contact support.');
                  toast('Complete verification to access Inbox');
                }} className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-background-light/60 dark:bg-slate-800/60 text-secondary dark:text-white hover:dark:text-green-400" title="Locked until verified">
                  <span className="material-symbols-outlined">mail</span>
                </button>
              )}
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800">
                  <div className="bg-center bg-no-repeat w-8 h-8 rounded-full bg-cover" style={{backgroundImage: `url("${userAvatar}")`}}></div>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-lg py-1 z-10">
                    <button onClick={() => navigate('/edit-profile')} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800">Profile</button>
                    <button onClick={() => navigate('/settings')} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800">Settings</button>
                    <button onClick={() => navigate(registerAs === 'student' ? '/unispace-upgrade' : '/guest-upgrade')} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800">Premium</button>
                    <button onClick={async () => { await auth.signOut(); navigate('/'); setIsProfileOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800">Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-transparent border border-secondary text-secondary text-sm font-bold tracking-wide hover:bg-secondary/10">
                Login
              </NavLink>
              <NavLink to="/signup" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold tracking-wide hover:bg-primary/90">
                Sign Up
              </NavLink>
            </>
          )}

          <div className="lg:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-secondary">
              <span className="material-symbols-outlined text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <nav className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 py-2 flex flex-col items-center gap-2">
          <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            Dashboard
          </NavLink>
          <NavLink to="/unimarket" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            Marketplace
          </NavLink>
          <NavLink to="/uni-doc" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            StudyHub
          </NavLink>
          <NavLink to="/ai-tool" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            UniDoc
          </NavLink>
          <NavLink to="/campusfeed" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            CampusFeed
          </NavLink>
          <NavLink to="/uni-wallet" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            Wallet
          </NavLink>
          <NavLink to="/student-referral" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            Referral
          </NavLink>
          <NavLink to="/pricing" onClick={() => setIsMenuOpen(false)} className={({isActive}) => `w-full text-center px-4 py-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white dark:hover:text-green-400 hover:bg-background-light dark:hover:bg-slate-800'}`}>
            Pricing
          </NavLink>
          {!currentUser && (
            <div className='flex items-center gap-4 px-4 py-3 mt-2'>
              <NavLink to="/login" onClick={() => setIsMenuOpen(false)} className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-transparent border border-secondary text-secondary font-bold">
                Login
              </NavLink>
              <NavLink to="/signup" onClick={() => setIsMenuOpen(false)} className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white font-bold">
                Sign Up
              </NavLink>
            </div>
          )}
        </nav>
      )}
    </>
  );
};

export default AppHeader;


