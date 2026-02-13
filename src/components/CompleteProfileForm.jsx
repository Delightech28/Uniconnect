/**
 * CompleteProfileForm.jsx
 * 
 * Shown after Gmail sign-up/sign-in when user is missing required profile fields.
 * Collects: gender, institution, registerAs (student/guest), and bio
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import toast from 'react-hot-toast';

// University data
const universityData = {
  federal: [
    'Abubakar Tafawa Balewa University, Bauchi',
    'Adeyemi Federal University of Education, Ondo',
    'Ahmadu Bello University, Zaria',
    'Bayero University, Kano',
    'Federal University of Agriculture, Abeokuta',
    'Federal University of Technology, Akure',
    'Federal University of Technology, Minna',
    'Federal University of Technology, Owerri',
    'Obafemi Awolowo University, Ile-Ife',
    'University of Benin, Benin City',
    'University of Ibadan',
    'University of Ilorin',
    'University of Jos',
    'University of Lagos',
    'University of Nigeria, Nsukka',
    'University of Port Harcourt',
  ],
  state: [
    'Abia State University, Uturu',
    'Adamawa State University, Mubi',
    'Akwa Ibom State University, Uyo',
    'Anambra State University, Uli',
    'Bauchi State University, Gadau',
    'Benue State University, Makurdi',
    'Cross River University of Technology, Calabar',
    'Delta State University, Abraka',
    'Ekiti State University, Ado-Ekiti',
    'Enugu State University of Science and Technology',
    'Imo State University, Owerri',
    'Kaduna State University',
    'Kano State University of Science and Technology',
    'Katsina State University, Katsina',
    'Kebbi State University of Science and Technology',
    'Kogi State University, Anyigba',
    'Kwara State University, Malete',
    'Lagos State University, Ojo',
    'Nasarawa State University, Keffi',
    'Niger State University of Science and Technology, Zungeru',
    'Ogun State University, Ago-Iwoye',
    'Ondo State University of Science and Technology, Ondo',
    'Osun State University, Osogbo',
    'Oyo State College of Education, Oyo',
    'Plateau State University, Bokkos',
    'Rivers State University, Port Harcourt',
    'Taraba State University, Jalingo',
    'Yobe State University, Damaturu',
    'Zamfara State University, Gusau',
  ],
  private: [
    'Afe Babalola University, Ado-Ekiti',
    'American University of Nigeria, Yola',
    'Babcock University, Ilishan-Remo',
    'Benson Idahosa University, Benin City',
    'Bowen University, Iwo',
    'Covenant University, Ota',
    'Crescent University, Abeokuta',
    'Fountainhead College, Ibadan',
    'Hallmark University, Ijebu-Itele',
    'Landmark University, Omu-Aran',
    'Lead City University, Ibadan',
    'Loyola Jesuit College, Abuja',
    'Maranatha University, Ogun State',
    'Nexford University, Lagos',
    'Pan-Atlantic University, Lagos',
    'Redeemer\'s University, Ede',
    'Regent University, Lagos',
    'Ritman University, Omu-Aran',
    'Salem University, Lokoja',
    'Southwestern University, Ogun State',
    'The American University of Nigeria, Yola',
    'Unicaf University, Lagos',
    'University of Jos, Jos',
    'Veritas University, Abuja',
    'Wellspring University, Benin City',
    'Westland University, Ijebu-Ode',
  ],
};

const CompleteProfileForm = ({ userId, onComplete }) => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gender: '',
    institution: '',
    registerAs: 'student',
    bio: '',
  });
  const [step, setStep] = useState(1); // Step 1: Gender & RegisterAs, Step 2: Institution, Step 3: Bio
  const [universityCategory, setUniversityCategory] = useState('federal');
  const [filteredUniversities, setFilteredUniversities] = useState(universityData.federal);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFilteredUniversities(
      universityData[universityCategory].filter((uni) =>
        uni.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [universityCategory, searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category) => {
    setUniversityCategory(category);
    setSearchTerm('');
    setFilteredUniversities(universityData[category]);
  };

  const handleUniversitySelect = (uni) => {
    setFormData((prev) => ({ ...prev, institution: uni }));
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.gender) {
        toast.error('Please select a gender');
        setLoading(false);
        return;
      }
      if (!formData.institution) {
        toast.error('Please select a university');
        setLoading(false);
        return;
      }

      // Update user document with additional profile info
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const currentUser = auth.currentUser;

      if (userDoc.exists()) {
        // User already exists, just update fields
        await updateDoc(userRef, {
          gender: formData.gender,
          institution: formData.institution,
          registerAs: formData.registerAs,
          bio: formData.bio || '',
          updatedAt: serverTimestamp(),
        });
      } else {
        // New user (registered with Gmail), create full document
        await setDoc(userRef, {
          email: currentUser?.email || '',
          displayName: currentUser?.displayName || '',
          avatarUrl: currentUser?.photoURL || null,
          username: currentUser?.email?.split('@')[0] || '',
          gender: formData.gender,
          institution: formData.institution,
          registerAs: formData.registerAs,
          bio: formData.bio || '',
          verified: false,
          referralCode: userId.slice(0, 8),
          referralLink: `${window.location.origin}/?ref=${userId.slice(0, 8)}`,
          referralsCount: 0,
          createdAt: serverTimestamp(),
        });
      }

      toast.success('Profile completed!');
      setLoading(false);

      // Call the completion callback or navigate
      if (onComplete) {
        onComplete(formData);
      } else {
        navigate(formData.registerAs === 'student' ? '/verification-pending' : '/dashboard');
      }
    } catch (err) {
      console.error('Error completing profile:', err);
      toast.error('Failed to complete profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={`w-full min-h-screen flex flex-col bg-background-light dark:bg-background-dark ${darkMode ? 'text-white' : 'text-text-primary-light'}`}>
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Complete Your Profile
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Just a few more details to get started
            </p>
            <div className="flex justify-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s === step ? 'bg-primary w-8' : s < step ? 'bg-primary w-2' : 'bg-gray-300 dark:bg-gray-600 w-2'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-secondary rounded-lg shadow-md p-6">
            {/* Step 1: Gender & RegisterAs */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, gender: g.toLowerCase() }))}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          formData.gender === g.toLowerCase()
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                    Register As
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'student', label: 'Student', description: 'Get verified student badge' },
                      { value: 'guest', label: 'Guest', description: 'Browse as visitor' },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <input
                          type="radio"
                          name="registerAs"
                          value={opt.value}
                          checked={formData.registerAs === opt.value}
                          onChange={handleChange}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{opt.label}</p>
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{opt.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.gender}
                  className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: University Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                    University Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['federal', 'state', 'private'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`py-2 px-2 rounded text-sm font-medium transition-all ${
                          universityCategory === cat
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-300'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Search university..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-border-light dark:border-border-dark">
                  {filteredUniversities.length > 0 ? (
                    filteredUniversities.map((uni) => (
                      <button
                        key={uni}
                        type="button"
                        onClick={() => handleUniversitySelect(uni)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors border-b border-border-light dark:border-border-dark last:border-b-0 ${
                          formData.institution === uni ? 'bg-primary/10 font-semibold' : ''
                        }`}
                      >
                        {uni}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      No universities found
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Bio */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                    Selected University
                  </label>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-text-primary-light dark:text-text-primary-dark font-medium">
                    {formData.institution || 'Not selected'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                    Bio (Optional)
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself... (max 160 characters)"
                    maxLength={160}
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                  />
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    {formData.bio.length}/160
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.institution}
                    className="flex-1 py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Completing...' : 'Complete Profile'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark mt-6">
            You can update your profile anytime in settings.
          </p>
        </div>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default CompleteProfileForm;
