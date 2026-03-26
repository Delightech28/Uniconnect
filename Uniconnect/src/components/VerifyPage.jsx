import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyUserByToken } from '../services/verificationService';
import { useTheme } from '../hooks/useTheme';
import toast from 'react-hot-toast';

const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const processVerification = async () => {
      try {
        const token = searchParams.get('token');
        const action = searchParams.get('action');
        const userId = searchParams.get('userId');

        if (!token || !action || !userId) {
          setMessage('Invalid verification link. Missing required parameters.');
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        if (!['approve', 'reject'].includes(action)) {
          setMessage('Invalid action. Only "approve" or "reject" are allowed.');
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        // Call the verification service
        const result = await verifyUserByToken(token, action, userId);
        
        setMessage(
          action === 'approve'
            ? '✅ User has been approved! They will receive a confirmation email shortly.'
            : '❌ User request has been rejected. They will receive a notification shortly.'
        );
        setIsSuccess(true);
        
        // Show completion after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 4000);

      } catch (error) {
        console.error('Verification error:', error);
        setMessage(`❌ Verification failed: ${error.message}`);
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    processVerification();
  }, [searchParams, navigate]);

  return (
    <div className={`flex items-center justify-center min-h-screen ${
      darkMode ? 'bg-background-dark' : 'bg-background-light'
    }`}>
      <div className={`flex flex-col items-center gap-6 p-8 rounded-lg border ${
        darkMode 
          ? 'bg-content-dark border-border-dark' 
          : 'bg-content-light border-border-light'
      } max-w-md w-full`}>
        {loading ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              <span 
                className="material-symbols-outlined !text-5xl animate-spin"
                style={{ animationDuration: '2s' }}
              >
                hourglass_top
              </span>
            </div>
            <p className={`text-lg font-semibold ${
              darkMode ? 'text-text-primary-dark' : 'text-text-primary-light'
            }`}>
              Processing verification...
            </p>
          </>
        ) : (
          <>
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isSuccess ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}>
              <span className="material-symbols-outlined !text-5xl">
                {isSuccess ? 'check_circle' : 'error'}
              </span>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold mb-2 ${
                darkMode ? 'text-text-primary-dark' : 'text-text-primary-light'
              }`}>
                {isSuccess ? 'Verification Complete' : 'Verification Failed'}
              </p>
              <p className={`text-base leading-relaxed ${
                darkMode ? 'text-text-secondary-dark' : 'text-text-secondary-light'
              }`}>
                {message}
              </p>
            </div>
            <p className={`text-sm ${
              darkMode ? 'text-text-secondary-dark' : 'text-text-secondary-light'
            }`}>
              Redirecting you back to home in a moment...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
