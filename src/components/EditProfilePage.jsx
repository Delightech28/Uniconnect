import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import GenderBadge from './GenderBadge';
import AvatarSelectionModal from './AvatarSelectionModal';
import { getAvatarById } from '../services/avatarService'; 
const initialProfileData = { 
displayName: '',
bio: '',
avatarUrl: 'https://via.placeholder.com/96',
interests: [],
linkedinUrl: '',
githubUrl: '',
 instagramUrl: '',
}; 
const allInterests = [ 
 
  { value: 'computer-science', label: 'Computer Science' }, 
  { value: 'ai', label: 'Artificial Intelligence' }, 
  { value: 'food', label: 'Food & Dining' }, 
  { value: 'entrepreneurship', label: 'Entrepreneurship' }, 
  { value: 'music', label: 'Music' }, 
  { value: 'fashion', label: 'Fashion & Apparel' }, 
  { value: 'sports', label: 'Sports' }, 
  { value: 'gaming', label: 'Gaming' }, 
  { value: 'books', label: 'Books & Literature' }, 
]; 
 
 
// --- Helper Components --- 
const InterestTag = ({ interest, isSelected, onToggle }) => { 
    const baseClasses = "flex items-center gap-2 cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors";
    const selectedClasses = "bg-primary text-white border-primary"; 
    const unselectedClasses = "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
 
    return ( 
        <label className={`${baseClasses} ${isSelected ? 
selectedClasses : unselectedClasses}`}> 
            <input 
                type="checkbox" 
                className="sr-only" 
                value={interest.value} 
                checked={isSelected} 

                onChange={() => onToggle(interest.value)} 
            /> 
            <span>{interest.label}</span> 
        </label> 
    ); 
}; 
 
