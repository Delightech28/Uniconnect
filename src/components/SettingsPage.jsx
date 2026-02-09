 import React, { useState, useEffect } from 'react'; 
 import { auth, db } from '../firebase';
 import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
 import { onAuthStateChanged } from 'firebase/auth';
 import { useTheme } from '../hooks/useTheme';
 import AppHeader from './AppHeader';
 import { useNavigate } from 'react-router-dom';
 import Footer from './Footer';
import { getPrivacySettings, updatePrivacySettings } from '../services/profileService';
import toast from 'react-hot-toast'; 
// --- Static Data (No Backend) --- 
const initialSettings = { 
  email: 'adekunle.a@university.edu.ng', 
  passwordLastChanged: '3 months ago', 
  notifications: { 
    email: true, 
    marketplace: true, 
    chat: true, 
    reminders: false, 
  }, 
  theme: 'light', // 'light', 'dark', or 'system' 
  fontSize: 2, // 1 to 5 
}; 
 
const navItems = [ 
    { id: 'account', label: 'Account', icon: 'person' }, 
    { id: 'privacy', label: 'Privacy', icon: 'lock' }, 
    { id: 'theme', label: 'Theme & Display', icon: 'palette' }, 
    { id: 'help', label: 'Help & Support', icon: 'help_center' }, 
]; 
 
// --- Helper Components --- 
const ToggleSwitch = ({ checked, onChange }) => ( 
    <label className="relative inline-flex items-center cursor-pointer"> 
        <input type="checkbox" checked={checked} 
onChange={onChange} className="sr-only peer" /> 
 

        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 
rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 
dark:peer-focus:ring-primary/80 peer-checked:after:translate-x-full 
peer-checked:after:border-white after:content-[''] after:absolute 
after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 
after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
dark:border-slate-600 peer-checked:bg-primary"></div> 
    </label> 
);

// Helper function to format timestamp to relative time
const formatTimestampToRelative = (timestamp) => {
    if (!timestamp) return 'Never changed';
    
    const changeDate = new Date(timestamp.toDate?.() || timestamp);
    const now = new Date();
    const diffInMs = now - changeDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    if (diffInMonths > 0) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return 'Today';
};
 
