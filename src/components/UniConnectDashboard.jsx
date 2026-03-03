import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import AppHeader from './AppHeader';
import Footer from './Footer';
import GenderBadge from './GenderBadge';
import { getDefaultAvatar } from '../services/avatarService';
// --- Data for UI elements (Makes JSX cleaner and easier to manage) ---
const navLinks = [
{ label: 'Dashboard', path: '/dashboard' },
{ label: 'Marketplace', path: '/unimarket' },
{ label: 'UniDoc', path: 'https://uni-space-study.vercel.app', external: true },
{ label: 'CampusFeed', path: '/campusfeed' },
{ label: 'Wallet', path: '/uni-wallet' }
];
const marketplaceItems = [
{
id: 1,
name: 'Nike Air Max 270',
status: 'Active',
statusColor: 'text-green-500',
price: '₦25,000',
imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB9mXk_qbIXJYUVxnWvbQg_bozBnGEKHRrM8v4t3KcQmZHd-FxDm81WKa7Sjga6pBF5VoxZvEEjD7WxHkR-DpYU-kBAS_JQ3aZOjZDUbu09QoakvbG-jN-BHaJPSPzt0JmZ7cKqJF3_8xN3ykop63r1dxxeepW0l6UN313C0kraBIyJwgjjuR6zyRJNmmuyswyUC0MXK2t5hBQwgo56w1dZUdskGE0AkKY2pzcLLwQC0Q8r_QgnJdJCVMPqCCKl5ZzE8Oc34XLJWDCt',
},
{
id: 2,
name: 'Beats by Dre Headset',
status: 'Sold',
statusColor: 'text-red-500',
price: '₦18,500',
imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuAt2vO4nW3jgysnaq7rVPGh4kxysZPvVF0dgOq5fmj6WjyVAPR1e31WNOWNAllcIDOi5id5virHcgCS2BhAkBV6ga5JIKGnUCh7H3rOM2p9xc1F4hCq-O2Qauvaj6OqGfw7tAZUfsijY9JOu_ngQ8weiLKe0av6rUq92H0XLQdUAU3Pc7dBkeoaqTMTa86L9gxOt9dkQexjL-w7HItHs_vm9o31WwXgq33PfWVg41_O4_Ke6OmFSG83_GAK54tKaGqvADnHvh6JDNj4',
},
];

// --- Sub-components for better organization ---
const Greeting = () => {
  const [userData, setUserData] = useState(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Use onAuthStateChanged to wait for auth state to be loaded
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    const setTimeBasedGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good morning');
      } else if (hour < 18) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
    };

    setTimeBasedGreeting();
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

    <h1 className="text-secondary dark:text-white tracking-light
text-xl sm:text-2xl lg:text-3xl font-bold leading-tight px-3 sm:px-4 text-left pb-3 sm:pb-4 lg:pb-6">
      {greeting}, {userData?.displayName || 'there'}!
    </h1>
};

const Logo = () => (
<div className="flex items-center gap-4 text-secondary
dark:text-white">
<img src="/logo/white_greenbg.png" alt="UniSpace" className="h-12 w-12 mb-1 object-contain" />
<h2 className="text-xl font-bold leading-tight
tracking-tight -ml-3">niSpace</h2>
</div>
);
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
<span className="text-lg sm:text-xl lg:text-2xl font-bold
text-primary">{percentage}%</span>
</div>
</div>
);
// --- Main Dashboard Component ---
const UniConnectDashboard = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('/default_avatar.png');
  const [marketplaceTab, setMarketplaceTab] = useState('listings');
  const [userListings, setUserListings] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [campusFeedPosts, setCampusFeedPosts] = useState([]);
  const [authorGenders, setAuthorGenders] = useState({});
  const [authorAvatars, setAuthorAvatars] = useState({});

  // Simple markdown renderer for bold text
  const renderMarkdown = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Fetch current user's avatar and set currentUserId from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().avatarUrl) {
            setUserAvatar(userDoc.data().avatarUrl);
          }
        } catch (err) {
          console.error('Error fetching user avatar:', err);
        }
      }
    });
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
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).slice(0, 2);
        setCampusFeedPosts(posts);
      }, (error) => {
        console.error('Error fetching campus feed posts:', error);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up campus feed subscription:', error);
    }
  }, []);

  // Fetch author genders and avatars for displayed posts
  useEffect(() => {
    const fetchAuthorData = async () => {
      const genders = {};
      const avatars = {};
      for (const post of campusFeedPosts) {
        if (post.authorId && !authorGenders[post.authorId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', post.authorId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              genders[post.authorId] = userData.gender || 'unknown';
              avatars[post.authorId] = userData.avatarUrl || getDefaultAvatar(userData.gender || 'male');
            }
          } catch (error) {
            console.error(`Error fetching data for author ${post.authorId}:`, error);
            avatars[post.authorId] = getDefaultAvatar('male');
          }
        }
      }
      if (Object.keys(genders).length > 0) {
        setAuthorGenders(prev => ({ ...prev, ...genders }));
      }
      if (Object.keys(avatars).length > 0) {
        setAuthorAvatars(prev => ({ ...prev, ...avatars }));
      }
    };
    
    if (campusFeedPosts.length > 0) {
      fetchAuthorData();
    }
  }, [campusFeedPosts]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