// --- Main Page Component --- 
function EditProfilePage() { 
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState(initialProfileData);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempAvatarFile, setTempAvatarFile] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [userGender, setUserGender] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Fetch user data from Firestore on component mount
  useEffect(() => {
    // Use onAuthStateChanged to wait for auth state to be loaded
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          navigate('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserGender(data.gender || null);
          const currentAvatar = data.avatarUrl || 'https://via.placeholder.com/96';
          setCurrentAvatarUrl(currentAvatar);
          setProfileData(prev => ({
            ...prev,
            displayName: data.displayName || '',
            bio: data.bio || '',
            interests: data.interests || [],
            avatarUrl: currentAvatar,
            linkedinUrl: data.linkedinUrl || '',
            githubUrl: data.githubUrl || '',
            instagramUrl: data.instagramUrl || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate]);
 
  const handleInputChange = (e) => { 
    const { name, value } = e.target; 
    setProfileData(prevData => ({ ...prevData, [name]: value })); 
  }; 
   
  const handleInterestToggle = (interestValue) => { 
    setProfileData(prevData => { 
        const interests = prevData.interests.includes(interestValue)
          ? prevData.interests.filter(i => i !== interestValue) // Remove interest
          : [...prevData.interests, interestValue]; // Add interest
        return { ...prevData, interests }; 
    }); 
  }; 
 
  const handleFileChange = (e) => { 
    const file = e.target.files[0]; 
    if (file) { 
      // Validate file size (max 2MB for Firestore)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setTempAvatar(previewUrl);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempAvatarFile(event.target.result); // Store base64 string
      };
      reader.readAsDataURL(file);
    } 
  }; 
 
  const handleRemoveAvatar = () => { 
    setTempAvatar(null);
    setTempAvatarFile(null);
    setProfileData(prevData => ({ ...prevData, avatarUrl: '' })); 
  };

  const handleAvatarSelect = (avatarId) => {
    if (!userGender) {
      toast.error('Gender information not found');
      return;
    }
    const avatarImage = getAvatarById(avatarId, userGender);
    setTempAvatar(avatarImage);
    setProfileData(prevData => ({ ...prevData, avatarUrl: avatarImage }));
    setTempAvatarFile(null); // Clear file input when selecting predefined avatar
    setShowAvatarModal(false);
    toast.success('Avatar selected!');
  }; 
 
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setSaveLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        toast.error('User not authenticated');
        return;
      }

      // Prepare data to save
      const dataToSave = {
        displayName: profileData.displayName,
        bio: profileData.bio,
        interests: profileData.interests,
        linkedinUrl: profileData.linkedinUrl,
        githubUrl: profileData.githubUrl,
        instagramUrl: profileData.instagramUrl,
        updatedAt: serverTimestamp()
      };

      // If new avatar was selected, save it
      if (tempAvatarFile) {
        toast.loading('Saving profile...', { id: 'avatar-save' });
        // tempAvatarFile is already a base64 string from FileReader
        dataToSave.avatarUrl = tempAvatarFile;
        toast.dismiss('avatar-save');
      } else if (profileData.avatarUrl && profileData.avatarUrl !== currentAvatarUrl) {
        // Avatar was changed via modal selection (compare with current avatar, not default)
        dataToSave.avatarUrl = profileData.avatarUrl;
      }

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', user.uid), dataToSave);
      
      toast.success('Profile updated successfully!', {
        duration: 4000,
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#000000',
          border: `2px solid #07bc0c`,
        },
      });
      setTempAvatar(null);
      setTempAvatarFile(null);
      // Redirect to dashboard after successful save
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = 'Failed to save profile. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#000000',
          border: '2px solid #ef4444',
        },
      });
    } finally {
      setSaveLoading(false);
    }
  }; 
   
  const handleCancel = () => { 
    setProfileData(initialProfileData); 
    setTempAvatar(null); 
  }; 
   
  const displayAvatar = tempAvatar || profileData.avatarUrl; 
 
  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary dark:text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return ( 
    <div className="bg-background-light dark:bg-background-dark 
font-display min-h-screen flex flex-col"> 
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => toggleTheme()}
          className="flex items-center justify-center size-12 rounded-full bg-white dark:bg-gray-800 shadow-md text-slate-700 dark:text-slate-200"
          aria-label="Toggle dark mode"
        >
          <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
      <main className="flex-1 py-10"> 
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"> 
          <div className="mb-8"> 
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary 
dark:text-white">Edit Profile</h1> 
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Update 
your profile information.</p> 
          </div> 
          <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-6 sm:p-8"> 
            <form className="space-y-8" onSubmit={handleSubmit}> 
 
              {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300">
                  {error}
                </div>
              )} 
              <div> 
                <label className="block text-sm font-medium text-slate-700 
dark:text-slate-300 mb-2">Profile Picture</label> 
                <div className="flex flex-col sm:flex-row items-start 
sm:items-center gap-6"> 
                  <div className="relative"> 
                    <div 
                      className="bg-center bg-no-repeat aspect-square 
bg-cover rounded-full size-24 border-2 border-slate-200 
dark:border-slate-700" 
                      style={{ backgroundImage: `url(${displayAvatar || 
'https://via.placeholder.com/96'})` }} // Fallback image 
                    ></div> 
                  </div> 
                  <div className="flex items-center gap-3"> 
                    <label htmlFor="file-upload" className="cursor-pointer flex 
items-center justify-center gap-2 px-4 py-2 text-sm font-semibold 
rounded-lg bg-primary text-white hover:bg-primary/90"> 
                      <span className="material-symbols-outlined 
text-base">upload</span> 
                      <span>Upload New</span> 
                    </label> 
                    <button 
                      type="button" 
                      onClick={() => setShowAvatarModal(true)}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600"
                      disabled={!userGender}
                    >
                      <span className="material-symbols-outlined inline-block mr-1 text-base">palette</span>
                      Use Avatar
                    </button>
                    <input id="file-upload" name="file-upload" type="file" 
className="sr-only" onChange={handleFileChange} 
accept="image/*"/> 
                    <button type="button" onClick={handleRemoveAvatar} 
className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 
dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 
dark:hover:bg-slate-600"> 
                      Remove 
                    </button> 
                  </div> 
                </div> 
              </div> 
 
              {/* Display Name */} 
 

              <div> 
                <label htmlFor="display-name" className="block text-sm 
