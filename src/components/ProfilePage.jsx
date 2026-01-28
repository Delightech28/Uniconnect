import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import GenderBadge from './GenderBadge';
import { ExternalLink, MessageSquare, Heart, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDefaultAvatar } from '../services/avatarService';
import {
  toggleFollow,
  checkIsFollowing,
  calculateBadges,
  getUserStats,
  getUserPosts,
  getUserSoldItems,
  getFollowers,
  getFollowing,
  toggleUserLike,
  checkUserLike,
  canViewProfile,
  canInteract,
  getPrivacySettings,
  sendConnectionRequest,
  checkIsConnected,
  acceptConnectionRequest,
  rejectConnectionRequest,
  checkPendingRequest,
  getPendingRequests,
  getConnections,
} from '../services/profileService';
import { getProfileStats } from '../services/profileStatsService';
import { notifyUserLiked } from '../services/notificationService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hasReceivedRequest, setHasReceivedRequest] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [connections, setConnections] = useState([]);
  const [showConnections, setShowConnections] = useState(false);
  const [privacySettings, setPrivacySettings] = useState(null);
  const [canView, setCanView] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);

        // If userId param exists, fetch that user's profile (public view)
        if (userId && userId !== user?.uid) {
          // Check if viewing user can see this profile
          const canViewProfile_ = user 
            ? await canViewProfile(user.uid, userId)
            : await canViewProfile('guest', userId);

          if (!canViewProfile_) {
            setCanView(false);
            setLoading(false);
            return;
          }

          const snapshot = await getDoc(doc(db, 'users', userId));
          if (snapshot.exists()) {
            setUserDoc(snapshot.data());
            setIsOwnProfile(false);

            // Load profile data
            const userBadges = await calculateBadges(userId);
            setBadges(userBadges);

            const userStats = await getUserStats(userId);
            setStats(userStats);

            const userPosts = await getUserPosts(userId, 5);
            setPosts(userPosts);
            // Also compute total posts count from Firestore each time the profile loads
            try {
              const postsQ = query(collection(db, 'posts'), where('authorId', '==', userId));
              const postsSnap = await getDocs(postsQ);
              const totalPosts = postsSnap.size;
              setStats(prev => ({ ...(prev || {}), postsCreated: totalPosts }));
            } catch (err) {
              console.warn('Failed to count posts for profile:', err);
            }

            // Fetch computed stats (itemsSold, reviews, sellerRating, followers) from service
            try {
              const computed = await getProfileStats(userId);
              setStats(prev => ({ ...(prev || {}), ...computed }));
            } catch (err) {
              console.warn('Failed to fetch computed profile stats:', err);
            }

            // Compute connections count from subcollection or legacy array
            try {
              const connSnap = await getDocs(collection(db, 'users', userId, 'connections'));
              if (connSnap && connSnap.size >= 0) {
                setStats(prev => ({ ...(prev || {}), connectionsCount: connSnap.size }));
              }
            } catch (err) {
              // fallback to legacy array length if available
              try {
                const uDoc = await getDoc(doc(db, 'users', userId));
                const legacy = uDoc.exists() ? (uDoc.data().connections || []) : [];
                setStats(prev => ({ ...(prev || {}), connectionsCount: legacy.length }));
              } catch (e) {
                console.warn('Failed to compute connections count:', e);
              }
            }

            const userSoldItems = await getUserSoldItems(userId, 5);
            setSoldItems(userSoldItems);

            const userConnections = await getConnections(userId);
            setConnections(userConnections);

            const settings = await getPrivacySettings(userId);
            setPrivacySettings(settings);

            // Check connection status if logged in
            if (user) {
              const connected = await checkIsConnected(user.uid, userId);
              setIsConnected(connected);

              const hasPending = await checkPendingRequest(user.uid, userId);
              setHasPendingRequest(hasPending);

              const liked = await checkUserLike(user.uid, userId);
              setIsLiked(liked);
            }
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
        if (snapshot.exists()) {
          setUserDoc(snapshot.data());
          setIsOwnProfile(true);

          // Load own profile data
          const userBadges = await calculateBadges(user.uid);
          setBadges(userBadges);

          const userStats = await getUserStats(user.uid);
          setStats(userStats);

          const userPosts = await getUserPosts(user.uid, 5);
          setPosts(userPosts);
            // Also compute total posts count for the current user
          try {
            const postsQ = query(collection(db, 'posts'), where('authorId', '==', user.uid));
            const postsSnap = await getDocs(postsQ);
            const totalPosts = postsSnap.size;
            setStats(prev => ({ ...(prev || {}), postsCreated: totalPosts }));
          } catch (err) {
            console.warn('Failed to count posts for current user:', err);
          }

          // Fetch computed stats and connections count for current user
          try {
            const computed = await getProfileStats(user.uid);
            setStats(prev => ({ ...(prev || {}), ...computed }));
          } catch (err) {
            console.warn('Failed to fetch computed profile stats for current user:', err);
          }
          try {
            const connSnap = await getDocs(collection(db, 'users', user.uid, 'connections'));
            if (connSnap && connSnap.size >= 0) {
              setStats(prev => ({ ...(prev || {}), connectionsCount: connSnap.size }));
            }
          } catch (err) {
            try {
              const uDoc = await getDoc(doc(db, 'users', user.uid));
              const legacy = uDoc.exists() ? (uDoc.data().connections || []) : [];
              setStats(prev => ({ ...(prev || {}), connectionsCount: legacy.length }));
            } catch (e) {
              console.warn('Failed to compute connections count for current user:', e);
            }
          }

          const userConnections = await getConnections(user.uid);
          setConnections(userConnections);

          // Load pending connection requests for this user
          const pendingRequests = await getPendingRequests(user.uid);
          setHasReceivedRequest(pendingRequests.length > 0);

          const settings = await getPrivacySettings(user.uid);
          setPrivacySettings(settings);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [userId, navigate]);

  // Real-time listener for user stats to keep data updated
  useEffect(() => {
    if (!userId && !currentUser) return;

    const targetUserId = userId || currentUser?.uid;
    if (!targetUserId) return;

    const userRef = doc(db, 'users', targetUserId);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const derived = {
          itemsSold: data.itemsSold || 0,
          itemsListed: data.itemsListed || 0,
          sellerRating: data.sellerRating || 0,
          reviews: data.reviews || 0,
          postsCreated: data.postsCreated || 0,
          followerCount: data.followerCount || 0,
          followingCount: data.followingCount || 0,
          joinDate: data.createdAt || data.joinDate || null,
        };

        setStats(derived);

        // If the user doc doesn't have precomputed stats, compute from collections as a fallback
        const needsFallback = (derived.postsCreated === 0 && derived.itemsSold === 0 && derived.reviews === 0);
        if (needsFallback) {
          try {
            const computed = await getProfileStats(targetUserId);
            // Merge computed stats (prefer computed non-zero values)
            setStats(prev => ({ ...derived, ...Object.fromEntries(Object.entries(computed).map(([k,v]) => [k, v ?? prev[k]])) }));
          } catch (err) {
            console.warn('Fallback getProfileStats failed', err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [userId, currentUser?.uid]);

  const handleSendConnectionRequest = async () => {
    if (!currentUser) {
      toast.error('Please log in to connect');
      return;
    }

    setConnectLoading(true);
    try {
      const result = await sendConnectionRequest(currentUser.uid, userId);
      if (result === 'sent') {
        setHasPendingRequest(true);
        toast.success('Connection request sent!');
      } else if (result === 'already_connected') {
        toast.info('You are already connected');
      } else if (result === 'already_pending') {
        toast.info('Connection request already pending');
      }
    } catch (err) {
      console.error('Connection request error:', err);
      toast.error('Error sending connection request: ' + (err.message || err));
    } finally {
      setConnectLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!currentUser) {
      toast.error('Please log in');
      return;
    }

    setConnectLoading(true);
    try {
      await acceptConnectionRequest(currentUser.uid, userId);
      setIsConnected(true);
      setHasReceivedRequest(false);
      const updatedConnections = await getConnections(currentUser.uid);
      setConnections(updatedConnections);
      toast.success('Connection accepted!');
    } catch (err) {
      toast.error('Error accepting connection');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!currentUser) {
      toast.error('Please log in');
      return;
    }

    setConnectLoading(true);
    try {
      await rejectConnectionRequest(currentUser.uid, userId);
      setHasReceivedRequest(false);
      toast.success('Connection request rejected');
    } catch (err) {
      toast.error('Error rejecting connection');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      toast.error('Please log in to like');
      return;
    }

    setLikeLoading(true);
    try {
      const newLiked = await toggleUserLike(currentUser.uid, userId);
      setIsLiked(newLiked);
      
      if (newLiked) {
        toast.success('Profile liked!');
        // Send notification
        try {
          await notifyUserLiked(userId, {
            likerId: currentUser.uid,
            likerName: currentUser.displayName || 'Someone',
            likerAvatar: userDoc?.avatarUrl || '/default_avatar.png',
          });
        } catch (err) {
          console.warn('Failed to send like notification:', err);
        }
      } else {
        toast.success('Profile unliked');
      }
    } catch (err) {
      console.error('Like toggle error:', err);
      toast.error('Error updating like status: ' + (err.message || err));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      toast.error('Please log in to message');
      return;
    }

    const canMsg = await canInteract(currentUser.uid, userId, 'message');
    if (!canMsg) {
      toast.error('This user is not accepting messages');
      return;
    }

    navigate(`/inbox?recipientId=${userId}`);
  };

  const avatar = userDoc?.avatarUrl || getDefaultAvatar(userDoc?.gender || 'male');
  const name = userDoc?.displayName || 'Anonymous';
  const email = isOwnProfile ? (currentUser?.email || userDoc?.email || '') : '';
  const bio = userDoc?.bio || '';
  const interests = userDoc?.interests || [];
  const linkedinUrl = userDoc?.linkedinUrl || '';
  const githubUrl = userDoc?.githubUrl || '';
  const instagramUrl = userDoc?.instagramUrl || '';

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <div className="bg-white dark:bg-secondary rounded-2xl shadow-md p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center md:items-start md:w-1/3">
                <div
                  className="w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg mb-4"
                  style={{
                    backgroundImage: `url(${avatar})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <h1 className="text-3xl font-bold text-secondary dark:text-white">
                  {name}
                  {userDoc?.gender && (
                    <GenderBadge gender={userDoc.gender} size="lg" className="ml-2" />
                  )}
                </h1>
                {email && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {email}
                  </p>
                )}
                {userDoc?.verificationStatus === 'verified' && (
                  <span className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">
                    ✓ Verified Student
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex-1">
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats?.connectionsCount ?? connections.length ?? 0}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Connections
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.itemsSold}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Items Sold
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.postsCreated}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Posts
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {typeof stats.sellerRating === 'number' ? stats.sellerRating.toFixed(1) : Number(stats.sellerRating || 0).toFixed(1)}⭐
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Seller Rating
                      </p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {stats.reviews}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Reviews
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {bio && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-slate-700 dark:text-slate-300">{bio}</p>
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-300 dark:border-yellow-700"
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                        {badge.name}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {(linkedinUrl || githubUrl || instagramUrl) && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-3 flex-wrap">
                  {linkedinUrl && (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7.25a4.75 4.75 0 110 9.5 4.75 4.75 0 010-9.5zm0 1.5a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5zM17.5 6.25a.75.75 0 110 1.5.75.75 0 010-1.5z" />
                      </svg>
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => navigate('/edit-profile')}
                      className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Dashboard
                    </button>
                  </>
                ) : (
                  <>
                    {isConnected ? (
                      <button
                        disabled
                        className="px-6 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold flex items-center gap-2"
                      >
                        <Users className="w-5 h-5" />
                        Connected ✓
                      </button>
                    ) : hasReceivedRequest ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleAcceptConnection}
                          disabled={connectLoading}
                          className="px-6 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <Users className="w-5 h-5" />
                          Accept
                        </button>
                        <button
                          onClick={handleRejectConnection}
                          disabled={connectLoading}
                          className="px-6 py-2 rounded-lg bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-white font-semibold hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    ) : hasPendingRequest ? (
                      <button
                        disabled
                        className="px-6 py-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold flex items-center gap-2"
                      >
                        <Users className="w-5 h-5" />
                        Request Pending
                      </button>
                    ) : (
                      <button
                        onClick={handleSendConnectionRequest}
                        disabled={connectLoading}
                        className="px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Users className="w-5 h-5" />
                        Connect
                      </button>
                    )}
                    <button
                      onClick={handleMessage}
                      className="px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Message
                    </button>
                    <button
                      onClick={handleToggleLike}
                      disabled={likeLoading}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        isLiked
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-secondary dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                      } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      {isLiked ? 'Liked' : 'Like'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Connections Modal */}
          {showConnections && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-secondary rounded-2xl max-w-md w-full max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-secondary p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-secondary dark:text-white">
                    Connections ({connections.length})
                  </h3>
                  <button
                    onClick={() => setShowConnections(false)}
                    className="text-xl text-slate-500 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {connections.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center">
                      No connections yet
                    </p>
                  ) : (
                    connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          navigate(`/profile/${connection.id}`);
                          setShowConnections(false);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            alt={connection.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                            src={connection.avatarUrl || getDefaultAvatar(connection.gender || 'male')}
                          />
                          <div>
                            <p className="font-semibold text-secondary dark:text-white">
                              {connection.displayName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {connection.email}
                            </p>
                          </div>
                        </div>
                        <GenderBadge gender={connection.gender} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connections Button */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setShowConnections(true)}
              className="px-6 py-2 rounded-lg bg-white dark:bg-secondary text-secondary dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              {connections.length} Connections
            </button>
          </div>

          {/* Posts Section */}
          {posts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-secondary dark:text-white mb-4">
                Recent Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/campusfeed#post-${post.id}`)}
                    className="bg-white dark:bg-secondary rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <h3 className="font-bold text-secondary dark:text-white mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sold Items Section */}
          {soldItems.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-secondary dark:text-white mb-4">
                Sold Items
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {soldItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-secondary rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <h3 className="font-bold text-secondary dark:text-white mb-2">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-primary mb-2">
                      ${item.price}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default ProfilePage;
