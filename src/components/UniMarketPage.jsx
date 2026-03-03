import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import AppHeader from './AppHeader';
import Footer from './Footer';
// ComingSoonOverlay removed
// --- Data for UI elements (Makes JSX cleaner and easier to manage) ---
const navLinks = [
{ name: 'Dashboard', path: '/dashboard', active: false },
{ name: 'Marketplace', path: '/unimarket', active: true },
{ name: 'UniDoc', path: '/uni-doc', active: false },
{ name: 'Wallet', path: '/uni-wallet', active: false },
];
const categories = ['All Categories', 'Electronics', 'Textbooks', 'Fashion', 'Services', 'Furniture'];
// component state for products (start empty; will be populated from Firestore)
const productsStateInitial = [];
// --- Sub-components for better organization ---
const ProductCard = ({ product }) => {
const [sellerAvatar, setSellerAvatar] = useState('/default_avatar.png');
const navigate = useNavigate();

// Fetch seller's avatar from Firestore using sellerId
useEffect(() => {
	if (product.sellerId) {
		// If the listing already includes sellerAvatarUrl (saved at post time), use it
		if (product.sellerAvatarUrl) {
			setSellerAvatar(product.sellerAvatarUrl);
			return;
		}
		const fetchSellerAvatar = async () => {
			try {
				const sellerDoc = await getDoc(doc(db, 'users', product.sellerId));
				if (sellerDoc.exists() && sellerDoc.data().avatarUrl) {
					setSellerAvatar(sellerDoc.data().avatarUrl);
				}
			} catch (err) {
				// If permission denied, fall back to placeholder avatar instead of failing
				if (err && err.code === 'permission-denied') {
					console.warn('Permission denied when fetching seller avatar; using placeholder');
					setSellerAvatar('/default_avatar.png');
				} else {
					console.error('Error fetching seller avatar:', err);
				}
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
					src={product.imageUrl || (product.images && product.images[0]) || '/vite.svg'} />
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
	
	// ComingSoonOverlay removed: feature is available

	// ...existing code...
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
	<div>
<div className="w-full h-screen flex flex-col" style={{ overscrollBehaviorY: 'contain' }}>
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
<main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-8">
<div className="max-w-7xl mx-auto">
<div className="flex flex-col md:flex-row md:items-center
md:justify-between gap-4 mb-8">
<h1 className="text-secondary dark:text-white text-xl sm:text-2xl lg:text-3xl
font-bold">UniMarket</h1>
<Link to="/sell-item" className="flex items-center justify-center gap-2
rounded-lg h-10 sm:h-11 px-4 sm:px-6 bg-primary text-white text-xs sm:text-sm font-bold w-full
md:w-auto hover:bg-primary/90 active:scale-95 transition-all">
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
className="form-input w-full pl-10 pr-4 py-2 h-10 sm:h-11 rounded-lg
bg-background-light dark:bg-slate-800 border-transparent
focus:border-primary focus:ring-primary text-secondary dark:text-white"
placeholder="Search for items..."
type="text"
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
/>
</div>
<select
className="form-select flex-shrink-0 w-full sm:w-48 h-10 sm:h-11
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
<p className="text-lg sm:text-xl font-semibold text-secondary
dark:text-white\">No items found</p>
<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2\">Try adjusting your search or category filters.</p>
</div>
)}
</div>
</main>
</div>
<Footer darkMode={darkMode} />
</div>
);
};
export default UniMarketPage;