font-medium text-slate-700 dark:text-slate-300">Display Name</label> 
                <input 
                  type="text" 
                  name="displayName" 
                  id="display-name" 
                  value={profileData.displayName} 
                  onChange={handleInputChange} 
                  className="mt-1 block w-full rounded-lg border-slate-300 
dark:border-slate-600 bg-background-light dark:bg-slate-800 
text-secondary dark:text-white focus:border-primary focus:ring-primary 
shadow-sm sm:text-sm" 
                /> 
                <p className="mt-2 text-xs text-slate-500 
dark:text-slate-400">Your display name can only be changed once every 
30 days.</p> 
              </div> 
 
              {/* Bio */} 
              <div> 
                <label htmlFor="bio" className="block text-sm font-medium 
text-slate-700 dark:text-slate-300">Bio</label> 
                <textarea 
                  name="bio" 
                  id="bio" 
                  rows="4" 
                  value={profileData.bio} 
                  onChange={handleInputChange} 
                  className="mt-1 block w-full rounded-lg border-slate-300 
dark:border-slate-600 bg-background-light dark:bg-slate-800 
text-secondary dark:text-white focus:border-primary focus:ring-primary 
shadow-sm sm:text-sm" 
                ></textarea> 
                <p className="mt-2 text-xs text-slate-500 
dark:text-slate-400">Write a short introduction about yourself.</p> 
              </div>

              {/* LinkedIn URL */}
              <div>
                <label htmlFor="linkedin-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  id="linkedin-url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profileData.linkedinUrl}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-background-light dark:bg-slate-800 text-secondary dark:text-white focus:border-primary focus:ring-primary shadow-sm sm:text-sm"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Optional: Add your LinkedIn profile URL</p>
              </div>

              {/* GitHub URL */}
              <div>
                <label htmlFor="github-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">GitHub Profile</label>
                <input
                  type="url"
                  name="githubUrl"
                  id="github-url"
                  placeholder="https://github.com/yourprofile"
                  value={profileData.githubUrl}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-background-light dark:bg-slate-800 text-secondary dark:text-white focus:border-primary focus:ring-primary shadow-sm sm:text-sm"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Optional: Add your GitHub profile URL</p>
              </div>

              {/* Instagram URL */}
              <div>
                <label htmlFor="instagram-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Instagram Profile</label>
                <input
                  type="url"
                  name="instagramUrl"
                  id="instagram-url"
                  placeholder="https://instagram.com/yourprofile"
                  value={profileData.instagramUrl}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-background-light dark:bg-slate-800 text-secondary dark:text-white focus:border-primary focus:ring-primary shadow-sm sm:text-sm"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Optional: Add your Instagram profile URL</p>
              </div>
 
              {/* Interests */} 
              <div> 
                <label className="block text-sm font-medium text-slate-700 
dark:text-slate-300">My Interests</label> 
                <p className="mt-1 text-xs text-slate-500 
dark:text-slate-400">Select your interests to get personalized content 
and recommendations.</p> 
                <div className="mt-4 flex flex-wrap gap-3"> 
                    {allInterests.map(interest => ( 
                        <InterestTag  
                            key={interest.value} 
                            interest={interest} 
                            
isSelected={profileData.interests.includes(interest.value)} 
                            onToggle={handleInterestToggle} 
                        /> 
                    ))} 
                </div> 
              </div> 
 
              {/* Form Actions */} 
              <div className="border-t border-slate-200 
dark:border-slate-700 pt-6 flex justify-end gap-4"> 
                <button type="button" onClick={handleCancel} disabled={saveLoading}
className="px-6 py-2 text-sm font-semibold rounded-lg bg-slate-200 
dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 
dark:hover:bg-slate-600 disabled:opacity-50"> 
                  Cancel 
                </button> 
                <button type="submit" disabled={saveLoading} className="px-6 py-2 text-sm 
font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"> 
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button> 
              </div> 
            </form> 
          </div> 
 
 
        </div> 
      </main>
      <AvatarSelectionModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelectAvatar={handleAvatarSelect}
        gender={userGender}
      />
      <Footer darkMode={darkMode} />
    </div> 
  ); 
} 
export default EditProfilePage; 


