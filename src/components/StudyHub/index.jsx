import React, { useState } from 'react';
import StudyHubApp from './App';

/**
 * StudyHub Index - Entry point for StudyHub module
 * Manages dark mode state and renders the main application
 */
const StudyHub = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('studyhub-darkmode');
    if (saved !== null) return JSON.parse(saved);
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('studyhub-darkmode', JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <StudyHubApp 
      darkMode={darkMode} 
      toggleDarkMode={toggleDarkMode} 
    />
  );
};

export default StudyHub;
