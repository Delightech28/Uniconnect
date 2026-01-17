import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Footer from './Footer';
// --- Initial Data for Notifications ---
const initialNotificationsData = [
{
id: 1,
icon: 'verified_user',
iconBg: 'bg-primary/10 dark:bg-primary/20',
iconColor: 'text-primary',
title: 'Verification Complete',
description: 'Congratulations! Your student account has been verified. You now have full access to CampusFeed.',
time: '5 minutes ago',
unread: true,

},
{
id: 2,
icon: 'storefront',
iconBg: 'bg-accent/10 dark:bg-accent/20',
iconColor: 'text-accent',
title: 'New Offer on "Nike Air Max 270"',
description: "You've received a new offer of ₦23,500 for your listing. Respond now to complete the sale.",
time: '1 hour ago',
unread: true,
},
{
id: 3,
icon: 'chat',
iconBg: 'bg-blue-500/10 dark:bg-blue-400/20',
iconColor: 'text-blue-500 dark:text-blue-400',
title: 'New Message from Tunde',
description: `"Hey, is the textbook still available? I'm on campus and
can pick it up..."`,
time: '3 hours ago',
unread: false,
},
{
id: 4,
icon: 'school',
iconBg: 'bg-purple-500/10 dark:bg-purple-400/20',
iconColor: 'text-purple-500 dark:text-purple-400',
title: 'New Quiz in "Intro to Digital Marketing"',
description: "A new quiz for 'Module 4: SEO Basics' has been uploaded. Test your knowledge!",
time: '1 day ago',
unread: false,
},
{
id: 5,
icon: 'warning',

iconBg: 'bg-red-500/10 dark:bg-red-400/20',
iconColor: 'text-red-500 dark:text-red-400',
title: 'Verification Pending',
description: 'Please upload your student ID to complete your verification and get access to CampusFeed.',
time: '2 days ago',
unread: false,
},
{
id: 6,
icon: 'receipt_long',
iconBg: 'bg-green-500/10 dark:bg-green-400/20',
iconColor: 'text-green-500 dark:text-green-400',
title: 'Item Sold: "Beats by Dre Headset"',
description: 'Your item has been sold! ₦18,500 has been credited to your UniWallet.',
time: '3 days ago',
unread: false,
},
];
const navLinks = [
{ label: 'Dashboard', path: '/dashboard' },
{ label: 'Marketplace', path: '/unimarket' },
{ label: 'UniDoc', path: '/uni-doc' },
{ label: 'Wallet', path: '/uni-wallet' }
];
// --- Sub-components for better organization ---
 
const NotificationItem = ({ notification, onClick }) => (
<li onClick={onClick} className="p-4 sm:p-6 flex items-start gap-4
hover:bg-background-light/50 dark:hover:bg-slate-800/50
cursor-pointer">
<div className={`w-10 h-10 rounded-full flex items-center
justify-center shrink-0 ${notification.iconBg}`}>

<span className={`material-symbols-outlined
${notification.iconColor}`}>{notification.icon}</span>
</div>
<div className="flex-grow">
<p className="font-semibold text-secondary
dark:text-white">{notification.title}</p>
<p className="text-sm text-slate-600 dark:text-slate-300
mt-1">{notification.description}</p>
<p className="text-xs text-slate-400 dark:text-slate-500
mt-2">{notification.time}</p>
</div>
{notification.unread && (
<div className="w-3 h-3 bg-primary rounded-full shrink-0
mt-1.5" title="Unread"></div>
)}
</li>
);
// --- Main Page Component ---
const NotificationsPage = () => {
const { darkMode, toggleTheme } = useTheme();
const [notifications, setNotifications] =
useState([]);

// Load initial notifications
useEffect(() => {
  setNotifications(initialNotificationsData);
}, []);

const markAsRead = (id) => {
setNotifications(
notifications.map((n) => (n.id === id ? { ...n, unread: false } : n))
);
};
const markAllAsRead = () => {
setNotifications(notifications.map((n) => ({ ...n, unread: false })));
};
const hasUnread = notifications.some(n => n.unread);
return (
<div className="relative flex min-h-screen w-full flex-col">
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
<main className="flex-1 px-4 sm:px-10 py-8">
<div className="flex flex-col max-w-4xl mx-auto">
<div className="flex flex-col sm:flex-row sm:items-center
sm:justify-between mb-6">
<h1 className="text-secondary dark:text-white text-3xl font-bold
leading-tight">Notifications</h1>
<div className="flex items-center gap-4 mt-4 sm:mt-0">
<button onClick={markAllAsRead} disabled={!hasUnread} className={`text-sm font-medium ${hasUnread ? 'text-primary' : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}>Mark all as read</button>
<button className="text-secondary dark:text-white text-sm
font-medium flex items-center gap-1">
<span>Filter</span>
<span className="material-symbols-outlined
text-base">filter_list</span>
</button>
</div>
</div>
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-600">notifications</span>
              <p className="text-secondary dark:text-white text-lg font-medium mt-4">No notifications yet</p>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">You'll see updates here when something happens.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => markAsRead(notification.id)}
                />
              ))}
            </ul>
          )}
        </div>

      </div>
    </main>
<Footer darkMode={darkMode} />
</div>
);
};
export default NotificationsPage;


