import React, { useState } from 'react';
import uni3 from '../assets/uni3.jpg';
import { useTheme } from '../hooks/useTheme';
import { auth, db, storage } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import AppHeader from './AppHeader';
import Footer from './Footer';
// --- Data for select options (grouped by category) ---
const universityData = {
	federal: [
		'Abubakar Tafawa Balewa University, Bauchi',
		'Adeyemi Federal University of Education, Ondo',
		'Admiralty University Ibusa, Delta State',
		'African Aviation and Aerospace University',
		'Ahmadu Bello University, Zaria',
		'Air Force Institute of Technology, Kaduna',
		'Alex Ekwueme University, Ndufu-Alike, Ebonyi State',
		'Alvan Ikoku Federal University of Education, Owerri, Imo State',
		'Bayero University, Kano',
		'David Nweze Umahi Federal University of Medical Sciences, Uburu',
		'Federal University Gashua, Yobe',
		'Federal University of Agriculture and Developmental Studies, Iragbuji, Osun State',
		'Federal University of Agriculture Bassam-Biri, Bayelsa',
		'Federal University of Agriculture, Abeokuta',
		'Federal University of Agriculture, Mubi',
		'Federal University of Agriculture, Zuru, Kebbi State',
		'Federal University of Allied Health Sciences, Enugu',
		'Federal University of Applied Sciences, Kachia, Kaduna State',
		'Federal University of Education Kontagora, Niger State',
		'Federal University of Education Pankshin, Plateau State',
		'Federal University of Education, Zaria, Kaduna State',
		'Federal University of Environment and Technology, Tai Town, Ogoniland, Rivers State',
		'Federal University of Health Sciences Kwale, Delta State',
		'Federal University of Health Sciences, Azare, Bauchi State',
		'Federal University of Health Sciences, Ila Orangun, Osun State',
		'Federal University of Health Sciences, Katsina',
		'Federal University of Health Sciences, Otukpo, Benue State',
		'Federal University of Medicine and Medical Sciences, Abeokuta',
		'Federal University of Petroleum Resources, Effurun',
		'Federal University of Technology and Environmental Studies, Iyin-Ekiti, Ekiti State',
		'Federal University of Technology, Akure',
		'Federal University of Technology, Babura, Jigawa State',
		'Federal University of Technology, Ikot Abasi, Akwa Ibom State',
		'Federal University of Technology, Minna',
		'Federal University of Technology, Owerri',
		'Federal University of Transportation Daura, Katsina',
		'Federal University, Birnin Kebbi',
		'Federal University, Dutse, Jigawa State',
		'Federal University, Dutsin-Ma, Katsina',
		'Federal University, Gusau Zamfara',
		'Federal University, Kashere, Gombe State',
		'Federal University, Lafia, Nasarawa State',
		'Federal University, Lokoja, Kogi State',
		'Federal University, Otuoke, Bayelsa',
		'Federal University, Oye-Ekiti, Ekiti State',
		'Federal University, Wukari, Taraba State',
		'Joseph Sarwuan Tarka University, Makurdi',
		'Michael Okpara University of Agricultural Umudike',
		'Modibbo Adama University of Technology, Yola',
		'National Open University of Nigeria, Abuja',
		'National University of Science and Technology, Abuja',
		'Nigeria Police Academy Wudil',
		'Nigerian Army University Biu',
		'Nigerian Defence Academy Kaduna',
		'Nigerian Maritime University Okerenkoko, Delta State',
		'Nnamdi Azikiwe University, Awka',
		'Obafemi Awolowo University, Ile-Ife',
		'Tai Solarin Federal University of Education, Ijagun, Ijebu Ode',
		'University of Abuja, Gwagwalada',
		'University of Benin',
		'University of Calabar',
		'University of Ibadan',
		'University of Ilorin',
		'University of Jos',
		'University of Lagos',
		'University of Maiduguri',
		'University of Maritime Studies, Oron, Akwa Ibom State',
		'University of Nigeria, Nsukka',
		'University of Port-Harcourt',
		'University of Uyo',
		'Usumanu Danfodiyo University',
	],
	state: [
		'AbdulKadir Kure University, Minna Niger State',
		'Abdulsalam Abubakar University of Agriculture and Climate Action, Mokwa, Niger State',
		'Abia State University, Uturu',
		'Adamawa State University Mubi',
		'Adekunle Ajasin University, Akungba',
		'Akwa Ibom State University, Ikot Akpaden',
		'Aliko Dangote university of Science & Technology, Wudil',
		'Ambrose Alli University, Ekpoma',
		'Bamidele Olumilua University of Science and Technology Ikere, Ekiti State',
		'Bauchi State University, Gadau',
		'Bayelsa Medical University',
		'Benue State University of Agriculture Science and Technology, Ihugh',
		'Benue State University, Makurdi',
		'Bornu State University, Maiduguri',
		'Chukwuemeka Odumegwu Ojukwu University, Uli',
		'Confluence University of Science and Technology Osara, Kogi',
		'Cross River University of Education and Entrepeneurship, Akampa, Cross River State',
		'Delta State University Abraka',
		'Delta University of Science and Technology, Ozoro',
		'Dennis Osadebe University, Asaba',
		'Ebonyi State University of ICT, Science and Technology, Oferekpe, Ebonyi State',
		'Ebonyi State University, Abakaliki',
		'Edo State University Uzairue',
		'Ekiti State University',
		'Emanuel Alayande University of Education Oyo',
		'Enugu State University of Science and Technology, Enugu',
		'First Technical University Ibadan',
		'Gombe State University, Gombe',
		'Gombe State University of Science and Technology',
		'Ibrahim Badamasi Babangida University, Lapai',
		'Ignatius Ajuru University of Education, Rumuolumeni',
		'Imo State University, Owerri',
		'Kaduna State University, Kaduna',
		'Kebbi State University of Science and Technology, Aliero',
		'Kingsley Ozumba Mbadiwe University Ogboko, Imo State',
		'Kogi State University, Kabba',
		'Kwara State University of Education, Ilorin, Kwara State',
		'Kwara State University, Ilorin',
		'Ladoke Akintola University of Technology, Ogbomoso',
		'Lagos State University of Education, Ijanikin',
		'Lagos State University of Science and Technology Ikorodu',
		'Lagos State University, Ojo',
		'Moshood Abiola University of Science and Technology Abeokuta',
		'Nasarawa State University Keffi',
		'Niger Delta University Yenagoa',
		'Olabisi Onabanjo University, Ago Iwoye',
		'Olusegun Agagu University of Sc. & Tech., Okitipupa, Ondo',
		'Osun State University Osogbo',
		'Plateau State University Bokkos',
		'Prince Abubakar Audu University Anyigba',
		'Rivers State University',
		'Shehu Shagari University of Education, Sokoto',
		'Sokoto State University',
		'State University of Medical and Applied Sciences, Igbo-Eno, Enugu',
		'Sule Lamido University, Kafin Hausa, Jigawa',
		'Taraba State University, Jalingo',
		'Umar Musa Yar\'Adua University Katsina',
		'University of Aeronautics and Aerospace Engineering Ezza, Ebonyi State',
		'University of Africa Toru Orua, Bayelsa State',
		'University of Agriculture and Environmental Sciences Umuagwo, Imo State',
		'University of Cross River State, Calabar',
		'University of Delta, Agbor',
		'University of Ilesa, Osun State',
		'University of Medical Sciences, Ondo City, Ondo State',
		'Yobe State University, Damaturu',
		'Yusuf Maitama Sule University Kano',
		'Zamfara State University',
	],
	private: [
		'Abdulrasaq Abubakar Toyin University, Oke-Ogba, Ganmo, Ilorin, Kwara State',
		'Achievers University, Owo',
		'Adeleke University, Ede',
		'Afe Babalola University, Ado-Ekiti - Ekiti State',
		'African University of Economics, FCT, Abuja',
		'African University of Science and Technology, Abuja',
		'Ahman Pategi University, Kwara State',
		'Ajayi Crowther University, Ibadan',
		'Al-Ansar University, Maiduguri, Borno',
		'Al-Bayan University, Ankpa, Kogi State',
		'Aletheia University, Ago-Iwoye Ogun State',
		'Al-Hikmah University, Ilorin',
		'Al-Istiqama University, Sumaila, Kano State',
		'Al-Muhibbah Open University, Abuja',
		'Al-Qalam University, Katsina',
		'Amadeus University, Amizi, Abia State',
		'Amaj University, Kwali, Abuja',
		'American Open University, Ogun State',
		'American University of Nigeria, Yola',
		'Anan University, Kwall, Plateau State',
		'Anchor University Ayobo Lagos State',
		'Arthur Javis University Akpoyubo Cross river State',
		'Atiba University Oyo',
		'Augustine University',
		'Ave Maria University, Piyanko, Nasarawa State',
		'Azione Verde University, Imo State',
		'Azman University, Kano State',
		'Baba Ahmed University, Kano State',
		'Babcock University, Ilishan-Remo',
		'Baze University',
		'Bells University of Technology, Otta',
		'Benson Idahosa University, Benin City',
		'Bingham University, New Karu',
		'Bowen University, Iwo',
		'Bridget University, Mbaise, Imo State',
		'British Canadian University, Obufu Cross River State',
		'Caleb University, Lagos',
		'Canadian University of Nigeria, Abuja',
		'Capital City University, Kano State',
		'Caritas University, Enugu',
		'Chrisland University',
		'Christopher University Mowe',
		'Claretian University of Nigeria, Nekede, Imo State',
		'Clifford University Owerrinta Abia State',
		'Coal City University Enugu State',
		'College of Petroleum and Energy Studies, Kaduna State',
		'Cosmopolitan University Abuja',
		'Covenant University Ota',
		'Crawford University Igbesa',
		'Crescent University',
		'Dominican University Ibadan Oyo State',
		'Dominion University Ibadan, Oyo State',
		'Edusoko University, Bida, Niger State',
		'Edwin Clark University, Kaigbodo',
		'Eko University of Medical and Health Sciences Ijanikin, Lagos',
		'El-Amin University, Minna, Niger State',
		'Elizade University, Ilara-Mokin',
		'Elrazi Medical University Yargaya University, Kano State',
		'Eranova University, Abuja',
		'European University of Nigeria, Duboyi, FCT',
		'Evangel University, Akaeze',
		'Fountain University, Oshogbo',
		'Franco British International University, Kaduna State',
		'Gerar University of Medical Science Imope Ijebu, Ogun State',
		'Glorious Vision University, Ogwa, Edo State',
		'Godfrey Okoye University, Ugwuomu-Nike - Enugu State',
		'Greenfield University, Kaduna',
		'Greenland University, Jigawa State',
		'Gregory University, Uturu',
		'Hallmark University, Ijebi Itele, Ogun',
		'Havilla University, Nde-Ikom, Cross River State',
		'Hensard University, Toru-Orua, Sagbama, Bayelsa State',
		'Hezekiah University, Umudi',
		'Hillside University of Science and Technology, Okemisi, Ekiti State',
		'Huda University, Gusau, Zamafara State',
		'Iconic Open University, Sokoto State',
		'Igbinedion University Okada',
		'Isaac Balami University of Aeronautics and Management, Lagos State',
		'James Hope University, Lagos, Lagos State',
		'JEFAP University, Niger State',
		'Jewel University, Gombe state',
		'Jimoh Babalola University, Kwara State',
		'Joseph Ayo Babalola University, Ikeji-Arakeji',
		'Karl-Kumm University, Vom, Plateau State',
		'Kevin Eze University, Mgbowo, Enugu State',
		'Khadija University, Majia, Jigawa State',
		'Khalifa Isiyaku Rabiu University, Kano',
		'Kings University, Ode Omu',
		'Kola Daisi University Ibadan, Oyo State',
		'Kwararafa University, Wukari',
		'Landmark University, Omu-Aran',
		'Lead City University, Ibadan',
		'Leadership University, Abuja',
		'Legacy University, Okija Anambra State',
		'Lens University, Ilemona, Kwara State',
		'Lighthouse University, Evbobanosa, Edo State',
		'Lux Mundi University Umuahia, Abia State',
		'Madonna University, Okija',
		'Maduka University, Ekwegbe, Enugu State',
		'Maranatha University, Lagos',
		'Margaret Lawrence University, Umunede, Delta State',
		'Maryam Abacha American University of Nigeria, Kano State',
		'Mcpherson University, Seriki Sotayo, Ajebo',
		'Mercy Medical University, Iwo, Ogun State',
		'Mewar International University, Masaka, Nasarawa State',
		'Micheal & Cecilia Ibru University',
		'Minaret University, Ikirun, Osun State',
		'Miva Open University, Abuja FCT',
		'Monarch University, Iyesi-Ota, Ogun State',
		'Mountain Top University',
		'Mudiame University, Irrua, Edo State',
		'Muhammad Kamalud University Kwara',
		'New City University, Ayetoro, Ogun State',
		'Newgate University, Minna, Niger State',
		'Nigerian British University, Asa, Abia State',
		'Nigerian University of Technology and Management, Apapa, Lagos State',
		'Nile University of Nigeria, Abuja',
		'North Eastern University, Gombe',
		'NorthWest University Sokoto State',
		'Novena University, Ogume',
		'Obong University, Obong Ntak',
		'Oduduwa University, Ipetumodu - Osun State',
		'Ojaja University Eiyenkorin, Kwara State',
		'PAMO University of Medical Sciences, Portharcourt',
		'Pan-Atlantic University, Lagos',
		'Paul University, Awka - Anambra State',
		'PeaceLand University, Enugu State',
		'Peter University, Achina-Onneh Anambra State',
		'Philomath University, Kuje, Abuja',
		'Phoenix University, Agwada, Nasarawa State',
		'Precious Cornerstone University, Oyo',
		'Prime University, Kuje, FCT Abuja',
		'Rayhaan University, Kebbi',
		"Redeemer's University, Ede",
		'Renaissance University, Enugu',
		'Rhema University, Obeama-Asa - Rivers State',
		'Ritman University, Ikot Ekpene, Akwa Ibom',
		'Saisa University of Medical Sciences and Technology, Sokoto State',
		'Salem University, Lokoja',
		'Sam Maris University, Ondo',
		'Shanahan University Onitsha, Anambra State',
		'Skyline University, Kano',
		'Southern Atlantic University, Uyo, Akwa Ibom State',
		'Southwestern University, Oku Owa',
		'Spiritan University, Nneochi Abia State',
		'Sports University, Idumuje, Ugboko, Delta State',
		'Summit University, Offa',
		'Tansian University, Umunya',
		'Tazkiyah University, Kaduna State',
		'The Duke Medical University, Calabar, Cross River State',
		'Thomas Adewumi University, Oko-Irese, Kwara State',
		'Tonine Iredia University of Communication, Benin City, Edo State',
		'Topfaith University, Mkpatak, Akwa Ibom State',
		'Trinity University Ogun State',
		'Unique Open University, Lagos State',
		'University of Fortune, Igbotako, Ondo State',
		'University of Mkar, Mkar',
		'University of Offa, Kwara State',
		'University on the Niger, Umunya, Anambra state',
		'Venite University, Iloro-Ekiti, Ekiti State',
		'Veritas University, Abuja',
		'Vision University, Ikogbo, Ogun State',
		'Wellspring University, Evbuobanosa - Edo State',
		'Wesley University Ondo',
		'West Midlands Open University, Ibadan, Oyo State',
		'Western Delta University, Oghara Delta State',
		'Westland University Iwo, Osun State',
		'Wigwe University, Isiokpo Rivers State',
	],
};
const UniConnectRegistration = () => {
const navigate = useNavigate();
// logo target: landing for anonymous, dashboard for logged-in
const logoTarget = auth && auth.currentUser ? '/dashboard' : '/';
const { darkMode, toggleTheme } = useTheme();
const [step, setStep] = useState(1);
	const [institutionOpen, setInstitutionOpen] = useState(false);
	const [institutionCategory, setInstitutionCategory] = useState('federal');
	const [institutionSearch, setInstitutionSearch] = useState('');
const [formData, setFormData] = useState({
email: '',
password: '',
displayName: '',
bio: '',
interests: [],
registerAs: 'student',
		institution: '', // selected institution
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

// Helpers for institution selection
const allInstitutions = Object.entries(universityData).flatMap(([k, list]) => list.map(name => ({ name, category: k })));
const filteredInstitutions = allInstitutions.filter(i => {
	if (institutionCategory && institutionCategory !== 'all' && i.category !== institutionCategory) return false;
	if (!institutionSearch) return true;
	return i.name.toLowerCase().includes(institutionSearch.toLowerCase());
});

const selectInstitution = (name) => {
	setFormData(prev => ({ ...prev, institution: name }));
	setInstitutionOpen(false);
	setInstitutionSearch('');
};
const handleNext = async (e) => {
	e.preventDefault();
	
	// If we're on step 1 and registering as a student, go to step 2 for verification
	if (step === 1 && formData.registerAs === 'student') {
		setStep(2);
		return;
	}
	
	// If we're on step 1 and registering as a guest, go to step 2 for guest details
	if (step === 1 && formData.registerAs === 'guest') {
		setStep(2);
		return;
	}

	// If we're on step 2 and registering as a guest, create the account
	if (step === 2 && formData.registerAs === 'guest') {
		setLoading(true);
		setError(null);
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				formData.email,
				formData.password
			);
			const user = userCredential.user;
			
			// Generate a simple referral code and link for the new user
			const referralCode = user.uid ? String(user.uid).slice(0, 8) : Math.random().toString(36).slice(2, 10);
			const referralLink = (typeof window !== 'undefined' && window.location && window.location.origin)
				? `${window.location.origin}/?ref=${referralCode}`
				: `/?ref=${referralCode}`;

			// If visitor had a referral code, store it on the new user record
			const incomingRefGuest = (typeof window !== 'undefined') ? localStorage.getItem('referral_code') : null;
			if (incomingRefGuest) {
				try { localStorage.removeItem('referral_code'); } catch (e) {}
			}

			await setDoc(doc(db, 'users', user.uid), {
				email: formData.email,
				displayName: formData.displayName || '',
				bio: formData.bio || '',
				interests: formData.interests || [],
				registerAs: 'Guest',
				institution: null, // Guests don't have institution
				documentType: null,
				documentFileName: null,
				fileDataUrl: null,
				verified: true,
				referredByCode: incomingRefGuest || null,
				referralCode,
				referralLink,
				referralsCount: 0,
				createdAt: serverTimestamp(),
			});
			
			navigate('/guest-welcome');
		} catch (err) {
			console.error('Error creating guest user:', err);
			setError(err.message || 'Failed to create account');
			alert(`Error: ${err.message}`);
		} finally {
			setLoading(false);
		}
		return;
	}

	// For students on step 2, continue to step 2 for verification.
	if (step === 2 && formData.registerAs === 'student') {
		setStep(2);
		return;
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
const progressPercentage = step === 1 ? 50 : 100;
const stepText = step === 1 ? 'Step 1 of 2' : 'Step 2 of 2';
return (
	<div>
	<div className="w-full h-screen flex flex-col">
		<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
		<div className="flex flex-1 overflow-y-auto auth-split relative">
			{/* Left: Hero image (desktop) */}
					<div className="auth-hero hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden h-screen">
						{/* Centered floating image --- occupies ~70% of the hero, rounded, tilted and contained */}
						<div className="relative w-full flex items-center justify-center py-1 px-8 pt-10">
							{/* scaled up image container (~5x) with existing hover animation preserved; float animation added */}
						<div className="max-w-[250%] w-[250%] min-h-[620px] transform -rotate-3 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-700 ease-in-out hover:rotate-0 hover:scale-[1.02] float-1 relative">
							<img src={uni3} alt="Campus hero" className="w-full h-full object-cover block" />
								{/* Bottom overlay for title/description (low-opacity background, legible) */}
								<div className="absolute left-4 right-4 bottom-6 flex justify-center">
									<div className="bg-black/40 backdrop-blur-sm rounded-md px-4 py-3 text-white max-w-[90%]">
										<h3 className="text-lg md:text-2xl font-extrabold">UniSpace — Join your campus community</h3>
										<p className="text-xs md:text-sm mt-1">Find classmates, sell and buy books, and connect across campus. Professional, private, and made for students.</p>
									</div>
								</div>
							</div>
						</div>
						{/* soft overlay + decorative accents (reduced and repositioned so image doesn't touch edges) */}
						<div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/6 pointer-events-none rounded-3xl" />
						<div className="absolute -left-6 -top-6 w-32 h-32 rounded-full bg-primary/20 auth-deco float-1" />
						<div className="absolute right-10 bottom-10 w-44 h-44 rounded-full bg-[#07bc0c]/12 auth-deco float-2" />
						{/* decorative text moved into image overlay to keep the hero clean */}
					</div>

			{/* Right: Form */}
			<div className="w-full md:w-1/2 flex items-center justify-center p-6 pt-10 pb-20">
				<div className="m-auto flex w-full max-w-lg flex-col items-center rounded-xl p-6 sm:p-8 shadow-lg bg-white dark:bg-gray-800">
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
	<label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="institution">Select Institution</label>

	<div className="relative">
		<button type="button" onClick={() => setInstitutionOpen(!institutionOpen)} className="block w-full bg-background-light p-4 text-base text-slate-900 focus:border-primary focus:ring-primary dark:bg-slate-800 dark:text-white flex items-center justify-between border border-[#cfdbe7] dark:border-slate-600 rounded-lg">
			<span className={`${formData.institution ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{formData.institution || 'Search and select your institution'}</span>
			<span className="material-symbols-outlined">{institutionOpen ? 'expand_less' : 'expand_more'}</span>
		</button>

		{institutionOpen && (
			<div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-[#cfdbe7] dark:border-slate-700 rounded-lg p-3 max-h-64 overflow-auto shadow-lg">
				<div className="flex gap-3 mb-3 flex-wrap">
					<label className="inline-flex items-center gap-2 text-slate-900 dark:text-slate-300"><input type="radio" name="instCat" value="federal" checked={institutionCategory==='federal'} onChange={() => setInstitutionCategory('federal')} /> <span className="text-sm">Federal</span></label>
					<label className="inline-flex items-center gap-2 text-slate-900 dark:text-slate-300"><input type="radio" name="instCat" value="state" checked={institutionCategory==='state'} onChange={() => setInstitutionCategory('state')} /> <span className="text-sm">State</span></label>
					<label className="inline-flex items-center gap-2 text-slate-900 dark:text-slate-300"><input type="radio" name="instCat" value="private" checked={institutionCategory==='private'} onChange={() => setInstitutionCategory('private')} /> <span className="text-sm">Private</span></label>
					<label className="inline-flex items-center gap-2 ml-auto text-slate-900 dark:text-slate-300"><input type="radio" name="instCat" value="all" checked={institutionCategory==='all'} onChange={() => setInstitutionCategory('all')} /> <span className="text-sm">All</span></label>
				</div>

				<div className="mb-2">
					<input type="search" value={institutionSearch} onChange={(e) => setInstitutionSearch(e.target.value)} placeholder="Search university..." className="block w-full rounded-md border border-[#cfdbe7] dark:border-slate-600 bg-background-light dark:bg-slate-900 text-slate-900 dark:text-white p-2" />
				</div>

				<ul className="divide-y divide-slate-100 dark:divide-slate-700">
					{filteredInstitutions.length === 0 && (
						<li className="py-2 text-sm text-slate-500">No results found.</li>
					)}
					{filteredInstitutions.map(inst => (
						<li key={inst.name} className="py-2">
							<button type="button" onClick={() => selectInstitution(inst.name)} className={`w-full text-left text-sm p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${formData.institution===inst.name ? 'font-bold text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
								{inst.name}
							</button>
						</li>
					))}
				</ul>
			</div>
		)}
	</div>
</div>
)}
<button type="submit" className="flex w-full cursor-pointer
items-center justify-center rounded-lg bg-primary px-5 py-4 text-base
font-bold tracking-wide text-white hover:bg-primary/90">
Next
</button>
<p className="text-text-primary dark:text-gray-300 text-sm
text-center">
I have an account{' '}
<Link to="/login" className="text-primary font-bold underline">
Login
</Link>
</p>
</form>
</div>
)}
{/* --- Step 2: Verification or Guest Registration --- */}
{step === 2 && formData.registerAs === 'student' && (
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
<p className="text-text-primary dark:text-gray-300 text-sm
text-center">
I have an account{' '}
<Link to="/login" className="text-primary font-bold underline">
Login
</Link>
</p>
</form>
</div>
)}
{/* --- Step 2: Guest Registration --- */}
{step === 2 && formData.registerAs === 'guest' && (
<div>
<div className="mb-6 text-center">
<h1 className="text-3xl font-black text-slate-900
dark:text-white">Complete Your Guest Account</h1>
<p className="text-slate-600 dark:text-slate-300 mt-2">
You're almost done! Click below to create your guest account.
</p>
</div>
<div className="space-y-6">
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="displayName">Display Name</label>
<input className="form-input block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
placeholder:text-slate-400 focus:border-primary focus:ring-primary
dark:border-slate-600 dark:bg-slate-800 dark:text-white
dark:placeholder:text-slate-500" id="displayName" type="text"
placeholder="Enter your display name" value={formData.displayName}
onChange={handleInputChange} />
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="bio">Bio (Optional)</label>
<textarea className="form-input block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
placeholder:text-slate-400 focus:border-primary focus:ring-primary
dark:border-slate-600 dark:bg-slate-800 dark:text-white
dark:placeholder:text-slate-500" id="bio" rows="3"
placeholder="Tell us about yourself" value={formData.bio}
onChange={handleInputChange}></textarea>
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="interests">Interests (Optional)</label>
<div className="flex flex-wrap gap-2">
{['Technology', 'Business', 'Arts', 'Sports', 'Science', 'Literature'].map(interest => (
<button
key={interest}
type="button"
onClick={() => {
const newInterests = formData.interests.includes(interest)
? formData.interests.filter(i => i !== interest)
: [...formData.interests, interest];
setFormData(prev => ({ ...prev, interests: newInterests }));
}}
className={`px-3 py-2 rounded-full text-sm font-medium border ${
formData.interests.includes(interest)
? 'bg-primary text-white border-primary'
: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
}`}
>
{interest}
</button>
))}
</div>
</div>
</div>
<button onClick={handleNext} disabled={loading} className="flex w-full cursor-pointer
items-center justify-center rounded-lg bg-primary px-5 py-4 text-base
font-bold tracking-wide text-white hover:bg-primary/90 mt-6">
{loading ? 'Creating Account...' : 'Create Guest Account'}
</button>
</div>
)}
				</div>
			</div>
		</div>
		</div>
		</div>
		<Footer darkMode={darkMode} />
	</div>
	);
};
export default UniConnectRegistration;


