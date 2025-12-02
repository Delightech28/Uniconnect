import React from 'react';
// --- Data Layer (No Backend) ---
// In a real app, you would fetch this object from an API based on a product ID.
const productData = { 
id: 'hp-elitebook-840-g5', 
category: 'Electronics', 
name: 'HP Elitebook 840 G5', 
price: 150000, 
imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3PseYjpIvW1kpMj2EDuLgyjMQZsKcdmzBMbpNJWYmvNJSUa_outUdLqEuWzje1gvbcKHwR41EBUTMZPmfS8DY97EFjqeDQq8hRU4j3uF3h_DU5Ga-KEhuedZaVaKbJl0ABq0XsUaa887gOOx2OB2jgH0qEQg8Mf9madQwg15-KHg0pljXnLwcAUu5viwBnEJaQ8Yeb1MEU2fAhEiIU4yYqm0k9PMgFrtRz7P3IEbjNXbCdm4d1l2HzFZJ-Vn9B7iCq3D_IteTI8c', 
  seller: { 
    name: 'Chioma Okafor', 
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQy3bjTCpY_7n5pBgNUx7UVtIBqAJbmYwKEbLpIB7b_ALNJQB7yf1txJ7O5Ejbn8eKU39f4XIp450TNkdl74ok1XkPNLKVg1jwD6RpDFpXy2iAOmCpHpFg_yIfg8P47w2K7sOeLDzgNZi61w1toyDmvyUlwM_u-nZSsPV0cpjpA4QUudNGcF0u0GS7VQzgYiTaFRrzCB-AUGKUsVwegSTFsjSbbQC7PxWl0G4ShrCJUsLVRpcikjgTJ7Nk8IVFgMjqCd-HOF4uM9_5', 
    details: 'Computer Science, 300L', 
  }, 
  description: { 
    short: 'Slightly used HP Elitebook 840 G5 available for sale. In perfect working condition with minimal signs of wear. Excellent for students and professionals.', 
    specs: [ 
      { label: 'Processor', value: 'Intel Core i5-8250U' }, 
      { label: 'RAM', value: '8GB DDR4' }, 
      { label: 'Storage', value: '256GB SSD' }, 
      { label: 'Display', value: '14" Full HD (1920x1080)' }, 
      { label: 'Operating System', value: 'Windows 10 Pro' }, 
    ], 
    long: 'Comes with original charger. Battery life is still great. Perfect for coding, assignments, and entertainment. Selling because I recently upgraded. Price is slightly negotiable. Meet-up on campus only.', 
  }, 
}; 

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onAuthStateChanged } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTheme } from '../hooks/useTheme';
import toast from 'react-hot-toast'; 
 
// --- Helper Components --- 
 
