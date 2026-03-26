import { useEffect } from 'react';

function DarkModeProvider({ children }) {
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('darkMode');
      const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = saved !== null ? saved === 'true' : prefers;
      if (dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (e) {
      // ignore
    }
  }, []);

  return children;
}

export default DarkModeProvider;