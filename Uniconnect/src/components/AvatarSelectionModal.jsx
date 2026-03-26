import React, { useState } from 'react';
import { getSelectableAvatars } from '../services/avatarService';
import toast from 'react-hot-toast';

/**
 * AvatarSelectionModal
 * Displays gender-based avatar options for user selection
 */
const AvatarSelectionModal = ({ isOpen, gender, onClose, onSelectAvatar }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const avatars = getSelectableAvatars(gender);

  if (!isOpen) return null;

  const handleSelect = (avatarId) => {
    setSelectedAvatar(avatarId);
  };

  const handleConfirm = () => {
    if (!selectedAvatar) {
      toast.error('Please select an avatar');
      return;
    }
    onSelectAvatar(selectedAvatar);
    setSelectedAvatar(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-secondary p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-secondary dark:text-white">
            Choose Your Avatar
          </h3>
          <button
            onClick={onClose}
            className="text-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Select one of the avatars below. You can change it anytime.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {avatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleSelect(avatar.id)}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedAvatar === avatar.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/50'
                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                }`}
              >
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="w-full h-24 object-cover rounded"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 text-center">
                  {avatar.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3 sticky bottom-0 bg-white dark:bg-secondary">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            disabled={!selectedAvatar}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
