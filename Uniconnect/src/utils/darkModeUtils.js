// Utility functions for dark mode management
// Use this in any component to avoid relying solely on the global hook

const getInitialTheme = () => {
  try {
    const saved = window.localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
};

export const initDarkMode = (setDarkMode) => {
  // Set initial theme from localStorage
  const initial = getInitialTheme();
  setDarkMode(initial);
  
  // Apply to DOM immediately
  const root = window.document.documentElement;
  if (initial) root.classList.add('dark');
  else root.classList.remove('dark');
};

export const toggleDarkModeLocal = (currentMode, setDarkMode) => {
  const next = !currentMode;
  setDarkMode(next);
  
  // Update DOM immediately
  const root = window.document.documentElement;
  if (next) root.classList.add('dark');
  else root.classList.remove('dark');
  
  // Update localStorage immediately for instant response
  try {
    window.localStorage.setItem('darkMode', next ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving theme preference:', e);
  }
};

export const syncDarkMode = (darkMode) => {
  // Sync dark mode with HTML element
  const root = window.document.documentElement;
  if (darkMode) root.classList.add('dark');
  else root.classList.remove('dark');
};
