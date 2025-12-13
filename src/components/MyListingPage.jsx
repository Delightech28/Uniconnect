import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
// --- Data Layer ---
// Removed static mock data; now fetches from Firestore in component
const listingsData = [
{
id: 1,
name: "Slightly Used HP Elitebook 840 G5",
price: "₦150,000",
status: "Active",
expiresIn: "12 days",
imageUrl:
"https://lh3.googleusercontent.com/aida-public/AB6AXuA3PseYjpIvW1kpMj2EDuLgyjMQZsKcdmzBMbpNJWYmvNJSUa_outUdLqEuWzje1gvbcKHwR41EBUTMZPmfS8DY97EFjqeDQq8hRU4j3uF3h_DU5Ga-KEhuedjZaVaKbJl0ABq0XsUaa887gOOx2OB2jgH0qEQg8Mf9madQwg15-KHg0pljXnLwcAUu5viwBnEJaQ8Yeb1MEU2fAhEiIU4yYqm0k9PMgFrtRz7P3IEbjNXbCdm4d1l2HzFZJ-Vn9B7iCq3D_IteTI8c",
},
{
id: 2,
name: "Organic Chemistry Textbook (5th Ed.)",
price: "₦8,500",
status: "Active",
expiresIn: "28 days",
imageUrl:
"https://lh3.googleusercontent.com/aida-public/AB6AXuBlmBHbt8sFVTewmAFqVaVwAejL4zwoyKem7UXzGexMmDxHzo8Ru55gCmbWDnHTLdnt9xBmaaxlXf4S74_LBCabilppa6Zrq6myq1rTeU32Kmxjm8fXhaVVlbtT8wyJ51OzwRdJKqrw8-2M-RnR43lHtEL3H_cFLbS-3T8KtmIWFPNz2IG0Al1-z-9fSpQKDPt0tnMaDxlFqvauUsqk4WadErGrkqAIpGR8QoPXyFIpQKfc-gwxW-hGOaptLFK-0oDkV27idEIUHSXZ",
},
{
id: 3,
name: "Custom Ankara Print Top",
price: "₦5,000",
status: "Pending Review",
expiresIn: "-",
imageUrl:
"https://lh3.googleusercontent.com/aida-public/AB6AXuDjUcy_SB8PnrhfYfeBiBI97HK5v2KARm_dXhppfPTnDzwaCUaGo7z4zRbX59S1BQKrn1KyzOQFWlOY8yaegGGsaAMF6WmdXoT9Ei36KoqCScV73SPL-H40EeR_UfPBIUYw4El2xBpZzC4ioHTbk1QFPtFJefhs_Y0ILSHH-zS5vqR_Fu7wIzrntOP8Q09V4ZpEj_rPtQfchjchE-SFC-6dukdJ19Gmmg8MV4HF-FZOZhLDLhx4NOmiTXl0txJxiv4bAuiptQjX_M_0",
},
{
id: 4,
name: "Graphics Design Service - Logo & Flyer",
price: "₦15,000",
status: "Expired",
expiresIn: "0 days",
imageUrl:
"https://lh3.googleusercontent.com/aida-public/AB6AXuDUUwR4DHWim2x_AFca6gOk5qBIITuQGUYAbRNgmaGZnYNK3mqdTUI0N0yotnCN8s7Exm3UrwLL9JyLs7KzEjUp7J-hopFTn58zFtF1-nBOyUC07ouCnGB0qaOOV6DtnGY7NxD9EHnNr9QADcNJdszl7j2yOPgqekoobXdcDCPtyYyWiC5ogbdu-Kr9uaa_G5TLVfwnnNqlD5Y7jGFMl-e7kPULid-NTzVsXezNvj93t0LaYc3urJz9ErZ-TVf919LxaP_HMcX9v6z_",
},
];
// --- Helper Components for UI Logic ---
// A component to render the correct status badge based on text
const StatusBadge = ({ status }) => {
const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
let statusClasses = "";
switch (status) {
case "Active":
statusClasses = "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
break;
case "Pending Review":
statusClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
break;
case "Expired":
statusClasses = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
break;
default:
statusClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

}
return <span className={`${baseClasses}
${statusClasses}`}>{status}</span>;
};
// A component for action buttons, with conditional rendering for the "Relist" button
const ActionButtons = ({ status }) => {
return (
<div className="flex justify-end items-center gap-2">
<button className="p-2 text-slate-500 hover:text-primary
dark:text-slate-400 dark:hover:text-primary">
<span className="material-symbols-outlined">visibility</span>
</button>
{status === "Expired" ? (
<button className="p-2 text-slate-500 hover:text-green-600
dark:text-slate-400 dark:hover:text-green-500" title="Relist Item">
<span className="material-symbols-outlined">replay</span>
</button>
) : (
<button className="p-2 text-slate-500 hover:text-blue-600
dark:text-slate-400 dark:hover:text-blue-400">
<span className="material-symbols-outlined">edit</span>
</button>
)}
<button className="p-2 text-slate-500 hover:text-red-600
dark:text-slate-400 dark:hover:text-red-500">
<span className="material-symbols-outlined">delete</span>
</button>
</div>
);
};
// --- Main Page Component ---
function MyListingsPage() {
  const [userListings, setUserListings] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user ID and subscribe to their listings
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's listings from Firestore
  useEffect(() => {
    if (!currentUserId) {
      setUserListings([]);
      setLoading(false);
      return;
    }

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
        setLoading(false);
      }, (error) => {
        console.error('Error fetching user listings:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up listings subscription:', error);
      setLoading(false);
    }
  }, [currentUserId]);

  // Helper to format timestamp to days from now
  const formatExpiresIn = (createdAt) => {
    if (!createdAt) return '-';
    // Assuming listings expire after 30 days
    const created = new Date(createdAt.toDate?.() || createdAt);
    const expiryDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.max(0, Math.floor((expiryDate - now) / (24 * 60 * 60 * 1000)));
    return `${daysLeft} days`;
  };

  // Helper to determine status based on listing data
  const getListingStatus = (listing) => {
    if (!listing.createdAt) return 'Pending Review';
    const created = new Date(listing.createdAt.toDate?.() || listing.createdAt);
    const expiryDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiryDate < new Date()) return 'Expired';
    return 'Active';
  };

