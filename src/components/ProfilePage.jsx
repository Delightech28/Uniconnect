import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { ExternalLink } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // For viewing other users' profiles
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        // If userId param exists, fetch that user's profile (public view)
        if (userId && userId !== user?.uid) {
          const snapshot = await getDoc(doc(db, 'users', userId));
          if (snapshot.exists()) {
            setUserDoc(snapshot.data());
            setIsOwnProfile(false);
          }
          setLoading(false);
          return;
        }

        // Otherwise, fetch current user's profile
        if (!user) {
          navigate('/login');
          return;
        }

        const snapshot = await getDoc(doc(db, 'users', user.uid));
        if (snapshot.exists()) setUserDoc(snapshot.data());
        setIsOwnProfile(true);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-secondary dark:text-white">Loading profile…</p>
      </div>
    );
  }

  const avatar = userDoc?.avatarUrl || '/default_avatar.png';
  const name = userDoc?.displayName || auth.currentUser?.displayName || 'Anonymous';
  const email = isOwnProfile ? (auth.currentUser?.email || userDoc?.email || '') : '';
  const bio = userDoc?.bio || '';
  const interests = userDoc?.interests || [];
  const linkedinUrl = userDoc?.linkedinUrl || '';
  const githubUrl = userDoc?.githubUrl || '';

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

              {(linkedinUrl || githubUrl) && (
                <div className="mt-6 flex gap-3 justify-center">
                  {linkedinUrl && (
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
                      LinkedIn
                    </a>
                  )}
                  {githubUrl && (
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                    </a>
                  )}
                </div>
              )}

              <div className="mt-6 w-full">
                <div className="flex items-center justify-center gap-3">
                  {isOwnProfile && (
                    <>
                      <button onClick={() => navigate('/edit-profile')} className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">Edit Profile</button>
                      <button onClick={() => navigate('/dashboard')} className="px-6 py-2 rounded-lg bg-background-light dark:bg-slate-700 text-secondary dark:text-white border border-slate-200 dark:border-slate-600">Dashboard</button>
                    </>
                  )}
                  {!isOwnProfile && (
                    <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-lg bg-background-light dark:bg-slate-700 text-secondary dark:text-white border border-slate-200 dark:border-slate-600">Go Back</button>
                  )}
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
