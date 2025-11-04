import React, { useState, useEffect, useMemo } from 'react';
// --- Data for UI elements (Makes JSX cleaner and easier to manage) ---
const navLinks = [
{ name: 'Dashboard', href: '#', active: false },
{ name: 'Marketplace', href: '#', active: true },
{ name: 'Study Hub', href: '#', active: false },
{ name: 'Wallet', href: '#', active: false },
];
const categories = ['All Categories', 'Electronics', 'Textbooks', 'Fashion',
'Services', 'Furniture'];
const productsData = [
{ id: 1, category: 'Textbooks', name: 'Fundamentals of Engineering',
price: '5,000', imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuBlmBHbt8sFVTewmAFqVaVwAejL4zwoyKem7UXzGexMmDxHzo8Ru55gCmbWDnHTLdnt9xBmaaxlXf4S74_LBCabilppa6Zrq6myq1rTeU32Kmxjm8fXhaVVlbtT8wyJ51OzwRdJKqrw8-2M-RnR43lHtEL3H_cFLbS-3T8KtmIWFPNz2IG0Al1-z-9fSpQKDPt0tnMaDxlFqvauUsqk4WadErGrkqAIpGR8QoPXyFIpQKfc-gwxW-hGOaptLFK-0oDkV27idEIUHSXZ', sellerName: 'Adekunle Gold', sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI' },
{ id: 2, category: 'Electronics', name: 'HP Elitebook 840 G5', price:
'150,000', imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuA3PseYjpIvW1kpMj2EDuLgyjMQZsKcdmzBMbpNJWYmvNJSUa_outUdLqEuWzje1gvbcKHwR41EBUTMZPmfS8DY97EFjqeDQq8hRU4j3uF3h_DU5Ga-KEhuedjZaVaKbJl0ABq0XsUaa887gOOx2OB2jgH0qEQg8Mf9madQwg15-KHg0pljXnLwcAUu5viwBnEJaQ8Yeb1MEU2fAhEiIU4yYqm0k9PMgFrtRz7P3IEbjNXbCdm4d1l2HzFZJ-Vn9B7iCq3D_IteTI8c', sellerName: 'Chioma Okafor', sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuCQy3bjTCpY_7n5pBgNUx7UVtIBqAJbmYwKEbLpIB7b_ALNJQB7yf1txJ7O5Ejbn8eKU39f4XIp450TNkdl74ok1XkPNLKVg1jwD6RpDFpXy2iAOmCpHpFg_yIfg8P47w2K7sOeLDzgNZi61w1toyDmvyUlwM_u-nZSsPV0cpjpA4QUudNGcF0u0GS7VQzgYiTaFRrzCB-AUGKUsVwegSTFsjSbbQC7PxWl0G4ShrCJUsLVRpcikjgTJ7Nk8IVFgMjqCd-HOF4uM9_5' },
{ id: 3, category: 'Fashion', name: 'Vintage Leather Jacket', price:
'8,500', imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuClj3Iv8D4QnRlJeHutSPKCBmEQxmCSooywdnFenO7ZSllAoIRUf4QgRzl7rY6n2Un9TktH0eJLPmW_67k57faMQtqUeRBxMU1kXmqx_xzZ-8OoKZ34yDrE6cV0Kh2X_l9a5dNaCOnZJexCf1clVK60gOi2FnqUm20nEQWwYDuzwiuwLOsYZjMOcDtt7__qI5-6pLqFoBSjO7OgVKiGCamOsPz9XzN6-cJXt01DuUtY07SOZaRbPLyaMsR2bstMDrmIwpPFm-LtQMUC', sellerName: 'Bolanle Adeboye', sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuDeS3n9z8vIdWjpfdiGGID_f5mDEPZY4x_50xf91EbwZuCxgO6UfYSRwQ1WZpH20MU_fgmkQMRVvLN6lZYExlnynd4xZk2iY6QFyd-nUE6KtJvsf5mexDRgDnaL5YwWiEewmxg6P9qvBHXASnIUZ5xHcsowrYNHECbarL0pA4MfFHr6dCiV57A4_3Eoe9mbf0lm659k7RCgvt-wNG3rBM_9kYgIrYeuGdReKd9GdKiRLrL30yPgANyzzqQ5E74KSg1tMnegT9hwgoOI' },

{ id: 4, category: 'Services', name: 'Graphic Design for Flyers', price:
'3,000 /hr', imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB3tFuLoL0pa5bjMPHGVjYk4z4KSjXmJxZof73L9T780DeLu5yU9IsEQ44GF_JVCUx0dLEtNHOrzdPczHQlY9Ai202ADrvUVJtFYol0590XqZPrQsL6MvCmTpcNwXTGutc2FOi2pCsOd-Leb8ELcGP4tqvz0tA41HVEHxxH3pWmhE13Cwva6eJDCRg6MsxZGb7DY0BB7zceqpXe5ncrWBhUCCULdqGzqt_FXlBc_Z63xR9ldGDfnx3uNbjbSFlqU-x67iF_r72S7IzL', sellerName: 'Adekunle Gold', sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI' },
{ id: 5, category: 'Fashion', name: 'Nike Air Max 270', price: '25,000',
imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB9mXk_qbIXJYUVxnWvbQg_bozBnGEKHRrM8v4t3KcQmZHd-FxDm81WKa7Sjga6pBF5VoxZvEEjD7WxHkR-DpYU-kBAS_JQ3aZOjZDUbu09QoakvbG-jN-BHaJPSPzt0JmZ7cKqJF3_8xN3ykop63r1dxxeepW0l6UN313C0kraBIyJwgjjuR6zyRJNmmuyswyUC0MXK2t5hBQwgo56w1dZUdskGE0AkKY2pzcLLwQC0Q8r_QgnJdJCVMPqCCKl5ZzE8Oc34XLJWDCt', sellerName:
'Bolanle Adeboye', sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuCjyXhzV3HaeefPLKxxZ4-c_wVy-xOkmTN7pDLtI9LmJAJVZlA-U5xOtL7bdRcxA5OoiRRotfEYMdiOfKDDMblbAtEPn8RVlFS6su45a2KbiShZNLvBPMxL2I1T9AppOMBJg9IGtnclq-HS5UxE0Tbd4dI-MayPXRthB_cI2soGpC1rNYwh7aTGdnLo9vajEjuMbRHIpz5nlEVdvDaB4jVUTNNz-_TIpIXNj6g0E_Ba67qI2QhkS4yZUCa9nuEJgMwcXmm4XFXTeBUK' },
{ id: 6, category: 'Electronics', name: 'Beats by Dre Headset', price:
'18,500', imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuAt2vO4nW3jgysnaq7rVPGh4kxysZPvVF0dgOq5fmj6WjyVAPR1e31WNOWNAllcIDOi5id5virHcgCS2BhAkBV6ga5JIKGnUCh7H3rOM2p9xc1F4hCq-O2Qauvaj6OqGfw7tAZUfsijY9JOu_ngQ8weiLKe0av6rUq92H0XLQdUAU3Pc7dBkeoaqTMTa86L9gxOt9dkQexjL-w7HItHs_vm9o31WwXgq33PfWVg41_O4_Ke6OmFSG83_GAK54tKaGqvADnHvh6JDNj4', sellerName: 'Chioma Okafor', sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB3o8NLbW0ERvYc6NEfWWs0g8ZI2_w7GKMdQYNp5btvgib7LPHCLvlPzcLfMZpqPQ93Dx4e4HEdbgGapaXuK08EhMxA7aXg7H5_3QHb3d8hiDvLMOVBIH7t5f0XkjDNoux2sz5roKq6f8cMHPJRxUO6UeDQh85jzt7yhWX4eaqeeKklD8FBQJz4EifZRa88IdxOcB9xVRz8RPvTyjMqFUZTGIBZnYoftT-qA_Pn1MhJlC5ozeNxWxSf5E3fZLYreqhh82wnx6-tK3QW' },
{ id: 7, category: 'Textbooks', name: 'Intro to Python Programming',
price: '4,500', imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuAovQKFya31aotFBN5OX0NpRVSXwZDpMzgzF1nQFdBMETV-DeuRL-1iOSi5BAlKrpWt9CFYGOufVq5Qf5m2V_qDGe5uJ2-uyR5WhDiESxjPdg7rsmzU0761IErhpwA8hWSSXOHInCu11MWtPEa4iY0jGBdlxvm1y6L0tOkwf4h_z6T7MwQDGQhL9y-CupEqZ_ycKA9cTyCoAwo77TA2PVbsd70dLArrlhQ4EYE0DAWvoSJvvmbbKboCeuWefcHO6wu607g4VmEWWIzs', sellerName:
'Adekunle Gold', sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI' },
{ id: 8, category: 'Furniture', name: 'Compact Study Desk', price:
'12,000', imageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuDymv_jZCCpy4b9rkv0MY13UIobVGozxPtPzFcg62SnAHmBfTyD7vsz0L1tnevHyWGlrdDJeAJau2eIQrln_jcW7kiP3EtT5uMXtbenMpc7W1kFKQYNRyJTqNBvhSgHT2zBFhEw48xBb4kNYbGFXQ3Rd87bbrfn60R5VR26rK9TfylYYaFqCOrPJP19eBLIJiyyX7MAZ8U6hgrA-9byxroD6fMIGUyQSJjB1Iaz9YLtr9kbalawGMRDz1PNFdhsM_3Z0sVtjyAi_50O', sellerName: 'Chioma Okafor',
sellerImageUrl:
'https://lh3.googleusercontent.com/aida-public/AB6AXuBC1pGZp76FBTstZU58oDGVLqteHUKdWVewnHHRAm023iH6Uy3naBvwnRBKvPo2mfASWHf6-1D0zjwKOSYvQH9aA5PgJrOmTz-9kJosOnAW3jERDLyrWUoSH_ByOzm6jYZFzit1ymnFkWVW1WAMVq5CES75qkg7tSELUOMqqUYPhgyT8yavqRgciQ7Br1EnIMumnRsuRm8DfqrOEZ1uNAnEBjxua3TXXgsd0Db5sWj2W3LPSrt0Cvsyqx6UJIT0IG74ANZDdqvIAXEH' },
];
// --- Sub-components for better organization ---
const Header = ({ darkMode, toggleDarkMode }) => {
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isProfileOpen, setIsProfileOpen] = useState(false);
return (
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
<a key={link.name} href={link.href} className={`text-sm
font-medium ${link.active ? 'text-primary font-bold' : 'text-secondary dark:text-white'}`}>{link.name}</a>
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
<button className="flex items-center justify-center rounded-lg
h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary
dark:text-white">
<span
className="material-symbols-outlined">notifications</span>
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
);
}
const ProductCard = ({ product }) => (
<div className="bg-white dark:bg-secondary rounded-xl shadow-md
overflow-hidden flex flex-col">
<img alt={product.name} className="w-full h-48 object-cover"
src={product.imageUrl} />
<div className="p-4 flex-grow flex flex-col">
<p className="text-sm text-slate-500
dark:text-slate-400">{product.category}</p>
<h3 className="font-bold text-lg text-secondary dark:text-white
mt-1 flex-grow">{product.name}</h3>
<p className="text-primary font-bold text-xl
mt-2">₦{product.price}</p>
<div className="flex items-center gap-2 mt-3 pt-3 border-t
border-slate-200 dark:border-slate-700">
<img alt={`${product.sellerName}'s profile`} className="w-6
h-6 rounded-full object-cover" src={product.sellerImageUrl} />
<p className="text-sm text-secondary
dark:text-white">{product.sellerName}</p>
</div>
</div>
</div>
);

// --- Main Page Component ---
const UniMarketPage = () => {
const [darkMode, setDarkMode] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All Categories');
useEffect(() => {
if (darkMode) document.documentElement.classList.add('dark');
else document.documentElement.classList.remove('dark');
}, [darkMode]);
const filteredProducts = useMemo(() => {
return productsData.filter(product => {
const matchesCategory = selectedCategory === 'All Categories' ||
product.category === selectedCategory;
const matchesSearch =
product.name.toLowerCase().includes(searchTerm.toLowerCase());
return matchesCategory && matchesSearch;
});
}, [searchTerm, selectedCategory]);
return (
<div className="relative flex min-h-screen w-full flex-col">
<Header darkMode={darkMode} toggleDarkMode={() =>
setDarkMode(!darkMode)} />
<main className="flex-1 px-4 sm:px-6 lg:px-10 py-8">
<div className="max-w-7xl mx-auto">
<div className="flex flex-col md:flex-row md:items-center
md:justify-between gap-4 mb-8">
<h1 className="text-secondary dark:text-white text-3xl
font-bold">UniMarket</h1>
<button className="flex items-center justify-center gap-2
rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold w-full
md:w-auto">

<span
className="material-symbols-outlined">add_circle</span>
<span>Sell an Item</span>
</button>
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