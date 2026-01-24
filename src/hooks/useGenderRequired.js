import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to check if user needs to set gender
 * Returns true if user is logged in and has no gender set
 */
export const useGenderRequired = () => {
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Show modal if gender is not set
            if (!userData.gender) {
              setUser(currentUser);
              setShowGenderModal(true);
            }
          }
        } catch (err) {
          console.error('Error checking gender requirement:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { showGenderModal, setShowGenderModal, user, loading };
};
