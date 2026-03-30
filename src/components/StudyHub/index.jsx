import React from 'react';
import StudyHubApp from './App';
import { useTheme } from '../../hooks/useTheme';

/**
 * StudyHub Index - Entry point for StudyHub module
 * Uses global dark mode state via useTheme hook
 */
const StudyHub = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <StudyHubApp 
      darkMode={darkMode} 
      toggleDarkMode={toggleTheme} 
    />
  );
};

export default StudyHub;
