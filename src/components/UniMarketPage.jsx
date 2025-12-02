import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
// --- Data for UI elements (Makes JSX cleaner and easier to manage) ---
const navLinks = [
{ name: 'Dashboard', path: '/dashboard', active: false },
{ name: 'Marketplace', path: '/unimarket', active: true },
{ name: 'Study Hub', path: '/study-hub', active: false },
{ name: 'Wallet', path: '/uni-wallet', active: false },
];
const categories = ['All Categories', 'Electronics', 'Textbooks', 'Fashion', 'Services', 'Furniture'];
// component state for products (start empty; will be populated from Firestore)
const productsStateInitial = [];
// --- Sub-components for better organization ---
const Header = ({ darkMode, toggleDarkMode }) => {
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isProfileOpen, setIsProfileOpen] = useState(false);
const [userAvatar, setUserAvatar] = useState('https://via.placeholder.com/40');
const navigate = useNavigate();

// Fetch current user's avatar from Firestore
useEffect(() => {
	const unsubscribe = auth.onAuthStateChanged(async (user) => {
		if (user) {
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

return (
<>
<header className="sticky top-0 z-20 flex items-center
justify-between whitespace-nowrap border-b border-solid
border-slate-200 dark:border-slate-700 px-4 sm:px-10 py-3 bg-white
dark:bg-secondary">
<div className="flex items-center gap-4 lg:gap-8">
<div className="flex items-center gap-4 text-secondary
dark:text-white">
<div className="size-6 text-primary">
<svg fill="currentColor" viewBox="0 0 48 48"><path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path></svg>
</div>
<h2 className="text-xl font-bold leading-tight
tracking-tight">UniConnect</h2>
</div>
<nav className="hidden lg:flex items-center gap-6">
{navLinks.map(link => (
<Link key={link.name} to={link.path} className={`text-sm
font-medium ${link.active ? 'text-primary font-bold' : 'text-secondary dark:text-white'}`}>{link.name}</Link>
))}
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
<button onClick={() => navigate('/notifications')} className="flex items-center justify-center rounded-lg
h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary
dark:text-white">
<span
className="material-symbols-outlined">notifications</span>
</button>
<button onClick={() => navigate('/inbox')} className="flex items-center justify-center rounded-lg
h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary
dark:text-white">
<span
className="material-symbols-outlined">mail</span>
</button>
<div className="relative">
<button onClick={() => setIsProfileOpen(!isProfileOpen)}>
<div className="bg-center bg-no-repeat aspect-square
bg-cover rounded-full size-10" style={{backgroundImage:
`url("${userAvatar}")`}}></div>
</button>
{isProfileOpen && (
<div className="absolute right-0 mt-2 w-48 bg-white
dark:bg-secondary rounded-md shadow-lg py-1 z-10">
<button onClick={() => navigate('/edit-profile')} className="block w-full text-left px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800">Profile</button>
<a href="#" className="block px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800">Settings</a>
<a href="#" className="block px-4 py-2 text-sm
text-secondary dark:text-white hover:bg-background-light
dark:hover:bg-slate-800">Logout</a>
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
{isMenuOpen && (
<nav className="lg:hidden bg-white dark:bg-secondary border-b border-slate-200 dark:border-slate-700 py-2">
{navLinks.map(link => (
<Link key={link.name} to={link.path} className="block px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800" onClick={() => setIsMenuOpen(false)}>
{link.name}
</Link>
))}
</nav>
)}
</>
);
}
const ProductCard = ({ product }) => {
const [sellerAvatar, setSellerAvatar] = useState('https://via.placeholder.com/40');
const navigate = useNavigate();

// Fetch seller's avatar from Firestore using sellerId
useEffect(() => {
	if (product.sellerId) {
		const fetchSellerAvatar = async () => {
			try {
				const sellerDoc = await getDoc(doc(db, 'users', product.sellerId));
				if (sellerDoc.exists() && sellerDoc.data().avatarUrl) {
					setSellerAvatar(sellerDoc.data().avatarUrl);
				}
			} catch (err) {
				console.error('Error fetching seller avatar:', err);
			}
		};
		fetchSellerAvatar();
	}
}, [product.sellerId]);

const handleProductClick = () => {
	navigate(`/product-details/${product.id}`);
};

return (
<div className="bg-white dark:bg-secondary rounded-xl shadow-md
overflow-hidden flex flex-col cursor-pointer transition-transform hover:scale-105"
onClick={handleProductClick}>
<img alt={product.name} className="w-full h-48 object-cover"
src={product.imageUrl || (product.images && product.images[0]) || 'https://via.placeholder.com/400x300'} />
<div className="p-4 flex-grow flex flex-col">
<p className="text-sm text-slate-500
dark:text-slate-400">{product.category}</p>
<h3 className="font-bold text-lg text-secondary dark:text-white
mt-1 flex-grow">{product.name}</h3>
<p className="text-primary font-bold text-xl
mt-2">₦{product.price.toLocaleString()}</p>
<div className="flex items-center gap-2 mt-3 pt-3 border-t
border-slate-200 dark:border-slate-700">
<img alt={`${product.sellerName}'s profile`} className="w-6 h-6 rounded-full object-cover" src={sellerAvatar} />
<p className="text-sm text-secondary dark:text-white">{product.sellerName || 'Seller'}</p>
</div>
</div>
</div>
);
};

// --- Main Page Component ---
const UniMarketPage = () => {
const { darkMode, toggleTheme } = useTheme();
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All Categories');
const [products, setProducts] = useState(productsStateInitial);
useEffect(() => {
if (darkMode) document.documentElement.classList.add('dark');
else document.documentElement.classList.remove('dark');
}, [darkMode]);
const filteredProducts = useMemo(() => {
return products.filter(product => {
	const matchesCategory = selectedCategory === 'All Categories' ||
		(product.category && product.category === selectedCategory);
	const productName = product.name || '';
	const matchesSearch =
		productName.toLowerCase().includes(searchTerm.toLowerCase());
	return matchesCategory && matchesSearch;
});
}, [products, searchTerm, selectedCategory]);

// Subscribe to Firestore listings collection and keep products in sync
useEffect(() => {
	try {
		const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
		const unsub = onSnapshot(q, (snapshot) => {
			const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
			// Use the live items from Firestore (no mock fallback)
			setProducts(items);
		}, (err) => {
			console.error('Listings subscription error:', err);
			// On error, clear product list so UI shows "No items found"
			setProducts([]);
		});
		return () => unsub();
	} catch (e) {
		console.error('Error initializing listings subscription', e);
	}
}, []);
return (
<div className="relative flex min-h-screen w-full flex-col">
<Header darkMode={darkMode} toggleDarkMode={toggleTheme} />
<main className="flex-1 px-4 sm:px-6 lg:px-10 py-8">
<div className="max-w-7xl mx-auto">
<div className="flex flex-col md:flex-row md:items-center
md:justify-between gap-4 mb-8">
<h1 className="text-secondary dark:text-white text-3xl
font-bold">UniMarket</h1>
<Link to="/sell-item" className="flex items-center justify-center gap-2
rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold w-full
md:w-auto">
	<span className="material-symbols-outlined">add_circle</span>
	<span>Sell an Item</span>
</Link>
</div>
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-4 sm:p-6 mb-8">
<div className="flex flex-col sm:flex-row gap-4">
<div className="relative flex-grow">
<div className="absolute inset-y-0 left-0 flex items-center
pl-3 pointer-events-none text-slate-500">
<span
className="material-symbols-outlined">search</span>
</div>
<input
className="form-input w-full pl-10 pr-4 py-2 h-12 rounded-lg
bg-background-light dark:bg-slate-800 border-transparent
focus:border-primary focus:ring-primary text-secondary dark:text-white"
placeholder="Search for items..."
type="text"
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
/>
</div>
<select
className="form-select flex-shrink-0 w-full sm:w-48 h-12
rounded-lg bg-background-light dark:bg-slate-800 border-transparent
focus:border-primary focus:ring-primary text-secondary dark:text-white"
value={selectedCategory}
onChange={(e) => setSelectedCategory(e.target.value)}
>
{categories.map(cat => <option key={cat}>{cat}</option>)}
</select>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
xl:grid-cols-4 gap-6">
{filteredProducts.map(product => (
<ProductCard key={product.id} product={product} />
))}
</div>
{filteredProducts.length === 0 && (
<div className="text-center py-16 col-span-full">
<p className="text-xl font-semibold text-secondary
dark:text-white">No items found</p>
<p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search or category filters.</p>
</div>
)}
</div>
</main>
</div>
);
};
export default UniMarketPage;