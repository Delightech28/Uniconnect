import { useEffect } from 'react';

function DarkModeProvider({ children }) {
  useEffect(() => {
    // Add dark mode class to html element by default
    document.documentElement.classList.add('dark');
  }, []);

  return children;
}

export default DarkModeProvider;