import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
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
const navLinks = ['Dashboard', 'Marketplace', 'Study Hub', 'Wallet'];
// --- Sub-components for better organization ---
const Header = ({ darkMode, toggleDarkMode, hasUnread }) => {
const navigate = useNavigate();
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

return (
<header className="sticky top-0 z-20 flex items-center
justify-between whitespace-nowrap border-b border-solid
border-slate-200 dark:border-slate-700 px-4 sm:px-10 py-3 bg-white
dark:bg-secondary">
<div className="flex items-center gap-4 lg:gap-8">
<div 
  onClick={() => navigate('/dashboard')}
  className="flex items-center gap-4 text-secondary dark:text-white cursor-pointer hover:text-primary transition-colors">
  <div className="size-6 text-primary">
    <svg fill="currentColor" viewBox="0 0 48 48"><path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path></svg>
  </div>
  <h2 className="text-xl font-bold leading-tight
tracking-tight">UniConnect</h2>
</div>
<nav className="hidden lg:flex items-center gap-6">
{navLinks.map(link => <a key={link} href="#"
className="text-secondary dark:text-white text-sm
font-medium">{link}</a>)}
</nav>
</div>
<div className="flex flex-1 justify-end items-center gap-3
sm:gap-6">
<button onClick={toggleDarkMode} className="flex
items-center justify-center rounded-lg h-10 w-10 bg-background-light
dark:bg-slate-800 text-secondary dark:text-white" aria-label="Toggle
dark mode">
<span className="material-symbols-outlined">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
<button className="relative flex items-center justify-center
rounded-lg h-10 w-10 bg-primary text-white">
<span
className="material-symbols-outlined">notifications</span>
{hasUnread && <div className="absolute top-1.5 right-1.5
size-2 bg-red-500 rounded-full"></div>}
</button>
<div className="relative">
<button onClick={() => setIsProfileOpen(!isProfileOpen)}>
<div className="bg-center bg-no-repeat aspect-square
bg-cover rounded-full size-10" style={{backgroundImage:
'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI")'}}></div>
</button>
{isProfileOpen && (
<div className="absolute right-0 mt-2 w-48 bg-white
dark:bg-secondary rounded-md shadow-lg py-1 z-10">
<a href="#" className="block px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800">Profile</a>
<a href="#" className="block px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800">Settings</a>
<button
  onClick={handleLogout}
  className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
>
  Logout
</button>
</div>
)}
</div>
<div className="lg:hidden">
<button onClick={() => setIsMenuOpen(!isMenuOpen)}
className="text-secondary dark:text-white">
<span className="material-symbols-outlined
text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
</button>
</div>
</div>
</header>
);
}
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
const [notifications, setNotifications] =
useState(initialNotificationsData);
const [darkMode, setDarkMode] = useState(false);
useEffect(() => {
if (darkMode) document.documentElement.classList.add('dark');
else document.documentElement.classList.remove('dark');
}, [darkMode]);
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
<Header darkMode={darkMode} toggleDarkMode={() =>
setDarkMode(!darkMode)} hasUnread={hasUnread}/>
<main className="flex-1 px-4 sm:px-10 py-8">
<div className="flex flex-col max-w-4xl mx-auto">
<div className="flex flex-col sm:flex-row sm:items-center
sm:justify-between mb-6">
<h1 className="text-secondary dark:text-white text-3xl font-bold
leading-tight">Notifications</h1>
<div className="flex items-center gap-4 mt-4 sm:mt-0">
<button onClick={markAllAsRead} className="text-primary
text-sm font-medium">Mark all as read</button>
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
<ul className="divide-y divide-slate-200 dark:divide-slate-700">
{notifications.map((notification) => (
<NotificationItem
key={notification.id}
notification={notification}
onClick={() => markAsRead(notification.id)}
/>
))}
</ul>
</div>

</div>
</main>
</div>
);
};
export default NotificationsPage;