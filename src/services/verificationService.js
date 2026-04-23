import emailjs from '@emailjs/browser';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { queueOperation, removeQueuedOperation, getQueueStatus } from './offlineQueueService';
import { createLogger } from '../utils/logger';

const log = createLogger('verificationService');

// Initialize EmailJS — key is read from env, never logged
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_USER_TEMPLATE_ID = 'template_tk1p8gm';
const ADMIN_EMAIL = 'unispaceinnovationhubltd@gmail.com';

/**
 * Generate a unique verification token
 */
const generateVerificationToken = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a verification request and send admin email
 */
export const createVerificationRequest = async (userId, userData) => {
  log.info('createVerificationRequest started', {
    role: userData.registerAs,
    emailConfigured: !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID),
  });

  try {
    const verificationToken = generateVerificationToken();
    // ✅ Never log the token itself
    log.info('Verification token generated');

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    log.info('Token expiry set', { expiresInDays: 7 });

    const verificationDoc = {
      userId,
      user_name: userData.displayName || 'Student',
      user_email: userData.email || '',
      username: userData.username || userData.email.split('@')[0],
      institution: userData.institution || 'Not specified',
      register_as: userData.registerAs || 'Student',
      created_at: createdAt.toLocaleDateString(),
      status: 'pending',
      token: verificationToken,
      expiresAt,
      createdAt,
    };

    await setDoc(doc(db, 'verificationRequests', userId), verificationDoc);
    log.info('Verification document saved to Firestore');

    const baseUrl = import.meta.env.VITE_APP_DOMAIN || 'http://localhost:5173';
    // ✅ Build links but never log them — they contain the token
    const approveLink = `${baseUrl}/verify?token=${verificationToken}&action=approve&userId=${userId}`;
    const rejectLink  = `${baseUrl}/verify?token=${verificationToken}&action=reject&userId=${userId}`;

    log.info('Sending verification email to admin');

    const emailPayload = {
      to_email:     ADMIN_EMAIL,
      user_name:    userData.displayName || 'Student',
      user_email:   userData.email || '',
      username:     userData.username || userData.email.split('@')[0],
      institution:  userData.institution || 'Not specified',
      register_as:  userData.registerAs || 'Student',
      created_at:   createdAt.toLocaleDateString(),
      approve_link: approveLink,
      reject_link:  rejectLink,
      year:         new Date().getFullYear(),
    };
    // ✅ Never log emailPayload — it contains email address + token links

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailPayload);
      log.info('Admin verification email sent');
      return { verificationToken, emailStatus: 'sent', queued: false };
    } catch (emailError) {
      const isNetworkError =
        emailError.message?.includes('offline') ||
        emailError.message?.includes('network') ||
        emailError.message?.includes('Failed') ||
        !navigator.onLine;

      if (isNetworkError) {
        log.warn('Network offline — queuing verification email');

        const queueId = queueOperation('send_verification_email', {
          userId,
          userData: { displayName: userData.displayName, registerAs: userData.registerAs }, // ✅ no email in queue log
          emailPayload,
          verificationDocData: verificationDoc,
          verificationToken,
        });

        toast.success('Registered successfully! Verification email will be sent when you go online.');
        log.info('Email queued for retry');

        return {
          verificationToken,
          emailStatus: 'queued',
          queued: true,
          queueId,
          message: "Verification email will be sent when you're back online",
        };
      } else {
        throw emailError;
      }
    }
  } catch (error) {
    // ✅ Log status + error code only — never log full error objects in prod
    log.error('createVerificationRequest failed', {
      code:    error.code    || 'UNKNOWN',
      message: error.message || 'Unknown error',
    });

    toast.error('Registration complete but verification email may not have been sent. Please contact support.');

    return {
      verificationToken: undefined,
      emailStatus: 'failed',
      queued: false,
      error: error.message,
    };
  }
};

/**
 * Retry sending a queued verification email (called by offlineQueueService)
 */
export const retryVerificationEmail = async (queuedOperation) => {
  log.info('Retrying queued verification email', { queueId: queuedOperation.id });

  try {
    const { emailPayload } = queuedOperation.data;
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailPayload);
    log.info('Retry email sent successfully');
    return { success: true };
  } catch (error) {
    log.error('Retry failed', { code: error.code, message: error.message });
    throw error;
  }
};

/**
 * Verify a user based on token and action
 */
export const verifyUserByToken = async (token, action, userId) => {
  try {
    const verificationDoc = await getDoc(doc(db, 'verificationRequests', userId));

    if (!verificationDoc.exists()) {
      throw new Error('Verification request not found');
    }

    const verData = verificationDoc.data();

    if (verData.token !== token) {
      throw new Error('Invalid verification token');
    }

    if (new Date() > new Date(verData.expiresAt)) {
      throw new Error('Verification link has expired');
    }

    if (verData.status !== 'pending') {
      throw new Error(`Verification already ${verData.status}`);
    }

    await updateDoc(doc(db, 'verificationRequests', userId), {
      status: action === 'approve' ? 'approved' : 'rejected',
      processedAt: new Date(),
    });

    if (action === 'approve') {
      await updateDoc(doc(db, 'users', userId), {
        verified: true,
        verifiedAt: new Date(),
      });
    }

    await sendUserNotificationEmail(verData.user_email, verData.user_name, action === 'approve');

    log.info('User verification processed', { action });
    return { success: true, action, message: `User verification ${action}ed successfully` };
  } catch (error) {
    log.error('verifyUserByToken failed', { message: error.message });
    throw error;
  }
};

/**
 * Send notification email to user about verification status
 */
export const sendUserNotificationEmail = async (userEmail, userName, isApproved) => {
  try {
    const subject = isApproved
      ? '🎉 Your UniConnect Account Has Been Verified!'
      : '📋 Your UniConnect Verification Request';

    const message = isApproved
      ? `Congratulations ${userName}! Your account has been verified. You now have full access to all features on UniConnect, including access to the marketplace, study resources, and community features.`
      : `Hi ${userName}! Thank you for your submission. Your verification request has been reviewed and unfortunately could not be approved at this time. If you believe this is an error, please contact our support team for assistance.`;

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_USER_TEMPLATE_ID,
      {
        to_email:  userEmail,
        user_name: userName,
        subject,
        message,
        status: isApproved ? 'approved' : 'rejected',
        year:   new Date().getFullYear(),
      }
    );

    // ✅ Status only — never log the userEmail itself
    log.info('User notification email sent');
  } catch (error) {
    log.warn('User notification email failed', { message: error.message });
    // Don't throw — verification was successful, notification is best-effort
  }
};

/**
 * Check if user is verified
 */
export const isUserVerified = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    return userDoc.data().verified === true;
  } catch (error) {
    log.error('isUserVerified check failed', { message: error.message });
    return false;
  }
};

/**
 * Get verification status for a user
 */
export const getVerificationStatus = async (userId) => {
  try {
    const verDoc = await getDoc(doc(db, 'verificationRequests', userId));
    if (!verDoc.exists()) return { status: 'none' };
    return {
      status:      verDoc.data().status,
      createdAt:   verDoc.data().createdAt,
      processedAt: verDoc.data().processedAt || null,
    };
  } catch (error) {
    log.error('getVerificationStatus failed', { message: error.message });
    return { status: 'error' };
  }
};

/**
 * Get pending verification count (for admin dashboard)
 */
export const getPendingVerificationCount = async () => {
  try {
    const q = query(collection(db, 'verificationRequests'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    log.error('getPendingVerificationCount failed', { message: error.message });
    return 0;
  }
};