const SettingsSection = ({ title, description, children }) => ( 
    <section className="mb-8"> 
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-secondary dark:text-white 
mb-1">{title}</h2> 
        <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 
mb-6">{description}</p> 
        <div className="space-y-4"> 
            {children} 
        </div> 
    </section> 
); 
 
 
// --- Main Page Component --- 
function SettingsPage() { 
    const [settings, setSettings] = useState(initialSettings); 
    const [privacySettings, setPrivacySettings] = useState({});
    const [activeTab, setActiveTab] = useState('account');
    const [privacySaving, setPrivacySaving] = useState(false);
    const [privacyLoading, setPrivacyLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [editingPhone, setEditingPhone] = useState(false);
    const [savingPhone, setSavingPhone] = useState(false);
    const [username, setUsername] = useState('');
    const [editingUsername, setEditingUsername] = useState(false);
    const [savingUsername, setSavingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const navigate = useNavigate(); 
 
    // Use global theme hook so the settings page stays in sync with the app
    const { darkMode, toggleTheme } = useTheme();

    // Fetch saved settings (including fontSize, email, and passwordLastChanged) from Firestore on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch email from Firebase Auth
                    if (user.email) {
                        setSettings(prev => ({ ...prev, email: user.email }));
                    }
                    
                    // Fetch additional settings from Firestore
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log('User data from Firestore:', userData);
                        
                        if (userData.fontSize) {
                            setSettings(prev => ({ ...prev, fontSize: userData.fontSize }));
                        }
                        
                        if (userData.phone) {
                            setPhoneNumber(userData.phone);
                        }
                        
                        if (userData.username) {
                            setUsername(userData.username);
                        }
                        
                        if (userData.passwordLastChanged) {
                            const formattedTime = formatTimestampToRelative(userData.passwordLastChanged);
                            console.log('Password last changed formatted:', formattedTime);
                            setSettings(prev => ({ ...prev, passwordLastChanged: formattedTime }));
                        } else {
                            console.log('No passwordLastChanged field in Firestore');
                        }
                    } else {
                        console.log('User document does not exist');
                    }

                    // Fetch privacy settings
                    try {
                        setPrivacyLoading(true);
                        const privacySettings = await getPrivacySettings(user.uid);
                        setPrivacySettings(privacySettings);
                    } catch (err) {
                        console.error('Error fetching privacy settings:', err);
                    } finally {
                        setPrivacyLoading(false);
                    }
                } catch (error) {
                    console.error('Error fetching settings from Firestore:', error);
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    // Keep local settings.theme in sync with the global darkMode
    useEffect(() => {
        setSettings(prev => ({ ...prev, theme: darkMode ? 'dark' : 'light' }));
    }, [darkMode]);

    // Apply the selected font size globally so the whole app respects this setting
    useEffect(() => {
        // Conservative font-size mapping: clamp sizes to prevent overlapping/bizarre layouts
        // 1=smaller, 2=default, 3=medium, 4=large, 5=largest (max 19px to maintain mobile UX)
        const sizeMap = { 1: 14, 2: 16, 3: 17, 4: 18, 5: 19 };
        const fontSize = Math.max(14, Math.min(19, sizeMap[settings.fontSize] ?? 16));
        // Set the root font-size (affects rem-based typography)
        document.documentElement.style.fontSize = `${fontSize}px`;
    }, [settings.fontSize]);
 
 

    const handleNotificationChange = (key) => { 
        setSettings(prev => ({ 
            ...prev, 
            notifications: { 
                ...prev.notifications, 
                [key]: !prev.notifications[key], 
            }, 
        })); 
    }; 
 
    const handleThemeChange = (theme) => {
        // Update local state for immediate UI response
        setSettings(prev => ({ ...prev, theme }));
        // Ensure the global theme matches the selection
        if (theme === 'dark' && !darkMode) toggleTheme();
        if (theme === 'light' && darkMode) toggleTheme();
        // 'system' option would be implemented here if needed
    };
 
    const handleFontSizeChange = async (e) => {
        const newFontSize = parseInt(e.target.value, 10);
        setSettings(prev => ({ ...prev, fontSize: newFontSize }));
        
        // Persist the font size to Firestore
        try {
            const user = auth.currentUser;
            if (user) {
                await updateDoc(doc(db, 'users', user.uid), {
                    fontSize: newFontSize
                });
            }
        } catch (error) {
            console.error('Error updating fontSize in Firestore:', error);
        }
    };

    const handlePhoneNumberSave = async () => {
        try {
            setSavingPhone(true);
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            // Validate phone number
            if (!phoneNumber.trim()) {
                toast.error('Please enter a valid phone number');
                return;
            }

            await updateDoc(doc(db, 'users', user.uid), {
                phone: phoneNumber.trim(),
            });

            setEditingPhone(false);
            toast.success('Phone number saved successfully!');
        } catch (error) {
            console.error('Error saving phone number:', error);
            toast.error('Failed to save phone number');
        } finally {
            setSavingPhone(false);
        }
    };

    const handleUsernameSave = async () => {
        try {
            setSavingUsername(true);
            setUsernameError('');
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const newUsername = username.trim().toLowerCase();

            // Validate username
            if (!newUsername) {
                setUsernameError('Username cannot be empty');
                return;
            }

            if (newUsername.length < 3) {
                setUsernameError('Username must be at least 3 characters');
                return;
            }

            if (newUsername.length > 20) {
                setUsernameError('Username must be less than 20 characters');
                return;
            }

            // Check if username contains only alphanumeric characters and underscores
            if (!/^[a-z0-9_]+$/.test(newUsername)) {
                setUsernameError('Username can only contain letters, numbers, and underscores');
                return;
            }

            // Check if username is already taken by another user
            const usernameQuery = query(
                collection(db, 'users'),
                where('username', '==', newUsername)
            );
            const snapshot = await getDocs(usernameQuery);
            
            if (!snapshot.empty && snapshot.docs[0].id !== user.uid) {
                setUsernameError('Username is already taken');
                return;
            }

            await updateDoc(doc(db, 'users', user.uid), {
                username: newUsername,
            });

            setEditingUsername(false);
            toast.success('Username updated successfully!');
        } catch (error) {
            console.error('Error saving username:', error);
            toast.error('Failed to save username');
        } finally {
            setSavingUsername(false);
        }
    };

    // Privacy Settings Handlers
    const handlePrivacySettingChange = (setting, value) => {
        setPrivacySettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const handlePrivacySettingsSave = async () => {
        try {
            setPrivacySaving(true);
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            await updatePrivacySettings(user.uid, privacySettings);
            toast.success('Privacy settings saved successfully!');
        } catch (error) {
            console.error('Error saving privacy settings:', error);
            toast.error('Failed to save privacy settings');
        } finally {
            setPrivacySaving(false);
        }
    }; 
     
    // In a real app with routing, each of these would be a separate component.
    const renderContent = () => { 
        switch (activeTab) { 
            case 'account':
                return (
                    <SettingsSection title="Account Settings" description="Manage your account information and notification preferences.">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-secondary dark:text-white">Email Address</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{settings.email}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex-1">
                                <h3 className="text-sm sm:text-base font-semibold text-secondary dark:text-white">Username</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {username ? `@${username}` : 'No username set'}
                                </p>
                                {!username && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        Set a username to receive money from other users
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setEditingUsername(!editingUsername);
                                    setUsernameError('');
                                }}
                                className="mt-2 sm:mt-0 text-xs sm:text-sm font-medium text-primary hover:underline self-start sm:self-center"
                            >
                                {editingUsername ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {editingUsername && (
                            <div className="py-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <label className="block text-sm font-medium text-secondary dark:text-white mb-2">
                                    Enter Username
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400">@</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => {
                                                    setUsername(e.target.value);
                                                    setUsernameError('');
                                                }}
                                                placeholder="username"
                                                className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                maxLength={20}
                                            />
                                        </div>
                                        {usernameError && (
                                            <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            3-20 characters, letters, numbers, and underscores only
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleUsernameSave}
                                        disabled={savingUsername}
                                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {savingUsername ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex-1">
                                <h3 className="text-sm sm:text-base font-semibold text-secondary dark:text-white">Phone Number</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {phoneNumber ? phoneNumber : 'No phone number added'}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingPhone(!editingPhone)}
                                className="mt-2 sm:mt-0 text-xs sm:text-sm font-medium text-primary hover:underline self-start sm:self-center"
                            >
                                {editingPhone ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {editingPhone && (
                            <div className="py-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <label className="block text-sm font-medium text-secondary dark:text-white mb-2">
                                    Enter Phone Number
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="e.g., 08012345678"
                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        onClick={handlePhoneNumberSave}
                                        disabled={savingPhone}
                                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {savingPhone ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Your phone number is used for creating your virtual bank account and improving your wallet experience.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-secondary dark:text-white">Password</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Last changed {settings.passwordLastChanged}</p>
                            </div>
                            <button onClick={() => navigate('/change-password')} className="mt-2 sm:mt-0 text-xs sm:text-sm font-medium text-primary hover:underline self-start sm:self-center">Change</button>
                        </div>

                        <div className="py-4">
                            <h3 className="text-base sm:text-lg font-semibold text-secondary dark:text-white mb-1">Notification Preferences</h3>
                            <div className="space-y-4 pt-4">
                                <div className="flex items-start justify-between">
                                    <div className="max-w-md">
                                        <h4 className="text-xs sm:text-sm font-medium text-secondary dark:text-white">Email Notifications</h4>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Receive important updates, digests, and marketing communications via email.</p>
                                    </div>
                                    <ToggleSwitch checked={settings.notifications.email} onChange={() => handleNotificationChange('email')} />
                                </div>
                                {/* ... more toggles */}
                            </div>
                        </div>
                    </SettingsSection>

                );
            case 'privacy':
                return (
                    <SettingsSection title="Privacy & Safety" description="Control who can see your profile and interact with you.">
                        {privacyLoading ? (
                            <div className="text-center py-8 text-slate-500">Loading privacy settings...</div>
                        ) : (
                            <div className="space-y-8">
                                {/* Profile Visibility */}
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-secondary dark:text-white mb-4">Profile Visibility</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-secondary dark:text-white mb-2">
                                                Who can see your profile?
                                            </label>
                                            <select
                                                value={privacySettings.profileVisibility || 'public'}
                                                onChange={(e) => handlePrivacySettingChange('profileVisibility', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary dark:text-white"
                                            >
                                                <option value="public">🌐 Public (Anyone can view)</option>
                                                <option value="verified-only">✓ Verified Only (Only verified students)</option>
                                                <option value="private">🔒 Private (Only followers)</option>
                                            </select>
                                        </div>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.searchable !== false}
                                                onChange={(e) => handlePrivacySettingChange('searchable', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Show in Search Results</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Let others find you in search</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.includeInRecommendations !== false}
                                                onChange={(e) => handlePrivacySettingChange('includeInRecommendations', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Show in Recommendations</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Appear in recommended users</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canBeFollowed !== false}
                                                onChange={(e) => handlePrivacySettingChange('canBeFollowed', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Allow Others to Follow You</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Let people add you to their followers</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Messaging & Communication */}
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-secondary dark:text-white mb-4">Messaging & Communication</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-secondary dark:text-white mb-2">
                                                Who can message you?
                                            </label>
                                            <select
                                                value={privacySettings.messageFilter || 'everyone'}
                                                onChange={(e) => handlePrivacySettingChange('messageFilter', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary dark:text-white"
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

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.requireApprovalForMessages !== true}
                                                onChange={(e) => handlePrivacySettingChange('requireApprovalForMessages', !e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Messages Go Directly to Inbox</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Uncheck to require approval before reading</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Interactions */}
                                <div>
                                    <h3 className="font-semibold text-secondary dark:text-white mb-4">Interactions</h3>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canBeLiked !== false}
                                                onChange={(e) => handlePrivacySettingChange('canBeLiked', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Allow Likes on Your Profile</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Let others like your profile</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canBeTagged !== false}
                                                onChange={(e) => handlePrivacySettingChange('canBeTagged', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Allow Others to Tag You</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Let users mention you in posts</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Content Visibility */}
                                <div>
                                    <h3 className="font-semibold text-secondary dark:text-white mb-4">What Others Can See</h3>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canSeeUserStats !== false}
                                                onChange={(e) => handlePrivacySettingChange('canSeeUserStats', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Show My Stats</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Display followers, sales, and activity</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canSeeUserPosts !== false}
                                                onChange={(e) => handlePrivacySettingChange('canSeeUserPosts', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Show My Posts</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Allow viewing your campus feed posts</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canSeeUserItems !== false}
                                                onChange={(e) => handlePrivacySettingChange('canSeeUserItems', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Show My Marketplace Items</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Display your listed items for sale</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canSeeFollowers !== false}
                                                onChange={(e) => handlePrivacySettingChange('canSeeFollowers', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Show My Followers List</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Let others view who follows you</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.canSeeTransactionHistory !== true}
                                                onChange={(e) => handlePrivacySettingChange('canSeeTransactionHistory', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Show My Transaction History</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Display your past sales and purchases</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Marketplace Requests */}
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-secondary dark:text-white mb-4">Marketplace Requests</h3>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.allowBuyerRequests !== false}
                                                onChange={(e) => handlePrivacySettingChange('allowBuyerRequests', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Accept Buyer Requests</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Let others send you buying offers</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacySettings.allowSellerRequests !== false}
                                                onChange={(e) => handlePrivacySettingChange('allowSellerRequests', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-secondary dark:text-white">Accept Seller Requests</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Let buyers request items from you</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex gap-3 pt-6">
                                    <button
                                        onClick={handlePrivacySettingsSave}
                                        disabled={privacySaving}
                                        className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {privacySaving ? 'Saving...' : 'Save Privacy Settings'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </SettingsSection>
                );
            case 'theme': 
                return ( 
                    <SettingsSection title="Theme & Display" 
description="Customize the look and feel of the app."> 
                        <div className="flex flex-col sm:flex-row 
sm:items-center justify-between py-4 border-b border-slate-200 
dark:border-slate-700"> 
                            <div> 
                                <h3 className="text-sm sm:text-base font-semibold text-secondary 
dark:text-white">Appearance</h3> 
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Choose light or dark theme.</p> 
                            </div> 
                            <div className="flex items-center gap-2 rounded-lg 
bg-background-light dark:bg-slate-700 p-1 mt-2 sm:mt-0"> 
                                <button onClick={() => handleThemeChange('light')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${settings.theme === 'light' ? 'bg-white dark:bg-secondary text-secondary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Light</button>
                                <button onClick={() => handleThemeChange('dark')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${settings.theme === 'dark' ? 'bg-white dark:bg-secondary text-secondary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Dark</button>
                            </div> 
                        </div> 
                        <div className="flex flex-col sm:flex-row 
sm:items-center justify-between py-4 gap-4"> 
                            <div className="flex-1"> 
                                <h3 className="font-semibold text-secondary 
dark:text-white">Font Size</h3> 
                                <p className="text-slate-500 dark:text-slate-400 
text-sm">Adjust text size for better readability (locked to 14-19px for mobile safety).</p> 
                            </div> 

                            <div className="flex items-center gap-3 w-full sm:w-auto"> 
                                <span className="text-xs font-semibold text-secondary 
dark:text-white whitespace-nowrap">Small</span> 
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={settings.fontSize}
                                    onChange={handleFontSizeChange}
                                    className="w-full sm:w-32 accent-primary cursor-pointer"
                                    aria-label="Font size"
                                />
                                <span className="text-lg font-semibold text-secondary 
dark:text-white whitespace-nowrap">Large</span> 
                            </div> 
                        </div> 
                    </SettingsSection> 
                ); 
            case 'help': 
                 return ( 
                    <SettingsSection title="Help & Support" description="Find 
answers to your questions."> 
                        <div className="space-y-2"> 
                           {[
                               { label: 'FAQ', action: () => navigate('/faq') },
                               { label: 'Contact Support', action: () => navigate('/contact-support') },
                               { label: 'Terms of Service', action: () => navigate('/terms-of-service') }
                           ].map(item => (
                               <button 
                                   key={item.label}
                                   onClick={item.action}
                                   className="w-full flex items-center justify-between py-3 rounded-lg text-secondary dark:text-white hover:bg-primary/5 dark:hover:bg-slate-700/50 px-3 transition-colors"
                               >
                                   <span className="font-medium">{item.label}</span>
                               </button>
                           ))} 
                        </div> 
                    </SettingsSection> 
                ); 
            default: 
                return ( 
                    <SettingsSection 
title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
Settings`} description="Settings for this section are coming 
soon."></SettingsSection> 
 

                ); 
        } 
    }; 
 
    return ( 
        <div className="bg-background-light dark:bg-background-dark 
font-display flex flex-col min-h-screen text-secondary dark:text-slate-200"> 
            <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
            <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8 overflow-y-auto"> 
                <div className="max-w-5xl mx-auto"> 
                    <h1 className="text-secondary dark:text-white 
tracking-light text-3xl font-bold leading-tight pb-8">Settings</h1> 
                    <div className="flex flex-col lg:flex-row gap-8"> 
                        <aside className="lg:w-1/4"> 
                            <nav className="flex flex-row lg:flex-col gap-2 
overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0"> 
                                {navItems.map(item => (
                                    <a
                                        key={item.id}
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveTab(item.id);
                                        }}
                                        className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold shrink-0 transition-colors ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-secondary dark:text-slate-300 hover:bg-primary/5 dark:hover:bg-slate-700'}`}
                                    >
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </a>
                                ))}
                            </nav> 
                        </aside> 
                        <div className="flex-1 lg:w-3/4"> 
 

                            <div className="bg-white dark:bg-secondary 
rounded-xl shadow-md p-6 lg:p-8"> 
                                {renderContent()} 
                            </div> 
                        </div> 
                    </div> 
                </div> 
            </main> 
            <Footer darkMode={darkMode} />
        </div>
    ); 
} 
 
export default SettingsPage;


