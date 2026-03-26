import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const getInitialTheme = () => {
  try {
    const saved = window.localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
};

export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(() => getInitialTheme());

  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (typeof userData.darkMode === 'boolean') {
              setDarkMode(userData.darkMode);
              window.localStorage.setItem('darkMode', userData.darkMode ? 'true' : 'false');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      window.localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    
    // Update localStorage immediately for instant UI response
    try {
      window.localStorage.setItem('darkMode', next ? 'true' : 'false');
    } catch (e) {
      // ignore
    }

    // Save to Firestore in background (don't wait for it)
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { darkMode: next })
        .catch(error => console.error('Error updating theme preference:', error));
    }
  };

  return { darkMode, toggleTheme };
};