// A reusable header 
const AppHeader = ({ darkMode, toggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://via.placeholder.com/40');
  const navigate = useNavigate();

  // Fetch current user's avatar from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
      <header className="sticky top-0 z-20 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-700 px-4 sm:px-10 py-3 bg-white dark:bg-secondary">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-4 text-secondary dark:text-white">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path></svg>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight">UniConnect</h2>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-secondary dark:text-white hover:text-primary">Dashboard</button>
            <button onClick={() => navigate('/unimarket')} className="text-sm font-bold text-primary">Marketplace</button>
            <button onClick={() => navigate('/study-hub')} className="text-sm font-medium text-secondary dark:text-white hover:text-primary">Study Hub</button>
            <button onClick={() => navigate('/uni-wallet')} className="text-sm font-medium text-secondary dark:text-white hover:text-primary">Wallet</button>
          </nav>
        </div>
        <div className="flex flex-1 justify-end items-center gap-3 sm:gap-6">
          <button onClick={toggleDarkMode} className="flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white" aria-label="Toggle dark mode">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => navigate('/notifications')} className="flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={() => navigate('/inbox')} className="flex items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-slate-800 text-secondary dark:text-white">
            <span className="material-symbols-outlined">mail</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: `url("${userAvatar}")`}}></div>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary rounded-md shadow-lg py-1 z-10">
                <button onClick={() => navigate('/edit-profile')} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Profile</button>
                <button onClick={() => navigate('/settings')} className="block w-full text-left px-4 py-2 text-sm text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Settings</button>
              </div>
            )}
          </div>
          <div className="lg:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-secondary dark:text-white">
              <span className="material-symbols-outlined text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <nav className="lg:hidden bg-white dark:bg-secondary border-b border-slate-200 dark:border-slate-700 py-2">
          <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Dashboard</button>
          <button onClick={() => { navigate('/unimarket'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Marketplace</button>
          <button onClick={() => { navigate('/study-hub'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Study Hub</button>
          <button onClick={() => { navigate('/uni-wallet'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800">Wallet</button>
        </nav>
      )}
    </>
  );
}; 
 
// --- Main Page Component --- 
function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [product, setProduct] = useState(productData);
  const [seller, setSeller] = useState(productData.seller);
  const [loading, setLoading] = useState(!!productId);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() {
    if (productId) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, 'listings', productId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const productObj = {
              id: docSnap.id,
              name: data.productName || 'Product',
              category: data.category || 'Uncategorized',
              price: data.price || 0,
              imageUrl: data.images?.[0] || 'https://via.placeholder.com/400x300',
              description: {
                short: data.description || 'No description available',
                specs: [],
                long: ''
              }
            };
            
            // Fetch seller info
            if (data.sellerId) {
              const sellerRef = doc(db, 'users', data.sellerId);
              const sellerSnap = await getDoc(sellerRef);
              if (sellerSnap.exists()) {
                setSeller({
                  name: sellerSnap.data().displayName || 'Seller',
                  avatarUrl: sellerSnap.data().avatarUrl || 'https://via.placeholder.com/40',
                  details: 'Student'
                });
              }
            }
            
            setProduct(productObj);
          } else {
            toast.error('Product not found');
            navigate('/unimarket');
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Error loading product');
          navigate('/unimarket');
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [productId, navigate]);
 
  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary dark:text-white text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  return ( 
    <div className="bg-background-light dark:bg-background-dark 
font-display text-secondary dark:text-slate-200 min-h-screen"> 
      <div className="relative flex h-auto w-full flex-col"> 
        <AppHeader /> 
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8"> 
          <div className="flex flex-col max-w-7xl mx-auto"> 
            <div className="mb-6"> 
              <button className="flex items-center gap-2 text-sm text-slate-600 
dark:text-slate-300 hover:text-primary dark:hover:text-primary" onClick={() => navigate('/unimarket')}> 
                <span 
className="material-symbols-outlined">arrow_back</span> 
                Back to Marketplace 
              </button> 
            </div> 
 

 
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8"> 
              {/* Left Column: Product Image */} 
              <div className="lg:col-span-3"> 
                <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md overflow-hidden"> 
                  <img 
                    alt={product.name} 
                    className="w-full h-auto object-contain" 
                    src={product.imageUrl} 
                  /> 
                </div> 
              </div> 
 
              {/* Right Column: Product Info & Actions */} 
              <div className="lg:col-span-2"> 
                <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-6"> 
                  <span className="text-sm font-medium text-slate-500 
dark:text-slate-400"> 
                    {product.category} 
                  </span> 
                  <h1 className="text-3xl font-bold text-secondary 
dark:text-white mt-2"> 
                    {product.name} 
                  </h1> 
                  <p className="text-3xl font-bold text-primary mt-4"> 
                    ₦{product.price.toLocaleString()} 
                  </p> 
                   
                  <div className="mt-6 pt-6 border-t border-slate-200 
dark:border-slate-700"> 
                    <h2 className="text-lg font-semibold text-secondary 
dark:text-white">Seller Information</h2> 
                    <div className="flex items-center gap-4 mt-4"> 
                      <img 
                        alt={`${seller.name}'s profile picture`} 
 

                        className="w-12 h-12 rounded-full object-cover" 
                        src={seller.avatarUrl} 
                      /> 
                      <div> 
                        <p className="font-bold text-secondary 
dark:text-white">{seller.name}</p> 
                        <p className="text-sm text-slate-500 
dark:text-slate-400">{seller.details}</p> 
                      </div> 
                    </div> 
                  </div> 
 
                  <div className="mt-6 flex flex-col gap-4"> 
                    <button className="flex w-full items-center justify-center 
gap-2 rounded-lg h-12 px-6 bg-primary text-white text-base font-bold 
leading-normal transition-colors hover:bg-green-600"> 
                      <span 
className="material-symbols-outlined">account_balance_wallet</span
 > 
                      <span>Buy Now</span> 
                    </button> 
                    <button className="flex w-full items-center justify-center 
gap-2 rounded-lg h-12 px-6 bg-slate-200 dark:bg-slate-700 
text-secondary dark:text-white text-base font-bold leading-normal 
transition-colors hover:bg-slate-300 dark:hover:bg-slate-600"> 
                      <span 
className="material-symbols-outlined">chat</span> 
                      <span>Message Seller</span> 
                    </button> 
                  </div> 
                </div> 
              </div> 
            </div> 
 
            {/* Bottom Section: Description */} 
            <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-6 mt-8"> 
 
 
              <h2 className="text-2xl font-bold text-secondary 
dark:text-white">Description</h2> 
              {/* Using Tailwind's typography plugin for beautiful default 
styling */} 
              <div className="prose prose-slate dark:prose-invert mt-4 
max-w-none text-slate-600 dark:text-slate-300"> 
                <p>{product.description.short}</p> 
                <ul> 
                  {product.description.specs.map((spec) => ( 
                    <li key={spec.label}> 
                      <strong>{spec.label}:</strong> {spec.value} 
                    </li> 
                  ))} 
                </ul> 
                <p>{product.description.long}</p> 
              </div> 
            </div> 
          </div> 
        </main> 
      </div> 
    </div> 
  );
} 
 
export default ProductDetailsPage; 