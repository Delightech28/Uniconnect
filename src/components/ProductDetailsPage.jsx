import React, { useState, useEffect } from 'react';
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

import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import toast from 'react-hot-toast';
import useVerified from '../hooks/useVerified';

// --- Main Page Component --- 
function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const { isLoading: verifyingLoading, verified, status } = useVerified();
  const [product, setProduct] = useState(productData);
  const [seller, setSeller] = useState(productData.seller);
  const [loading, setLoading] = useState(!!productId);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, 'listings', productId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Accept either `name` or legacy `productName` field
            const productObj = {
              id: docSnap.id,
              sellerId: data.sellerId || null,
              name: data.name || data.productName || 'Product',
              category: data.category || 'Uncategorized',
              price: data.price || 0,
              imageUrl: (data.images && data.images[0]) || data.imageUrl || 'https://via.placeholder.com/400x300',
              description: (typeof data.description === 'string')
                ? { short: data.description, specs: [], long: '' }
                : {
                    short: data.description?.short || data.description || 'No description available',
                    specs: data.description?.specs || [],
                    long: data.description?.long || ''
                  }
            };
            
            // Use seller info embedded in the listing if present (saved at post time)
            const initialSeller = {
              name: data.sellerName || 'Seller',
              avatarUrl: data.sellerAvatarUrl || '/default_avatar.png',
              details: 'Student'
            };
            setSeller(initialSeller);

            // If avatar wasn't embedded but we have sellerId, try to fetch (may be blocked by rules)
            if (!data.sellerAvatarUrl && data.sellerId) {
              try {
                const sellerRef = doc(db, 'users', data.sellerId);
                const sellerSnap = await getDoc(sellerRef);
                if (sellerSnap.exists()) {
                  setSeller((prev) => ({
                    ...prev,
                    name: sellerSnap.data().displayName || prev.name,
                    avatarUrl: sellerSnap.data().avatarUrl || prev.avatarUrl,
                  }));
                }
              } catch (err) {
                if (err && err.code === 'permission-denied') {
                  console.warn('Permission denied when fetching seller profile; using embedded avatar or placeholder');
                } else {
                  console.error('Error fetching seller profile:', err);
                }
              }
            }

            setProduct(productObj);
          } else {
            toast.error('Product not found');
            navigate('/unimarket');
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error(`Error loading product: ${error.message || ''}`);
          navigate('/unimarket');
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [productId, navigate]);

  // Open or create a conversation with the seller and navigate to Inbox
  const handleMessageSeller = async () => {
    console.log('handleMessageSeller called'); // Debug
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please sign in to message the seller');
      navigate('/uniconnect-login');
      return;
    }

    // block if not verified
    if (!verifyingLoading && !verified) {
      if (status === 'failed') {
        toast.error('Your verification failed. You cannot message sellers.');
        navigate('/verification-failed');
      } else {
        toast('Complete verification to message sellers');
        navigate('/verification-pending');
      }
      return;
    }

    const buyerId = user.uid;
    const sellerId = product.sellerId;
    console.log('buyerId:', buyerId, 'sellerId:', sellerId, 'product:', product); // Debug

    if (!sellerId) {
      toast.error('Seller information unavailable');
      return;
    }

    if (buyerId === sellerId) {
      toast.error('You cannot message yourself');
      return;
    }

    try {
      console.log('Starting conversation creation flow...'); // Debug
      // Search for an existing conversation between these participants about this listing
      const convQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', buyerId));
      const convSnap = await getDocs(convQuery);
      let existingConvoId = null;

      convSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.participants && d.participants.includes(sellerId) && d.context && d.context.listingId === product.id) {
          existingConvoId = docSnap.id;
        }
      });

      if (existingConvoId) {
        console.log('Found existing conversation:', existingConvoId); // Debug
        navigate(`/inbox?convo=${existingConvoId}`);
        return;
      }

      console.log('No existing conversation, creating new one'); // Debug
      // Fetch seller's current display name and avatar from their user doc
      let sellerName = seller.name || 'Seller';
            let sellerAvatarUrl = seller.avatarUrl || '/default_avatar.png';
      console.log('Initial seller state - name:', sellerName, 'avatar:', sellerAvatarUrl); // Debug

      try {
        console.log('Fetching seller user doc for sellerId:', sellerId); // Debug
        const sellerUserDoc = await getDoc(doc(db, 'users', sellerId));
        if (sellerUserDoc.exists()) {
          const sellerData = sellerUserDoc.data();
          console.log('Seller user doc data:', sellerData); // Debug log
          // Priority: displayName > email prefix > email > fallback to 'Seller'
          const displayName = sellerData.displayName?.trim();
          const emailPrefix = sellerData.email?.split('@')[0];
          sellerName = displayName || emailPrefix || sellerData.email || sellerName;
          
          if (sellerData.avatarUrl) {
            sellerAvatarUrl = sellerData.avatarUrl;
          }
          console.log('Computed sellerName:', sellerName, 'sellerAvatarUrl:', sellerAvatarUrl); // Debug log
        } else {
          console.log('Seller user doc does not exist'); // Debug
        }
      } catch (userErr) {
        // Permission denied or other error; use fallback values
        console.warn('Could not fetch seller user info; using defaults:', userErr);
      }

      console.log('Creating conversation with sellerName:', sellerName); // Debug
      // Create a new conversation
      const convoPayload = {
        participants: [buyerId, sellerId],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastTimestamp: serverTimestamp(),
        name: sellerName,
        avatarUrl: sellerAvatarUrl,
        context: {
          type: 'listing',
          listingId: product.id,
          title: product.name,
          imageUrl: product.imageUrl,
          link: `/product-details/${product.id}`,
        },
      };

      console.log('Conversation payload:', convoPayload); // Debug
      const convRef = await addDoc(collection(db, 'conversations'), convoPayload);
      console.log('Conversation created with ID:', convRef.id); // Debug
      navigate(`/inbox?convo=${convRef.id}`);
    } catch (err) {
      console.error('Error opening conversation:', err);
      toast.error('Unable to open conversation');
    }
  };
 
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
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} /> 
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
                    className="w-full h-96 object-fill" 
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
                      <button onClick={() => {
                        if (!verifyingLoading && !verified) {
                          if (status === 'failed') {
                            toast.error('Your verification failed. You cannot buy items.');
                            navigate('/verification-failed');
                          } else {
                            toast('Complete verification to buy items');
                            navigate('/verification-pending');
                          }
                          return;
                        }
                        // TODO: integrate real checkout flow
                        toast.success('Proceeding to payment (mock)');
                      }} className="flex w-full items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal transition-colors hover:bg-green-600">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                        <span>Buy Now</span>
                      </button>
                      <button onClick={handleMessageSeller} className="flex w-full items-center justify-center gap-2 rounded-lg h-12 px-6 bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white text-base font-bold leading-normal transition-colors hover:bg-slate-300 dark:hover:bg-slate-600">
                        <span className="material-symbols-outlined">chat</span>
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