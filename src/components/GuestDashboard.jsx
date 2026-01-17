import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';
import AppHeader from './AppHeader';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { query, collection, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import Footer from './Footer';

// --- Main Dashboard Component ---
const GuestDashboard = () => {
const [marketplaceTab, setMarketplaceTab] = useState('listings');
const { darkMode, toggleTheme } = useTheme();
const [userName, setUserName] = useState('Guest');
const [greeting, setGreeting] = useState('Good morning');
const [userListings, setUserListings] = useState([]);
const [currentUserId, setCurrentUserId] = useState(null);
const [campusFeedPosts, setCampusFeedPosts] = useState([]);

// Simple markdown renderer for bold text
const renderMarkdown = (text) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};
const ProgressCircle = ({ percentage }) => (
<div className="relative size-32">
<svg className="size-full" width="36" height="36" viewBox="0 0 36
36" xmlns="http://www.w3.org/2000/svg">
<circle
className="stroke-current text-background-light
dark:text-slate-700"
cx="18" cy="18" r="16" strokeWidth="3" fill="none"
></circle>
<circle
className="stroke-current text-primary"
cx="18" cy="18" r="16" fill="none"
strokeWidth="3"
strokeDasharray={`${percentage} 100`}
strokeDashoffset="25"
></circle>
</svg>

<div className="absolute inset-0 flex items-center justify-center">
<span className="text-2xl font-bold
text-primary">{percentage}%</span>
</div>
</div>
);

useEffect(() => {
	const unsubscribe = onAuthStateChanged(auth, (user) => {
		if (user) {
			setCurrentUserId(user.uid);
			setUserName(user.displayName || 'Guest');
		}
	});

	const hour = new Date().getHours();
	if (hour < 12) {
		setGreeting('Good morning');
	} else if (hour < 18) {
		setGreeting('Good afternoon');
	} else {
		setGreeting('Good evening');
	}

	return () => unsubscribe();
}, []);

  // Subscribe to user's listings from Firestore
  useEffect(() => {
    if (!currentUserId) return;
    
    try {
      const q = query(
        collection(db, 'listings'),
        where('sellerId', '==', currentUserId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserListings(listings);
      }, (error) => {
        console.error('Error fetching user listings:', error);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up listings subscription:', error);
    }
  }, [currentUserId]);

  // Subscribe to campus feed posts (first 2 posts) from Firestore
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(2)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCampusFeedPosts(posts);
      }, (error) => {
        console.error('Error fetching campus feed posts:', error);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up campus feed subscription:', error);
    }
  }, []);
return (
<div className="relative flex min-h-screen w-full flex-col">
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
{/* --- Main Content --- */}
<main className="flex-1 px-4 sm:px-10 py-8">
<div className="flex flex-col max-w-7xl mx-auto">
<h1 className="text-secondary dark:text-white tracking-light
text-2xl sm:text-3xl font-bold leading-tight px-4 text-left pb-6">
{greeting}, {userName}!
</h1>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
{/* --- Left Column --- */}
<div className="lg:col-span-1 flex flex-col gap-6">
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6 flex flex-col gap-4">
<p className="text-secondary dark:text-white text-xl
font-bold">UniWallet</p>
<div className="text-center">
<p className="text-slate-500 dark:text-slate-400
text-sm">Available Balance</p>
<p className="text-secondary dark:text-white text-2xl
font-semibold">₦15,000.00</p>
</div>
<div className="flex justify-center gap-3 mt-2">
<button className="flex-1 rounded-lg h-10 px-4 bg-primary
text-white">Add Funds</button>
<button className="flex-1 rounded-lg h-10 px-4
bg-background-light dark:bg-slate-700 text-secondary
dark:text-white">Send Money</button>
</div>
<a className="text-center text-primary text-sm font-medium
mt-2" href="#">View full transaction history</a>
</div>
</div>
{/* --- Right Column --- */}
<div className="lg:col-span-2 flex flex-col gap-6">
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6 flex-1">
<p className="text-secondary dark:text-white text-xl font-bold
mb-4">Recent Marketplace Activity</p>
<div className="flex border-b border-slate-200
dark:border-slate-700">
<button onClick={() => setMarketplaceTab('listings')}
className={`py-2 px-4 text-sm font-medium ${marketplaceTab ===
'listings' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-white'}`}>My
Listings
</button>
<button onClick={() => setMarketplaceTab('purchases')}
className={`py-2 px-4 text-sm font-medium ${marketplaceTab ===
'purchases' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-white'}`}>My
Purchases
</button>
</div>
<div className="mt-4 space-y-4">
{marketplaceTab === 'listings' ? (
userListings.length > 0 ? (
userListings.map((item) => (
<div key={item.id} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
<img className="w-16 h-16 rounded-lg object-cover"
alt={item.name} src={item.images?.[0] || 'https://via.placeholder.com/64'} />
<div className="flex-1">
<p className="font-semibold text-secondary
dark:text-white">{item.name}</p>
<p className="text-sm text-slate-500
dark:text-slate-400">Price: <span
className="text-primary">{item.price}</span></p>
</div>
<div className="flex flex-col gap-2">
<p className="font-bold text-secondary
dark:text-white">₦{item.price}</p>
<button className="text-primary text-sm font-medium hover:underline">View Details</button>
</div>
</div>
))
) : (
<p className="text-slate-500 dark:text-slate-400 p-4
text-center">No listings found. <Link to="/sell-item" className="text-primary hover:underline">Create one</Link></p>
)
) : (
<p className="text-slate-500 dark:text-slate-400 p-4
text-center">No purchases found.</p>
)}
</div>
    <Link className="block text-center text-primary text-sm
font-medium mt-4 hover:underline" to="/my-listings">View All Listings</Link>
</div>
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6">
<p className="text-secondary dark:text-white text-xl font-bold
mb-4">CampusFeed</p>
<div className="space-y-4">
{campusFeedPosts.map((post) => (
<div key={post.id} className="flex gap-4">
<img className="size-10 rounded-full flex-shrink-0"
alt={`${post.authorName} profile`} src={post.authorAvatar || '/default_avatar.png'} />
<div className="flex-1">
<p className="font-semibold text-secondary
dark:text-white">{post.authorName || 'Anonymous'}</p>
<p className="text-secondary dark:text-white
mt-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}></p>
<div className="flex items-center gap-4 text-slate-500
dark:text-slate-400 mt-2 text-sm">
<span className="flex items-center gap-1"><span
className="material-symbols-outlined text-sm">favorite_border</span> {post.likes || 0}</span>
<span className="flex items-center gap-1"><span
className="material-symbols-outlined text-sm">chat_bubble_outline</span> {post.comments || 0}</span>
</div>
</div>
</div>
))}
</div>
<Link className="block text-center text-primary text-sm
font-medium mt-4 hover:underline" to="/campusfeed">View Full Feed</Link>
</div>
</div>
</div>
</div>
</main>
<Footer darkMode={darkMode} />
</div>
);
};

export default GuestDashboard;


