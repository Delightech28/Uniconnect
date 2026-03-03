import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { getDefaultAvatar } from '../services/avatarService';

/**
 * GenderSelectionModal
 * Modal that appears for users who haven't set their gender yet
 * Can be triggered on app load or from notifications
 */
const GenderSelectionModal = ({ isOpen, userId, onClose, onComplete }) => {
  const [selectedGender, setSelectedGender] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedGender) {
      toast.error('Please select your gender');
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', userId);
      const defaultAvatar = getDefaultAvatar(selectedGender);

      // Update user document with gender and set default avatar if not already set
      const updates = {
        gender: selectedGender,
        updatedAt: serverTimestamp(),
      };

      // Only set default avatar if user doesn't already have an avatar URL
      const userDoc = await auth.currentUser?.getIdTokenResult();
      updates.avatarUrl = defaultAvatar;

      await updateDoc(userRef, updates);

      toast.success(`Gender set to ${selectedGender}! 🎉`);
      setSelectedGender(null);

      // Call completion callback
      if (onComplete) {
        onComplete(selectedGender);
      }

      onClose();
    } catch (err) {
      console.error('Error setting gender:', err);
      toast.error('Failed to save gender. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-secondary dark:text-white">
            Complete Your Profile
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Please select your gender to complete your profile setup.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Male Option */}
          <label
            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedGender === 'male'
                ? 'border-primary bg-primary/10'
                : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
            }`}
          >
            <input
              type="radio"
              name="gender"
              value="male"
              checked={selectedGender === 'male'}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-5 h-5 cursor-pointer"
            />
            <div>
              <p className="font-semibold text-secondary dark:text-white">♂️ Male</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Personalize your experience
              </p>
            </div>
          </label>

          {/* Female Option */}
          <label
            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedGender === 'female'
                ? 'border-primary bg-primary/10'
                : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
            }`}
          >
            <input
              type="radio"
              name="gender"
              value="female"
              checked={selectedGender === 'female'}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-5 h-5 cursor-pointer"
            />
            <div>
              <p className="font-semibold text-secondary dark:text-white">♀️ Female</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Personalize your experience
              </p>
            </div>
          </label>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedGender || isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenderSelectionModal;
