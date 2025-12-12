import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useVerified from '../hooks/useVerified';
// --- Data for UI elements ---
const navLinks = [
{ name: 'Dashboard', href: '#', active: false },
{ name: 'Marketplace', href: '#', active: true },
{ name: 'Study Hub', href: '#', active: false },
{ name: 'Wallet', href: '#', active: false },
];
const categories = ['Electronics', 'Textbooks', 'Fashion', 'Services',
'Furniture'];
const durationOptions = {
days: { max: 7, fee: 50 },
weeks: { max: 4, fee: 300 },
months: { max: 12, fee: 1000 },
};
// --- Sub-components for better organization ---
const Header = ({ darkMode, toggleDarkMode }) => {
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isProfileOpen, setIsProfileOpen] = useState(false);
const [userAvatar, setUserAvatar] = useState('/default_avatar.png');

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
<div className="size-6 text-primary"><svg fill="currentColor"
viewBox="0 0 48 48"><path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path></svg>
</div>
<h2 className="text-xl font-bold leading-tight
tracking-tight">UniSpace</h2>
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

<button onClick={() => setIsProfileOpen(!isProfileOpen)}><div
className="bg-center bg-no-repeat aspect-square bg-cover
rounded-full size-10" style={{backgroundImage:
`url("${userAvatar}")`}}></div></button>
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
<div className="lg:hidden"><button onClick={() =>
setIsMenuOpen(!isMenuOpen)} className="text-secondary
dark:text-white"><span className="material-symbols-outlined
text-3xl">{isMenuOpen ? 'close' : 'menu'}</span></button></div>
</div>
</header>
{isMenuOpen && (
<nav className="lg:hidden bg-white dark:bg-secondary border-b border-slate-200 dark:border-slate-700 py-2">
{navLinks.map(link => (
<a key={link.name} href={link.href} className="block px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800" onClick={() => setIsMenuOpen(false)}>
{link.name}
</a>
))}
</nav>
)}
</>
);
}
const ImageUploader = ({ uploadedFiles, setUploadedFiles }) => {
const [isDragging, setIsDragging] = useState(false);
const handleFileChange = (e) => {

const files = Array.from(e.target.files);
processFiles(files);
};
const processFiles = useCallback((files) => {
const newFiles = files.map(file => ({
file,
preview: URL.createObjectURL(file)
}));
setUploadedFiles(prev => [...prev, ...newFiles]);
}, [setUploadedFiles]);

const handleDrop = useCallback((e) => {
e.preventDefault();
setIsDragging(false);
const files = Array.from(e.dataTransfer.files);
processFiles(files);
}, [processFiles]);
const removeFile = (index) => {
setUploadedFiles(prev => prev.filter((_, i) => i !== index));
};
return (
<div>
<h2 className="text-xl font-semibold text-secondary dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3
mb-6">Upload Images</h2>
<div onDragOver={(e) => {e.preventDefault(); setIsDragging(true);}}
onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed
rounded-lg ${isDragging ? 'border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
<div className="space-y-1 text-center">
<span className="material-symbols-outlined text-4xl
text-slate-400 dark:text-slate-500">cloud_upload</span>

<div className="flex text-sm text-slate-600
dark:text-slate-400">
<label htmlFor="file-upload" className="relative
cursor-pointer rounded-md font-medium text-primary
hover:text-primary/80"><span>Upload files</span><input
id="file-upload" name="file-upload" type="file" multiple
className="sr-only" onChange={handleFileChange}/></label>
<p className="pl-1">or drag and drop</p>
</div>
<p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF up to 10MB</p>
</div>
</div>
<div className="mt-4 grid grid-cols-3 sm:grid-cols-4
md:grid-cols-5 gap-4">
{uploadedFiles.map((file, index) => (
<div key={index} className="relative">
<img alt={`preview ${index}`} className="w-full h-24
object-cover rounded-lg" src={file.preview} />
<button onClick={() => removeFile(index)}
className="absolute top-1 right-1 bg-black/50 text-white rounded-full
p-0.5" type="button"><span className="material-symbols-outlined
text-sm">close</span></button>
</div>
))}
</div>
</div>
);
};
const ListingSummary = ({ duration, fee, balance }) => {
const hasSufficientBalance = balance >= fee;
return (
<div className="bg-background-light dark:bg-slate-800/50
rounded-lg p-4">

<h3 className="font-semibold text-secondary dark:text-white
mb-3">Summary</h3>
<div className="space-y-2 text-sm text-slate-600
dark:text-slate-300">
<div className="flex justify-between"><span>UniWallet
Balance:</span><span className="font-medium text-secondary
dark:text-white">₦{balance.toLocaleString()}</span></div>
<div className="flex justify-between"><span>Listing
Duration:</span><span className="font-medium text-secondary
dark:text-white">{duration}</span></div>
<div className="flex justify-between border-b
border-slate-200 dark:border-slate-700 pb-2"><span>Listing
Fee:</span><span className="font-medium text-secondary
dark:text-white">- ₦{fee.toLocaleString()}</span></div>
<div className="flex justify-between font-bold text-base mt-2
text-primary"><span>Total to be
Deducted:</span><span>₦{fee.toLocaleString()}</span></div>
</div>
{!hasSufficientBalance && (
<div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30
text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start
gap-3">
<span className="material-symbols-outlined
mt-0.5">error</span>
<div>
<p className="font-semibold">Insufficient Balance</p>
<p>Your UniWallet balance is too low. Please top up to
post your listing.</p>
<button className="mt-2 text-white bg-primary
hover:bg-primary/90 font-bold py-1 px-3 rounded-md text-xs"
type="button">Top Up Wallet</button>
</div>
</div>
)}
</div>
);
}

// --- Main Page Component ---
const SellItemPage = () => {
const { darkMode, toggleTheme } = useTheme();
const { isLoading: verifyingLoading, verified, status } = useVerified();
const navigate = useNavigate();

useEffect(() => {
	if (!verifyingLoading && !verified) {
		if (status === 'failed') {
			toast.error('Your verification failed. You cannot create listings.');
			navigate('/verification-failed');
		} else {
			toast('Complete verification to create a listing');
			navigate('/verification-pending');
		}
	}
}, [verifyingLoading, verified, status, navigate]);

// preserve existing navigate binding
// const navigate = useNavigate();
const [formData, setFormData] = useState({ productName: '', price: '',
category: '', description: '' });
const [uploadedFiles, setUploadedFiles] = useState([]);
const [durationType, setDurationType] = useState('days');
const [durationValue, setDurationValue] = useState(7);
const walletBalance = 2500; // Mock data
// theme handled by useTheme
const handleInputChange = (e) => {
const { id, value } = e.target;
setFormData(prev => ({...prev, [id]: value}));
};
const handleDurationTypeChange = (e) => {
setDurationType(e.target.value);
setDurationValue(1); // Reset slider on type change
};
const listingFee = durationOptions[durationType].fee * durationValue;


const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve(reader.result);
	reader.onerror = (err) => reject(err);
	reader.readAsDataURL(file);
});

