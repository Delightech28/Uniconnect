import emailjs from '@emailjs/browser';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_USER_TEMPLATE_ID = 'template_tk1p8gm'; // User notification template
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
  try {
    const verificationToken = generateVerificationToken();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create verification request in Firestore
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

    // Generate approval/rejection links
    const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
    const approveLink = `${baseUrl}/verify?token=${verificationToken}&action=approve&userId=${userId}`;
    const rejectLink = `${baseUrl}/verify?token=${verificationToken}&action=reject&userId=${userId}`;

    // Send verification email to admin
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        user_name: userData.displayName || 'Student',
        user_email: userData.email || '',
        username: userData.username || userData.email.split('@')[0],
        institution: userData.institution || 'Not specified',
        register_as: userData.registerAs || 'Student',
        created_at: createdAt.toLocaleDateString(),
        approve_link: approveLink,
        reject_link: rejectLink,
        year: new Date().getFullYear(),
      }
    );

    console.log('[verificationService] Verification request created and email sent to admin');
    return verificationToken;
  } catch (error) {
    console.error('[verificationService] Error creating verification request:', error);
    throw error;
  }
};

/**
 * Verify a user based on token and action
 */
export const verifyUserByToken = async (token, action, userId) => {
  try {
    // Get verification request
    const verificationDoc = await getDoc(doc(db, 'verificationRequests', userId));

    if (!verificationDoc.exists()) {
      throw new Error('Verification request not found');
    }

    const verData = verificationDoc.data();

    // Check if token matches
    if (verData.token !== token) {
      throw new Error('Invalid verification token');
    }

    // Check if not expired
    if (new Date() > new Date(verData.expiresAt)) {
      throw new Error('Verification link has expired');
    }

    // Check if already processed
    if (verData.status !== 'pending') {
      throw new Error(`Verification already ${verData.status}`);
    }

    // Update verification request status
    await updateDoc(doc(db, 'verificationRequests', userId), {
      status: action === 'approve' ? 'approved' : 'rejected',
      processedAt: new Date(),
    });

    // If approved, update user verified status
    if (action === 'approve') {
      await updateDoc(doc(db, 'users', userId), {
        verified: true,
        verifiedAt: new Date(),
      });
    }

    // Send confirmation email to user
    await sendUserNotificationEmail(
      verData.user_email,
      verData.user_name,
      action === 'approve'
    );

    return { success: true, action, message: `User verification ${action}ed successfully` };
  } catch (error) {
    console.error('[verificationService] Error verifying user:', error);
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

    // Send email to user
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_USER_TEMPLATE_ID,
      {
        to_email: userEmail,
        user_name: userName,
        subject,
        message,
        status: isApproved ? 'approved' : 'rejected',
        year: new Date().getFullYear(),
      }
    );

    console.log('[verificationService] User notification email sent to', userEmail);
  } catch (error) {
    console.warn('[verificationService] Error sending user notification email:', error);
    // Don't throw - verification was successful, just the notification failed
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
    console.error('[verificationService] Error checking user verification:', error);
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
      status: verDoc.data().status,
      createdAt: verDoc.data().createdAt,
      processedAt: verDoc.data().processedAt || null,
    };
  } catch (error) {
    console.error('[verificationService] Error getting verification status:', error);
    return { status: 'error' };
  }
};

/**
 * Get pending verification count (for admin dashboard if needed)
 */
export const getPendingVerificationCount = async () => {
  try {
    const q = query(collection(db, 'verificationRequests'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('[verificationService] Error getting pending count:', error);
    return 0;
  }
};
