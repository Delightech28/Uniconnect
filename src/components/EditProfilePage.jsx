import React, { useState } from 'react';
// --- Data Layer (No Backend) --- 
// In a real app, this data would be fetched from an API. 
const initialProfileData = { 
displayName: 'Adekunle Adebayo',
bio: 'Computer Science student at UNILAG. Passionate about AI and building cool things. Coffee enthusiast and part-time foodie.',
avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI',
interests: ['computer-science', 'ai', 'food'], 
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
const AppHeader = () => ( 
    <header className="flex items-center justify-between 
whitespace-nowrap border-b border-solid border-slate-200 
dark:border-slate-700 px-4 sm:px-10 py-3 bg-white dark:bg-secondary"> 
        {/* Header content from HTML */} 
    </header> 
); 
 
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
  const [profileData, setProfileData] = useState(initialProfileData);
  const [tempAvatar, setTempAvatar] = useState(null); // For previewing new image
 
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
      setTempAvatar(URL.createObjectURL(file)); 
    } 
  }; 
 
  const handleRemoveAvatar = () => { 
 

    setTempAvatar(null); // Clear preview

    setProfileData(prevData => ({ ...prevData, avatarUrl: '' })); // Clear actual avatar data
  }; 
 
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    // In a real app, you would send this data to a server. 
    // We'll merge the temp avatar if it exists. 
    const finalData = { 
        ...profileData, 
        avatarUrl: tempAvatar || profileData.avatarUrl, 
    }; 
    alert("Profile Saved!\n" + JSON.stringify(finalData, null, 2)); 
  }; 
   
  const handleCancel = () => { 
    setProfileData(initialProfileData); 
    setTempAvatar(null); 
  }; 
   
  const displayAvatar = tempAvatar || profileData.avatarUrl; 
 
  return ( 
    <div className="bg-background-light dark:bg-background-dark 
font-display min-h-screen"> 
      {/* <AppHeader /> */} 
      <main className="py-10"> 
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"> 
          <div className="mb-8"> 
            <h1 className="text-3xl font-bold text-secondary 
dark:text-white">Edit Profile</h1> 
            <p className="text-slate-500 dark:text-slate-400 mt-1">Update 
your profile information.</p> 
          </div> 
          <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-6 sm:p-8"> 
            <form className="space-y-8" onSubmit={handleSubmit}> 
 

              {/* Profile Picture Section */} 
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
                <button type="button" onClick={handleCancel} 
className="px-6 py-2 text-sm font-semibold rounded-lg bg-slate-200 
dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 
dark:hover:bg-slate-600"> 
                  Cancel 
                </button> 
                <button type="submit" className="px-6 py-2 text-sm 
font-semibold rounded-lg bg-primary text-white hover:bg-primary/90"> 
                  Save Changes 
                </button> 
              </div> 
            </form> 
          </div> 
 
 
</div> 
</main> 
</div> 
); 
} 
export default EditProfilePage; 