const handleSubmit = async (e) => {
	e.preventDefault();
	if (walletBalance < listingFee) {
		toast.error('Cannot submit: Insufficient balance.');
		return;
	}

	const user = auth.currentUser;
	if (!user) {
		toast.error('You must be logged in to post a listing');
		navigate('/login');
		return;
	}

	try {
		toast.loading('Posting listing...', { id: 'posting' });

		// convert up to 3 images to base64 (keep payload small)
		const images = [];
		for (let i = 0; i < Math.min(uploadedFiles.length, 3); i++) {
			const f = uploadedFiles[i];
			if (f?.file) {
				try {
					const dataUrl = await readFileAsDataURL(f.file);
					images.push(dataUrl);
				} catch (err) {
					console.warn('Failed to read file', err);
				}
			}
		}

		// attempt to get seller display name from users collection
		let sellerName = '';
		let sellerAvatarUrl = '';
		try {
			const userDoc = await getDoc(doc(db, 'users', user.uid));
			if (userDoc.exists()) {
				const userData = userDoc.data();
				// Use displayName first, fallback to fullName, then email, then 'Seller'
				sellerName = userData.displayName || userData.fullName || user.email.split('@')[0] || 'Seller';
				if (userData.avatarUrl) sellerAvatarUrl = userData.avatarUrl;
			}
		} catch (err) {
			console.warn('Failed to fetch seller name', err);
			// Fallback to email if fetch fails
			sellerName = user.email.split('@')[0] || 'Seller';
		}

		const listing = {
			name: formData.productName,
			price: Number(formData.price) || formData.price,
			category: formData.category,
			description: formData.description,
			images,
			sellerId: user.uid,
			sellerName,
			sellerAvatarUrl,
			createdAt: serverTimestamp(),
		};

		await addDoc(collection(db, 'listings'), listing);

		toast.dismiss('posting');
		toast.success('Listing posted successfully!');
		// reset form
		setFormData({ productName: '', price: '', category: '', description: '' });
		setUploadedFiles([]);
		navigate('/unimarket');
	} catch (err) {
		console.error('Failed to post listing', err);
		toast.dismiss('posting');
		toast.error('Failed to post listing. Please try again.');
	}
};
return (
<div className="relative flex min-h-screen w-full flex-col">
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
<main className="flex-1 px-4 sm:px-6 lg:px-10 py-8">
<div className="max-w-4xl mx-auto">
<div className="mb-8">
<h1 className="text-secondary dark:text-white text-3xl font-bold
leading-tight mb-2">Create a New Listing</h1>
<p className="text-slate-600 dark:text-slate-300">Fill in the
details below to sell your item on UniMarket.</p>
</div>
<div className="bg-white dark:bg-secondary rounded-xl
shadow-md p-6 sm:p-8">
<form onSubmit={handleSubmit} className="space-y-8">
<div>
<h2 className="text-xl font-semibold text-secondary
dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3
mb-6">Item Details</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="md:col-span-2"><label
htmlFor="productName" className="block text-sm font-medium
text-slate-700 dark:text-slate-300 mb-2">Product Name</label><input
id="productName" value={formData.productName}
onChange={handleInputChange} type="text" placeholder="e.g., Slightly
Used HP Elitebook 840 G5" className="form-input w-full rounded-lg
bg-background-light dark:bg-slate-800 border-transparent
focus:border-primary focus:ring-primary text-secondary dark:text-white
placeholder:text-slate-400 dark:placeholder:text-slate-500"
required/></div>
<div><label htmlFor="price" className="block text-sm
font-medium text-slate-700 dark:text-slate-300 mb-2">Price

(₦)</label><input id="price" value={formData.price}
onChange={handleInputChange} type="number" placeholder="e.g.,
150000" className="form-input w-full rounded-lg bg-background-light
dark:bg-slate-800 border-transparent focus:border-primary
focus:ring-primary text-secondary dark:text-white
placeholder:text-slate-400 dark:placeholder:text-slate-500"
required/></div>
<div><label htmlFor="category" className="block text-sm
font-medium text-slate-700 dark:text-slate-300
mb-2">Category</label><select id="category"
value={formData.category} onChange={handleInputChange}
className="form-select w-full rounded-lg bg-background-light
dark:bg-slate-800 border-transparent focus:border-primary
focus:ring-primary text-secondary dark:text-white" required><option
value="">Select a category</option>{categories.map(c => <option
key={c} value={c}>{c}</option>)}</select></div>
<div className="md:col-span-2"><label
htmlFor="description" className="block text-sm font-medium
text-slate-700 dark:text-slate-300 mb-2">Description</label><textarea
id="description" value={formData.description}
onChange={handleInputChange} rows="4" placeholder="Provide a
detailed description..." className="form-textarea w-full rounded-lg
bg-background-light dark:bg-slate-800 border-transparent
focus:border-primary focus:ring-primary text-secondary dark:text-white
placeholder:text-slate-400
dark:placeholder:text-slate-500"></textarea></div>
</div>
</div>
<ImageUploader uploadedFiles={uploadedFiles}
setUploadedFiles={setUploadedFiles} />
<div>
<h2 className="text-xl font-semibold text-secondary
dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3
mb-6">Listing Duration &amp; Fee</h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6
items-start">
<div>
<label htmlFor="durationType" className="block text-sm
font-medium text-slate-700 dark:text-slate-300 mb-2">Duration
Type</label>
<select id="durationType" value={durationType}
onChange={handleDurationTypeChange} className="form-select w-full
rounded-lg bg-background-light dark:bg-slate-800 border-transparent
focus:border-primary focus:ring-primary text-secondary
dark:text-white"><option value="days">Days</option><option
value="weeks">Weeks</option><option
value="months">Months</option></select>
<div className="mt-4">
<label htmlFor="durationValue" className="block
text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration:
<span className="font-bold">{durationValue} {durationValue > 1 ?
durationType : durationType.slice(0, -1)}</span></label>
<input id="durationValue" type="range" min="1"
max={durationOptions[durationType].max} value={durationValue}
onChange={(e) => setDurationValue(Number(e.target.value))}
className="w-full h-2 bg-slate-200 rounded-lg appearance-none
cursor-pointer dark:bg-slate-700 [&::-webkit-slider-thumb]:bg-primary"/>
</div>
</div>
<ListingSummary duration={`${durationValue}
${durationValue > 1 ? durationType : durationType.slice(0, -1)}`}
fee={listingFee} balance={walletBalance} />
</div>
</div>
<div className="pt-6 border-t border-slate-200
dark:border-slate-700">
<div className="flex justify-end">
<button type="submit" className="flex items-center
justify-center gap-2 rounded-lg h-12 px-8 bg-primary text-white text-base
font-bold w-full sm:w-auto hover:bg-primary/90 disabled:bg-gray-400"
disabled={walletBalance < listingFee}>

<span
className="material-symbols-outlined">publish</span><span>Post
Listing</span>
</button>
</div>
</div>
</form>
</div>
</div>
</main>
</div>
);
}

export default SellItemPage;