return (
<div className="w-full h-screen flex flex-col" style={{ overscrollBehaviorY: 'auto' }}>
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
{/* --- Mobile Menu --- */}
{isMenuOpen && (
<div className="lg:hidden bg-white dark:bg-secondary border-b
border-slate-200 dark:border-slate-700 p-4">
{navLinks.map((link) => (
link.external ? (
<a key={link.label} href={link.path} target="_blank" rel="noopener noreferrer" className="block py-2 px-4
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800 rounded" onClick={() => setIsMenuOpen(false)}>{link.label}</a>
) : (
<Link key={link.label} to={link.path} className="block py-2 px-4
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800 rounded" onClick={() => setIsMenuOpen(false)}>{link.label}</Link>
)
))}
</div>
)}
{/* --- Main Content --- */}
<main className="flex-1 px-4 sm:px-10 py-8">
<div className="flex flex-col max-w-7xl mx-auto">
<Greeting />
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
{/* --- Left Column --- */}
<div className="lg:col-span-1 flex flex-col gap-6">
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6 flex flex-col gap-4">
<p className="text-secondary dark:text-white text-lg sm:text-xl lg:text-2xl
font-bold">UniWallet</p>
<div className="text-center">
<p className="text-slate-500 dark:text-slate-400
text-xs sm:text-sm">Available Balance</p>
<p className="text-primary text-2xl sm:text-3xl lg:text-4xl
font-bold">₦0.00</p>
</div>
<div className="flex justify-center gap-2 sm:gap-3 mt-2 sm:mt-3">
<button className="flex-1 rounded-lg h-10 sm:h-11 px-3 sm:px-4 bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all">Add Funds</button>
<button className="flex-1 rounded-lg h-10 sm:h-11 px-3 sm:px-4 bg-background-light dark:bg-slate-700 text-secondary dark:text-white text-xs sm:text-sm font-bold hover:bg-background-light/80 dark:hover:bg-slate-600 active:scale-95 transition-all">Send Money</button>
</div>
<a className="text-center text-primary text-xs sm:text-sm font-medium mt-2 sm:mt-3 hover:underline" href="#">View full transaction history</a>
</div>
</div>
{/* --- Right Column --- */}
<div className="lg:col-span-2 flex flex-col gap-6">
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6">
<p className="text-secondary dark:text-white text-lg sm:text-xl lg:text-2xl font-bold
mb-4">Recent Marketplace Activity</p>
<div className="flex border-b border-slate-200
dark:border-slate-700">
<button onClick={() => setMarketplaceTab('listings')}
className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium ${marketplaceTab ===
'listings' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-white'}`}>My
Listings</button>
<button onClick={() => setMarketplaceTab('purchases')}
className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium ${marketplaceTab ===
'purchases' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-white'}`}>My
Purchases
</button>
</div>
<div className="mt-4 space-y-4">
{marketplaceTab === 'listings' ? (
userListings.length > 0 ? (
userListings.map((item) => (
<div key={item.id} className="flex items-center gap-4">
<img className="w-16 h-16 rounded-lg object-cover"
alt={item.name} src={item.images?.[0] || 'https://via.placeholder.com/64'} />
<div className="flex-1">
<p className="font-semibold text-xs sm:text-sm text-secondary
dark:text-white">{item.name}</p>
<p className="text-xs sm:text-sm text-slate-500
dark:text-slate-400">Price: <span
className="text-primary">{item.price}</span></p>
</div>
<p className="font-bold text-secondary
dark:text-white">₦{item.price}</p>
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
<Link className="block text-center text-primary text-xs sm:text-sm
font-medium mt-3 sm:mt-4 hover:underline" to="/my-listings">View All Listings</Link>
</div>
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6">
<p className="text-secondary dark:text-white text-lg sm:text-xl lg:text-2xl font-bold
mb-3 sm:mb-4">CampusFeed</p>
<div className="space-y-4">
{campusFeedPosts.map((post) => (
<div key={post.id} className="flex flex-col gap-2">
{/* Profile and author info in top row */}
<div className="flex items-start gap-3">
{/* Profile pic */}
<button onClick={() => navigate(`/profile/${post.authorId}`)} className="shrink-0 hover:opacity-80 transition-opacity">
<img 
  className="size-10 rounded-full flex-shrink-0 cursor-pointer"
  alt={`${post.authorName} profile`} 
  src={authorAvatars[post.authorId] || getDefaultAvatar('male')}
  onError={(e) => {
    e.target.src = getDefaultAvatar('male');
  }}
/>
</button>
{/* Author info and menu */}
<div className="flex-grow flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-semibold text-secondary dark:text-white cursor-pointer hover:underline mb-0" onClick={() => navigate(`/profile/${post.authorId}`)}>{post.authorName || 'Anonymous'}</p>
                {authorGenders[post.authorId] && <GenderBadge gender={authorGenders[post.authorId]} size="sm" className="inline-block" />}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString() : ''}</p>
            </div>
</div>
</div>
{/* Content below - full width */}
<p onClick={() => navigate(`/campusfeed#post-${post.id}`)} className="text-secondary dark:text-white cursor-pointer text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}></p>
<div className="flex items-center gap-4 text-slate-500
dark:text-slate-400 mt-1 text-xs sm:text-sm">
<span className="flex items-center gap-1"><span
className="material-symbols-outlined
text-base">favorite_border</span> {post.likesCount || 0}</span>
<span className="flex items-center gap-1"><span
className="material-symbols-outlined
text-base">chat_bubble_outline</span> {post.commentsCount || 0}</span>
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
export default UniConnectDashboard;


