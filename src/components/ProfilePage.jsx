import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid));
        if (snapshot.exists()) setUserDoc(snapshot.data());
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-secondary dark:text-white">Loading profile…</p>
      </div>
    );
  }

  const avatar = userDoc?.avatarUrl || '/default_avatar.png';
  const name = userDoc?.displayName || auth.currentUser?.displayName || 'Anonymous';
  const email = auth.currentUser?.email || userDoc?.email || '';
  const bio = userDoc?.bio || '';
  const interests = userDoc?.interests || [];

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-secondary rounded-2xl shadow-md p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg mb-4" style={{backgroundImage: `url(${avatar})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
              <h1 className="text-2xl font-bold text-secondary dark:text-white">{name}</h1>
              {email && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{email}</p>}
              {bio && <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 max-w-prose">{bio}</p>}

              <div className="mt-6 w-full">
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => navigate('/edit-profile')} className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">Edit Profile</button>
                  <button onClick={() => navigate('/dashboard')} className="px-6 py-2 rounded-lg bg-background-light dark:bg-slate-700 text-secondary dark:text-white border border-slate-200 dark:border-slate-600">Dashboard</button>
                </div>
              </div>

              {interests.length > 0 && (
                <div className="mt-6 w-full">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {interests.map((i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{i}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default ProfilePage;
