import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ComingSoonOverlay.css';
import { X } from 'lucide-react';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { useTheme } from '../hooks/useTheme';

/**
 * ComingSoonOverlay Component
 * Shows a countdown timer (5 days) for features under development
 * Auto-removes when countdown completes
 */
const ComingSoonOverlay = ({ featureName = 'Feature', onClose }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    // Initialize countdown: 3 days from now
    const initializeCountdown = () => {
      const storageKey = 'comingSoonDeadline';
      let deadline = localStorage.getItem(storageKey);

      if (!deadline) {
        // Set deadline to 6 days from now
        deadline = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).getTime();
        localStorage.setItem(storageKey, deadline);
      } else {
        deadline = parseInt(deadline, 10);
      }

      return deadline;
    };

    const deadline = initializeCountdown();

    // Update countdown every second
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = deadline - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setShowOverlay(false);
        // Clear the deadline from localStorage
        localStorage.removeItem('comingSoonDeadline');
        clearInterval(interval);
        if (onClose) onClose();
        return;
      }

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showOverlay || isExpired) {
    return null;
  }

  const handleClose = () => {
    setShowOverlay(false);
    navigate('/dashboard');
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <AppHeader darkMode={darkMode} toggleDarkMode={() => {}} />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="coming-soon-overlay" style={{ position: 'static', background: 'none' }}>
          <div className="coming-soon-container">
            {/* Close Button */}
            <button className="close-btn" onClick={handleClose} aria-label="Close">
              <X className="w-6 h-6" />
            </button>

            {/* Main Content */}
            <div className="content-wrapper">
              {/* Animated Icon */}
              <div className="icon-container">
                <div className="animated-icon">✨</div>
              </div>

              {/* Heading */}
              <h1 className="coming-soon-title">
                {featureName} Coming Soon
              </h1>

              {/* Description */}
              <p className="coming-soon-description">
                We're working hard to bring you amazing features! Stay tuned for updates.
              </p>

              {/* Countdown Timer */}
              {timeLeft && (
                <div className="countdown-container">
                  <p className="timer-label">Available in:</p>

                  <div className="timer-grid">
                    {/* Days */}
                    <div className="timer-unit">
                      <div className="timer-box days-box">
                        <span className="timer-value">{String(timeLeft.days).padStart(2, '0')}</span>
                      </div>
                      <span className="timer-label-small">Days</span>
                    </div>

                    {/* Hours */}
                    <div className="timer-unit">
                      <div className="timer-box hours-box">
                        <span className="timer-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                      </div>
                      <span className="timer-label-small">Hours</span>
                    </div>

                    {/* Minutes */}
                    <div className="timer-unit">
                      <div className="timer-box minutes-box">
                        <span className="timer-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      </div>
                      <span className="timer-label-small">Minutes</span>
                    </div>

                    {/* Seconds */}
                    <div className="timer-unit">
                      <div className="timer-box seconds-box">
                        <span className="timer-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                      </div>
                      <span className="timer-label-small">Seconds</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <button className="notify-btn" onClick={handleClose}>
                Got it, take me back
              </button>

              {/* Decorative Elements */}
              <div className="stars">
                <div className="star star-1">⭐</div>
                <div className="star star-2">⭐</div>
                <div className="star star-3">⭐</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default ComingSoonOverlay;
