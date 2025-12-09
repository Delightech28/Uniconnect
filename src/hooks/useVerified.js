import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function useVerified() {
  const [isLoading, setIsLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState(null); // true | false | 'failed' | null

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setVerified(false);
        setStatus(null);
        setIsLoading(false);
        return;
      }

      const docRef = doc(db, 'users', user.uid);
      unsubSnapshot = onSnapshot(docRef, (snap) => {
        if (!snap.exists()) {
          setVerified(false);
          setStatus(null);
          setIsLoading(false);
          return;
        }
        const data = snap.data();
        const v = data.verified;
        // normalized status: true | false | 'failed'
        if (v === true) {
          setVerified(true);
          setStatus(true);
        } else if (v === 'failed' || data.verificationStatus === 'failed') {
          setVerified(false);
          setStatus('failed');
        } else {
          setVerified(false);
          setStatus(false);
        }
        setIsLoading(false);
      }, (err) => {
        console.error('useVerified snapshot error', err);
        setVerified(false);
        setStatus(null);
        setIsLoading(false);
      });
    });

    return () => {
      if (typeof unsubSnapshot === 'function') unsubSnapshot();
      if (typeof unsubAuth === 'function') unsubAuth();
    };
  }, []);

  return { isLoading, verified, status };
}
