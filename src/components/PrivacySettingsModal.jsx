import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getDefaultPrivacySettings, updatePrivacySettings, getPrivacySettings } from '../services/profileService';

const PrivacySettingsModal = ({ userId, isOpen, onClose }) => {
  const [settings, setSettings] = useState(getDefaultPrivacySettings());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPrivacySettings();
    }
  }, [userId, isOpen]);

  const fetchPrivacySettings = async () => {
    setFetching(true);
    try {
      const userSettings = await getPrivacySettings(userId);
      setSettings(userSettings);
    } catch (err) {
      console.error('Error fetching privacy settings:', err);
      setSettings(getDefaultPrivacySettings());
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePrivacySettings(userId, settings);
      toast.success('Privacy settings updated successfully!');
      onClose();
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-secondary p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-secondary dark:text-white">
            Privacy Settings
          </h3>
          <button
            onClick={onClose}
            className="text-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {fetching ? (
          <div className="p-6 text-center text-slate-500">Loading privacy settings...</div>
        ) : (
          <div className="p-6 space-y-8">
            {/* ===== PROFILE VISIBILITY SECTION ===== */}
            <section>
              <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-4">Profile Visibility</h4>
              <div className="space-y-4">
                {/* Profile Visibility */}
                <div>
                  <label className="block text-sm font-semibold text-secondary dark:text-white mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={settings.profileVisibility}
                    onChange={(e) => handleChange('profileVisibility', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary dark:text-white text-sm"
                  >
                    <option value="public">🌐 Public (Anyone can view your profile)</option>
                    <option value="verified-only">✓ Verified Only (Only verified students)</option>
                    <option value="private">🔒 Private (Only followers)</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Who can see your profile and details
                  </p>
                </div>

                {/* Search Discoverability */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.searchable}
                      onChange={(e) => handleChange('searchable', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Show in Search Results</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Let others find you in search</p>
                    </div>
                  </label>
                </div>

                {/* Recommendations */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.includeInRecommendations}
                      onChange={(e) => handleChange('includeInRecommendations', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Show in Recommendations</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Appear in recommended users</p>
                    </div>
                  </label>
                </div>

                {/* Follow Permission */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canBeFollowed}
                      onChange={(e) => handleChange('canBeFollowed', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Allow Others to Follow You</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Let people add you to their followers</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* ===== MESSAGING SECTION ===== */}
            <section>
              <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-4">Messaging & Communication</h4>
              <div className="space-y-4">
                {/* Message Filter */}
                <div>
                  <label className="block text-sm font-semibold text-secondary dark:text-white mb-2">
                    Who Can Message You?
                  </label>
                  <select
                    value={settings.messageFilter}
                    onChange={(e) => handleChange('messageFilter', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary dark:text-white text-sm"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers-only">Followers Only</option>
                    <option value="verified-only">Verified Users Only</option>
                    <option value="none">Nobody (Disabled)</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Control who can send you direct messages
                  </p>
                </div>

                {/* Message Approval */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.requireApprovalForMessages}
                      onChange={(e) => handleChange('requireApprovalForMessages', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Approve Messages Before Reading</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Review new messages from non-followers first</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* ===== INTERACTION SECTION ===== */}
            <section>
              <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-4">Interactions</h4>
              <div className="space-y-4">
                {/* Likes */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canBeLiked}
                      onChange={(e) => handleChange('canBeLiked', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Allow Likes on Your Profile</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Let others like your profile</p>
                    </div>
                  </label>
                </div>

                {/* Tagging */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canBeTagged}
                      onChange={(e) => handleChange('canBeTagged', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Allow Others to Tag You</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Let users mention you in posts</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* ===== CONTENT VISIBILITY SECTION ===== */}
            <section>
              <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-4">What Others Can See</h4>
              <div className="space-y-4">
                {/* Stats */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canSeeUserStats}
                      onChange={(e) => handleChange('canSeeUserStats', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Show My Stats</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Display followers, sales, and activity count</p>
                    </div>
                  </label>
                </div>

                {/* Posts */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canSeeUserPosts}
                      onChange={(e) => handleChange('canSeeUserPosts', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Show My Posts</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Allow viewing your campus feed posts</p>
                    </div>
                  </label>
                </div>

                {/* Marketplace Items */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canSeeUserItems}
                      onChange={(e) => handleChange('canSeeUserItems', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Show My Marketplace Items</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Display your listed items for sale</p>
                    </div>
                  </label>
                </div>

                {/* Followers */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canSeeFollowers}
                      onChange={(e) => handleChange('canSeeFollowers', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Show My Followers List</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Let others view who follows you</p>
                    </div>
                  </label>
                </div>

                {/* Transaction History */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.canSeeTransactionHistory}
                      onChange={(e) => handleChange('canSeeTransactionHistory', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Show My Transaction History</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Display your past sales and purchases</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* ===== REQUESTS SECTION ===== */}
            <section>
              <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-4">Marketplace Requests</h4>
              <div className="space-y-4">
                {/* Buyer Requests */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.allowBuyerRequests}
                      onChange={(e) => handleChange('allowBuyerRequests', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Accept Buyer Requests</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Let others send you buying offers</p>
                    </div>
                  </label>
                </div>

                {/* Seller Requests */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.allowSellerRequests}
                      onChange={(e) => handleChange('allowSellerRequests', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-secondary dark:text-white">Accept Seller Requests</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Let buyers request items from you</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="sticky bottom-0 border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-secondary flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || fetching}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};;

export default PrivacySettingsModal;
