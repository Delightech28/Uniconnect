import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AppHeader = ({ darkMode, toggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://via.placeholder.com/40');
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch current user's avatar from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().avatarUrl) {
            setUserAvatar(userDoc.data().avatarUrl);
          }
        } catch (err) {
          if (err && err.code === 'permission-denied') {
            console.warn('Permission denied when fetching user avatar; using placeholder');
            setUserAvatar('https://via.placeholder.com/40');
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

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-700 px-4 sm:px-10 py-3 bg-white dark:bg-secondary">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-4 text-secondary dark:text-white">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path></svg>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight">UniConnect</h2>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-secondary dark:text-white hover:text-primary">Dashboard</button>
            <button onClick={() => navigate('/unimarket')} className="text-sm font-bold text-primary">Marketplace</button>
            <button onClick={() => navigate('/study-hub')} className="text-sm font-medium text-secondary dark:text-white hover:text-primary">Study Hub</button>
            <button onClick={() => navigate('/uni-wallet')} className="text-sm font-medium text-secondary dark:text-white hover:text-primary">Wallet</button>
          </nav>
        </div>
        <div className="flex flex-1 justify-end items-center gap-3 sm:gap-6">
          <button onClick={toggleDarkMode} className="flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white" aria-label="Toggle dark mode">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => navigate('/notifications')} className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>
          <button onClick={() => navigate('/inbox')} className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white">
            <span className="material-symbols-outlined">mail</span>
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: `url("${userAvatar}")`}}></div>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary rounded-md shadow-lg py-1 z-10">
                <button onClick={() => navigate('/edit-profile')} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Profile</button>
                <button onClick={() => navigate('/settings')} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Settings</button>
              </div>
            )}
          </div>
          <div className="lg:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-secondary dark:text-white">
              <span className="material-symbols-outlined text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <nav className="lg:hidden bg-white dark:bg-secondary border-b border-slate-200 dark:border-slate-700 py-2">
          <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Dashboard</button>
          <button onClick={() => { navigate('/unimarket'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Marketplace</button>
          <button onClick={() => { navigate('/study-hub'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Study Hub</button>
          <button onClick={() => { navigate('/uni-wallet'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Wallet</button>
        </nav>
      )}
    </>
  );
};

export default AppHeader;