return (
// The main container div gets the body classes
<div className="bg-background-light dark:bg-background-dark
font-display text-secondary dark:text-slate-200 min-h-screen">
<div className="relative flex h-auto w-full flex-col group/design-root
overflow-x-hidden">
<div className="layout-container flex h-full grow flex-col">
{/* Header */}
<header className="flex items-center justify-between
whitespace-nowrap border-b border-solid border-slate-200
dark:border-slate-700 px-4 sm:px-10 py-3 bg-white dark:bg-secondary">
<div className="flex items-center gap-4 sm:gap-8">
<div className="flex items-center gap-4 text-secondary
dark:text-white">
<div className="size-6 text-primary">
<svg fill="none" viewBox="0 0 48 48"
xmlns="http://www.w3.org/2000/svg">
<path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
fill="currentColor"></path>
</svg>
</div>
<h2 className="text-xl font-bold leading-tight
tracking-[-0.015em]">UniSpace</h2>
</div>
{/* Desktop Navigation */}
<nav className="hidden md:flex items-center gap-6">
<a className="text-secondary dark:text-white text-sm
font-medium leading-normal" href="#">Dashboard</a>
<a className="text-primary dark:text-primary text-sm
font-bold leading-normal" href="#">Marketplace</a>
<a className="text-secondary dark:text-white text-sm
font-medium leading-normal" href="https://uni-space-study.vercel.app" target="_blank" rel="noopener noreferrer">Study Hub</a>
<a className="text-secondary dark:text-white text-sm
font-medium leading-normal" href="#">Wallet</a>
</nav>

</div>
<div className="flex flex-1 justify-end items-center gap-2
sm:gap-4">
{/* In a real app, a hamburger menu would be here for mobile
*/}
<button className="flex items-center justify-center rounded-lg
h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary
dark:text-white">
<span
className="material-symbols-outlined">notifications</span>
</button>
<div className="relative group">
<div
className="bg-center bg-no-repeat aspect-square bg-cover
rounded-full size-10 cursor-pointer"
alt="User profile picture"
style={{ backgroundImage:
`url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oX
pOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL
8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke
_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrS
yxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANM
AlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI")` }}
></div>
<div className="absolute right-0 mt-2 w-48 bg-white
dark:bg-secondary rounded-md shadow-lg py-1 hidden
group-hover:block z-10">
					<a className="block px-4 py-2 text-sm text-secondary
					dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
					href="#">Profile</a>
					<Link className="block px-4 py-2 text-sm text-secondary
					dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
					to="/settings">Settings</Link>
					<a className="block px-4 py-2 text-sm text-secondary
					dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
					href="#">Logout</a>
</div>

</div>
</div>
</header>
{/* Main Content */}
<main className="flex-1 px-4 sm:px-6 lg:px-10 py-8">
<div className="layout-content-container flex flex-col max-w-7xl
mx-auto">
<div className="flex flex-col sm:flex-row justify-between
items-start gap-4 mb-8">
<div>
<h1 className="text-secondary dark:text-white tracking-light
text-3xl font-bold leading-tight mb-2">My Marketplace Listings</h1>
<p className="text-slate-600 dark:text-slate-300">Manage
your active and inactive product listings.</p>
</div>
<a className="flex items-center justify-center gap-2
rounded-lg h-12 px-6 bg-primary text-white text-base font-bold
leading-normal w-full sm:w-auto flex-shrink-0" href="/sell-item">
<span
className="material-symbols-outlined">add_circle</span>
<span>Create New Listing</span>
</a>
</div>
{/* Listings Container */}
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md overflow-hidden">
{/* --- DESKTOP TABLE VIEW (hidden on small screens) --- */}
<div className="overflow-x-auto hidden md:block">
<table className="w-full text-left">
<thead className="border-b border-slate-200
dark:border-slate-700">
<tr>
<th className="p-4 text-sm font-semibold text-slate-500
dark:text-slate-400">Product</th>

<th className="p-4 text-sm font-semibold text-slate-500
dark:text-slate-400">Price</th>
<th className="p-4 text-sm font-semibold text-slate-500
dark:text-slate-400">Status</th>
<th className="p-4 text-sm font-semibold text-slate-500
dark:text-slate-400">Expires In</th>
<th className="p-4 text-sm font-semibold text-slate-500
dark:text-slate-400 text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-200
dark:divide-slate-700">
{loading ? (
<tr><td colSpan="5" className="p-4 text-center text-slate-500 dark:text-slate-400">Loading listings...</td></tr>
) : userListings.length > 0 ? (
userListings.map((item) => (
<tr key={item.id}>
<td className="p-4">
<div className="flex items-center gap-4">
<img alt={item.name} className="w-16 h-16
object-cover rounded-lg" src={item.images?.[0] || 'https://via.placeholder.com/64'} />
<span className="font-medium text-secondary
dark:text-white">{item.name}</span>
</div>
</td>
<td className="p-4 font-medium text-slate-700
dark:text-slate-300">₦{item.price}</td>
<td className="p-4"><StatusBadge
status={getListingStatus(item)} /></td>
<td className="p-4 text-slate-600
dark:text-slate-400">{formatExpiresIn(item.createdAt)}</td>
<td className="p-4"><ActionButtons
status={getListingStatus(item)} /></td>
</tr>
))
) : (
<tr><td colSpan="5" className="p-4 text-center text-slate-500 dark:text-slate-400">No listings found. <Link to="/sell-item" className="text-primary hover:underline">Create one</Link></td></tr>
)}
</tbody>
</table>
</div>

{/* --- MOBILE CARD VIEW (visible only on small screens) ---
*/}
<div className="divide-y divide-slate-200
dark:divide-slate-700 md:hidden">
{loading ? (
<div className="p-4 text-center text-slate-500 dark:text-slate-400">Loading listings...</div>
) : userListings.length > 0 ? (
userListings.map((item) => (
<div key={item.id} className="p-4">
<div className="flex gap-4">
<img alt={item.name} className="w-20 h-20
object-cover rounded-lg flex-shrink-0" src={item.images?.[0] || 'https://via.placeholder.com/80'} />
<div className="flex-grow">
<p className="font-medium text-secondary
dark:text-white mb-1">{item.name}</p>
<p className="font-bold text-primary text-lg
mb-2">₦{item.price}</p>
<StatusBadge status={getListingStatus(item)} />
</div>
</div>
<div className="flex justify-between items-center
mt-4">
<div>
<span className="text-sm text-slate-500
dark:text-slate-400">Expires in: {formatExpiresIn(item.createdAt)}</span>
</div>
<div>
<ActionButtons status={getListingStatus(item)} />
</div>
</div>
</div>
))
) : (
<div className="p-4 text-center text-slate-500 dark:text-slate-400">No listings found. <Link to="/sell-item" className="text-primary hover:underline">Create one</Link></div>
)}
</div>
</div>
</div>
</main>
</div>
</div>
</div>

);
}
export default MyListingsPage;