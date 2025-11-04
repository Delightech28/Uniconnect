import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // If theme preference exists, use it; otherwise default to dark
            setDarkMode(userData.darkMode ?? true);
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
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          darkMode: !darkMode
        });
      }
      setDarkMode(!darkMode);
    } catch (error) {
      console.error('Error updating theme preference:', error);
    }
  };

  return { darkMode, toggleTheme };
};