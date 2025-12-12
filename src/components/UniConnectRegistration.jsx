import React, { useState } from 'react';
import { auth, db, storage } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
// --- Data for select options ---
const institutions = [
'University of Lagos',
'Ahmadu Bello University',
'University of Ibadan',
'Obafemi Awolowo University',
'University of Nigeria, Nsukka',
];
const UniConnectRegistration = () => {
const navigate = useNavigate();
const [step, setStep] = useState(1);
const [formData, setFormData] = useState({
email: '',
password: '',
displayName: '',
bio: '',
interests: [],
registerAs: 'student',
institution: institutions[0], // Set default institution
documentType: 'University ID',
file: null,
});
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
// --- Event Handlers ---
const handleInputChange = (e) => {
  const { id, value, type, files } = e.target;
  if (type === 'file') {
    const file = files[0];
    if (!file) return;
    
    // Read file as Data URL (base64)
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // Check for Firestore document size limit (1MB), leave headroom
      const maxDataUrlLength = 900000; // ~900KB
      if (dataUrl && dataUrl.length > maxDataUrlLength) {
        setError('Selected file is too large. Please choose a smaller file (max ~900KB).');
        setFormData((prevData) => ({
          ...prevData,
          file: null,
          fileDataUrl: null,
        }));
      } else {
        setError(null);
        setFormData((prevData) => ({
          ...prevData,
          file,
          fileDataUrl: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
  } else {
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  }
};
const handleNext = async (e) => {
	e.preventDefault();
	// If registering as a student, continue to step 2 for verification.
	if (formData.registerAs === 'student') {
		setStep(2);
		return;
	}

	// For guests, create the Firebase Auth user immediately and save a user doc.
	setLoading(true);
	setError(null);
	try {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			formData.email,
			formData.password
		);
		const user = userCredential.user;
				// If a file was selected, upload it to Storage under users/{uid}/
				let fileStoragePath = null;
				let fileDownloadUrl = null;
				let fileDataUrlToStore = formData.fileDataUrl || null;
				if (formData.file) {
					try {
						fileStoragePath = `users/${user.uid}/${Date.now()}_${formData.file.name}`;
						await uploadBytes(storageRef(storage, fileStoragePath), formData.file);
						fileDownloadUrl = await getDownloadURL(storageRef(storage, fileStoragePath));
					} catch (uploadErr) {
						console.warn('Storage upload failed:', uploadErr);
						// If upload fails, we still continue and save metadata without storage URL
					}
				}
				// If the dataUrl is too large we set fileDataUrlToStore=null to avoid Firestore limits
				const maxDataUrlLength = 900000;
				if (fileDataUrlToStore && fileDataUrlToStore.length > maxDataUrlLength) {
					fileDataUrlToStore = null;
				}
				// Generate a simple referral code and link for the new user
				const referralCode = user.uid ? String(user.uid).slice(0, 8) : Math.random().toString(36).slice(2, 10);
				const referralLink = (typeof window !== 'undefined' && window.location && window.location.origin)
					? `${window.location.origin}/?ref=${referralCode}`
					: `/?ref=${referralCode}`;

					// If visitor had a referral code, store it on the new user record
					// Attribution (incrementing the referrer's counters) should be done server-side
					// (e.g. Cloud Function) to avoid client-side permission issues.
					const incomingRefGuest = (typeof window !== 'undefined') ? localStorage.getItem('referral_code') : null;
					if (incomingRefGuest) {
					  // store the code for server-side attribution
					  // remove from localStorage so it isn't reused
					  try { localStorage.removeItem('referral_code'); } catch (e) {}
					}

					await setDoc(doc(db, 'users', user.uid), {
					email: formData.email,
					displayName: formData.displayName || '',
					bio: formData.bio || '',
					interests: formData.interests || [],
					registerAs: formData.registerAs,
					institution: formData.institution || null,
					documentType: formData.documentType || null,
					documentFileName: formData.file ? formData.file.name : null,
					fileDataUrl: fileDataUrlToStore,
						verified: false,
						referredByCode: incomingRefGuest || null,
					referralCode,
					referralLink,
					referralsCount: 0,
					createdAt: serverTimestamp(),
				});
		navigate('/guest-dashboard');
	} catch (err) {
		console.error('Error creating guest user:', err);
		setError(err.message || 'Failed to create account');
		alert(`Error: ${err.message}`);
	} finally {
		setLoading(false);
	}
};

const handleSubmit = async (e) => {
	e.preventDefault();
	setLoading(true);
	setError(null);
	try {
		console.log('Starting user registration...');
		
		// Create the user in Firebase Auth
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			formData.email,
			formData.password
		);
		const user = userCredential.user;
		console.log('User created in Auth:', user.uid);

		// Handle file data if present
		let fileDataUrlToStore = formData.fileDataUrl || null;
		
		// Check file size for Firestore limits (1MB limit with some headroom)
		const maxDataUrlLength = 900000; // ~900KB
		if (fileDataUrlToStore && fileDataUrlToStore.length > maxDataUrlLength) {
			console.warn('File too large for base64 storage in Firestore (max ~900KB)');
			setError('Selected file is too large. Please choose a smaller file (max ~900KB).');
			setLoading(false);
			return;
		}

		const userData = {
			email: formData.email,
			displayName: formData.displayName || '',
			bio: formData.bio || '',
			interests: formData.interests || [],
			registerAs: formData.registerAs,
			institution: formData.institution || null,
			documentType: formData.documentType || null,
			documentFileName: formData.file ? formData.file.name : null,
			fileDataUrl: fileDataUrlToStore,
			verified: false,
			referralCode: user.uid ? String(user.uid).slice(0, 8) : Math.random().toString(36).slice(2, 10),
			referralLink: (typeof window !== 'undefined' && window.location && window.location.origin)
				? `${window.location.origin}/?ref=${user.uid ? String(user.uid).slice(0, 8) : Math.random().toString(36).slice(2, 10)}`
				: `/?ref=${user.uid ? String(user.uid).slice(0, 8) : Math.random().toString(36).slice(2, 10)}`,
			referralsCount: 0,
			createdAt: serverTimestamp(),
		};

		// Apply referral if present (visitor came with ?ref=...)
		// NOTE: do not perform cross-user reads/writes from the client. Instead
		// store the referral code on the new user doc so a secure server-side
		// Cloud Function can attribute it and update the referrer's counters.
		const incomingRef = (typeof window !== 'undefined') ? localStorage.getItem('referral_code') : null;
		if (incomingRef) {
			userData.referredByCode = incomingRef;
			localStorage.removeItem('referral_code');
		}
		console.log('Saving user data to Firestore...', userData);
		
		// Save user data to Firestore
		const userDocRef = doc(db, 'users', user.uid);
		await setDoc(userDocRef, userData);
		console.log('User data saved successfully to Firestore');

		// Redirect to verification-pending page for students
		if (formData.registerAs === 'student') {
			navigate('/verification-pending');
		} else {
			// For guests, redirect to guest dashboard or appropriate page
			navigate('/guest-dashboard');
		}
	} catch (err) {
		console.error('Error creating student user:', err);
		// Provide a clearer message for common network/API issues
		if (err && err.code === 'auth/network-request-failed') {
			setError('Network request failed. Check your internet connection and browser extensions that may block requests (adblocker, privacy plugins).');
			alert('Network error: could not reach Firebase. Check your connection and API key restrictions in the Firebase console.');
		} else if (err && err.code && err.code.includes('api-key')) {
			setError('Invalid or restricted API key. Ensure VITE_FIREBASE_API_KEY is correct and not restricted to the wrong origins.');
			alert('API key error: please verify your Firebase API key and restrictions.');
		} else {
			setError(err.message || 'Failed to create account');
			alert(`Error: ${err.message}`);
		}
	} finally {
		setLoading(false);
	}
};
// --- Progress Bar Logic ---
const progressPercentage = step === 1 ? (formData.registerAs ===
'student' ? 50 : 100) : 100;
const stepText = step === 1 && formData.registerAs === 'student' ?
'Step 1 of 2' : 'Step 2 of 2';
return (
<div className="relative flex min-h-screen flex-col justify-center
overflow-hidden p-4">
<div className="m-auto flex w-full max-w-lg flex-col items-center
rounded-xl p-6 sm:p-8 shadow-lg bg-white dark:bg-gray-800">
<div className="w-full">
{step !== 'success' && (
<div className="mb-8">
<div className="flex justify-between mb-1">
<p className="text-sm font-medium text-slate-700
dark:text-slate-300">
{formData.registerAs === 'student' ? stepText : 'Complete'}
</p>
<p className="text-sm font-medium text-slate-700
dark:text-slate-300">{progressPercentage}%</p>
</div>
<div className="h-2 w-full rounded bg-slate-200
dark:bg-slate-700">
<div className="h-2 rounded bg-primary transition-all
duration-300" style={{ width: `${progressPercentage}%` }}></div>
</div>
</div>
)}
{/* --- Step 1: Account Creation --- */}
{step === 1 && (
<div>
<div className="mb-6 text-center">
<h1 className="text-3xl font-black text-slate-900
dark:text-white">Create your UniSpace account</h1>
</div>
<form onSubmit={handleNext} className="space-y-6">
<button type="button" className="flex w-full cursor-pointer
items-center justify-center gap-3 rounded-lg border border-slate-300
bg-white px-5 py-3 text-base font-medium text-slate-700
hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800
dark:text-slate-300 dark:hover:bg-slate-700">
<svg className="h-5 w-5" viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"><path d="M22.56
12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21
3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98
7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86
0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
fill="#34A853"></path><path d="M5.84
14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43
8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21
1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66
2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
<span>Sign up with Google</span>
</button>
<div className="relative flex items-center">
<div className="w-full flex-grow border-t border-slate-300
dark:border-slate-600"></div>
<span className="mx-4 flex-shrink text-sm font-medium
text-slate-500 dark:text-slate-400">OR</span>
<div className="w-full flex-grow border-t border-slate-300
dark:border-slate-600"></div>
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="email">Email</label>
<input className="form-input block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
placeholder:text-slate-400 focus:border-primary focus:ring-primary
dark:border-slate-600 dark:bg-slate-800 dark:text-white
dark:placeholder:text-slate-500" id="email" type="email"
placeholder="Enter your email" value={formData.email}
onChange={handleInputChange} required />
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300"
htmlFor="password">Password</label>
<div className="relative">
<input className="form-input block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
placeholder:text-slate-400 focus:border-primary focus:ring-primary
dark:border-slate-600 dark:bg-slate-800 dark:text-white
dark:placeholder:text-slate-500" id="password" type={showPassword ?
'text' : 'password'} placeholder="Enter your password"
value={formData.password} onChange={handleInputChange} required
/>
<button type="button" onClick={() =>
setShowPassword(!showPassword)} className="absolute inset-y-0
right-0 flex items-center pr-3 text-slate-400 hover:text-slate-500
dark:text-slate-500 dark:hover:text-slate-400">
<span
className="material-symbols-outlined">{showPassword ? 'visibility_off'
: 'visibility'}</span>
</button>
</div>
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="registerAs">Register
as</label>
<select className="form-select block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
focus:border-primary focus:ring-primary dark:border-slate-600
dark:bg-slate-800 dark:text-white" id="registerAs"
value={formData.registerAs} onChange={handleInputChange}>
<option value="student">Student</option>
<option value="guest">Guest</option>
</select>
</div>
{formData.registerAs === 'student' && (
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="institution">Select
Institution</label>
<select className="form-select block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
focus:border-primary focus:ring-primary dark:border-slate-600
dark:bg-slate-800 dark:text-white" id="institution"
value={formData.institution} onChange={handleInputChange}>
{institutions.map(inst => <option key={inst}
value={inst}>{inst}</option>)}
</select>
</div>
)}
<button type="submit" className="flex w-full cursor-pointer
items-center justify-center rounded-lg bg-primary px-5 py-4 text-base
font-bold tracking-wide text-white hover:bg-primary/90">
Next
</button>
</form>
</div>
)}
{/* --- Step 2: Verification --- */}
{step === 2 && (
<div>
<div className="mb-6 text-center">
<h1 className="text-3xl font-black text-slate-900
dark:text-white">Verify your student status</h1>
</div>
<form onSubmit={handleSubmit} className="space-y-6">
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="document-type">Document
Type</label>
<select className="form-select block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
focus:border-primary focus:ring-primary dark:border-slate-600
dark:bg-slate-800 dark:text-white" id="documentType"
value={formData.documentType} onChange={handleInputChange}>
<option>University ID</option>
<option>School Fees Receipt</option>
</select>
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="file">Proof of
Studentship</label>
<div className="flex items-center justify-center w-full">
<label htmlFor="file" className="flex flex-col items-center
justify-center w-full h-48 border-2 border-slate-300 border-dashed
rounded-lg cursor-pointer bg-slate-50 dark:hover:bg-slate-700
dark:bg-slate-800 hover:bg-slate-100 dark:border-slate-600
dark:hover:border-slate-500">
<div className="flex flex-col items-center justify-center
pt-5 pb-6 text-center">
<span className="material-symbols-outlined text-4xl
text-slate-400 dark:text-slate-500">cloud_upload</span>
{formData.file ? (
<p className="font-semibold
text-primary">{formData.file.name}</p>
) : (
<>
<p className="mb-2 text-sm text-slate-500
dark:text-slate-400"><span className="font-semibold">Click to
upload</span> or drag and drop</p>
<p className="text-xs text-slate-500
dark:text-slate-400">PNG, JPG or PDF</p>
</>
)}
</div>
<input id="file" type="file" className="hidden"
onChange={handleInputChange} />
</label>
</div>
</div>
<button type="submit" className="flex w-full cursor-pointer
items-center justify-center rounded-lg bg-primary px-5 py-4 text-base
font-bold tracking-wide text-white hover:bg-primary/90">
Submit
</button>
</form>
</div>
)}

</div>
</div>
</div>
);
};
export default UniConnectRegistration;