 import React, { useState, useEffect } from 'react'; 
 import { auth, db } from '../firebase';
 import { doc, getDoc, updateDoc } from 'firebase/firestore';
 import { onAuthStateChanged } from 'firebase/auth';
 import { useTheme } from '../hooks/useTheme';
 import AppHeader from './AppHeader';
 import { useNavigate } from 'react-router-dom';
 
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
        <h2 className="text-xl font-bold text-secondary dark:text-white 
mb-1">{title}</h2> 
        <p className="text-slate-500 dark:text-slate-400 
mb-6">{description}</p> 
        <div className="space-y-4"> 
            {children} 
        </div> 
    </section> 
); 
 
 
// --- Main Page Component --- 
function SettingsPage() { 
    const [settings, setSettings] = useState(initialSettings); 
    const [activeTab, setActiveTab] = useState('account'); 
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
        const sizeMap = { 1: 14, 2: 16, 3: 18, 4: 20, 5: 22 };
        const px = sizeMap[settings.fontSize] ?? 16;
        // Set the root font-size (affects rem-based typography)
        document.documentElement.style.fontSize = `${px}px`;
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
     
    // In a real app with routing, each of these would be a separate component.
    const renderContent = () => { 
        switch (activeTab) { 
            case 'account':
                return (
                    <SettingsSection title="Account Settings" description="Manage your account information and notification preferences.">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-semibold text-secondary dark:text-white">Email Address</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">{settings.email}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-semibold text-secondary dark:text-white">Password</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Last changed {settings.passwordLastChanged}</p>
                            </div>
                            <button onClick={() => navigate('/change-password')} className="mt-2 sm:mt-0 text-sm font-medium text-primary hover:underline self-start sm:self-center">Change</button>
                        </div>

                        <div className="py-4">
                            <h3 className="text-lg font-semibold text-secondary dark:text-white mb-1">Notification Preferences</h3>
                            <div className="space-y-4 pt-4">
                                <div className="flex items-start justify-between">
                                    <div className="max-w-md">
                                        <h4 className="font-medium text-secondary dark:text-white">Email Notifications</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Receive important updates, digests, and marketing communications via email.</p>
                                    </div>
                                    <ToggleSwitch checked={settings.notifications.email} onChange={() => handleNotificationChange('email')} />
                                </div>
                                {/* ... more toggles */}
                            </div>
                        </div>
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
                                <h3 className="font-semibold text-secondary 
dark:text-white">Appearance</h3> 
                                <p className="text-slate-500 dark:text-slate-400 
text-sm">Choose light or dark theme.</p> 
                            </div> 
                            <div className="flex items-center gap-2 rounded-lg 
bg-background-light dark:bg-slate-700 p-1 mt-2 sm:mt-0"> 
                                <button onClick={() => handleThemeChange('light')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${settings.theme === 'light' ? 'bg-white dark:bg-secondary text-secondary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Light</button>
                                <button onClick={() => handleThemeChange('dark')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${settings.theme === 'dark' ? 'bg-white dark:bg-secondary text-secondary dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Dark</button>
                            </div> 
                        </div> 
                        <div className="flex flex-col sm:flex-row 
sm:items-center justify-between py-4"> 
                            <div> 
                                <h3 className="font-semibold text-secondary 
dark:text-white">Font Size</h3> 
                                <p className="text-slate-500 dark:text-slate-400 
text-sm">Adjust the font size for better readability.</p> 
                            </div> 
 

                            <div className="flex items-center gap-4 mt-2 
sm:mt-0 w-full"> 
                                <span className="text-xs text-secondary 
dark:text-white">A</span> 
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={settings.fontSize}
                                    onChange={handleFontSizeChange}
                                    className="w-full sm:w-24 accent-primary"
                                    aria-label="Font size"
                                />
                                <span className="text-lg text-secondary 
dark:text-white">A</span> 
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
font-display min-h-screen text-secondary dark:text-slate-200"> 
            <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
            <main className="px-4 sm:px-6 lg:px-10 py-8"> 
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
        </div> 
    ); 
} 
 
export default SettingsPage;