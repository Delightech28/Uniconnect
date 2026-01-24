import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import UniConnectLandingPage from "./components/UniConnectLandingPage";
import UniConnectRegistration from "./components/UniConnectRegistration";
import StudentVerificationPage from "./components/StudentVerificationPage";
import VerificationPendingPage from "./components/VerificationPendingPage";
import VerificationCompletePage from "./components/VerificationCompletePage";
import VerificationFailedPage from "./components/VerificationFailedPage";
import HelpAndSupportPage from "./components/HelpAndSupportPage";
import ReuploadVerificationPage from "./components/ReuploadVerificationPage";
import UniConnectLogin from "./components/UniConnectLogin";
import GuestWelcomePage from "./components/GuestWelcomePage";
import UniConnectDashboard from "./components/UniConnectDashboard";
import GuestDashboard from "./components/GuestDashboard";
import NotificationsPage from "./components/NotificationsPage";
import UniMarketPage from "./components/UniMarketPage";
import SellItemPage from "./components/SellItemPage";
import MyListingsPage from "./components/MyListingPage";
import StudyHubApp from "./components/StudyHub/App";
import AIToolApp from "./components/Ai-tool/App";
import QuizPage from "./components/QuizPage";
import DocumentInfo from "./components/DocumentInfo";
import QuizResultsPage from "./components/QuizResultsPage";
import UniWalletPage from "./components/UniWalletPage";
import WalletPage from "./components/WalletPage";
import CreatePostPage from "./components/CreatePostPage";
import TransactionHistory from "./components/TransactionHistory";
import ProductDetailsPage from "./components/ProductDetailsPage";
import InboxPage from "./components/InboxPage";
import Header from "./components/Header";
import EditProfilePage from "./components/EditProfilePage";
import ProfilePage from "./components/ProfilePage";
import SettingsPage from "./components/SettingsPage";
import ChangePasswordPage from "./components/ChangePasswordPage";
import ChangeEmailPage from "./components/ChangeEmailPage";
import StudentReferral from "./components/StudentReferral";
import ReferralReward from "./components/ReferralReward";
import UniConnectWelcome from "./components/UniConnectWelcome";
import FAQPage from "./components/FAQPage";
import ContactSupportPage from "./components/ContactSupportPage";
import TermsOfServicePage from "./components/TermsOfServicePage";
import CampusFeed from "./components/CampusFeed";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestUpgrade from "./components/GuestUpgrade";
import PricingPage from "./components/PricingPage";
import GenderSelectionModal from "./components/GenderSelectionModal";
function App() {
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user needs to set gender on app load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser(user);
            const userData = userDoc.data();
            // Show modal if gender is not set
            if (!userData.gender) {
              setShowGenderModal(true);
            }
          }
        } catch (err) {
          console.error('Error checking gender requirement:', err);
        }
      } else {
        setCurrentUser(null);
        setShowGenderModal(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Analytics />
      <Router>
      <Routes>
        <Route path="/" element={<UniConnectLandingPage />} />
        <Route path="/signup" element={<UniConnectRegistration />} />
        <Route path="/verify-student" element={<StudentVerificationPage />} />
        <Route path="/verification-pending" element={<VerificationPendingPage />} />
        <Route path="/verification-complete" element={<VerificationCompletePage />} />
        <Route path="/verification-failed" element={<VerificationFailedPage />} />
        <Route path="/help-support" element={<HelpAndSupportPage />} />
        <Route path="/reupload-verification" element={<ReuploadVerificationPage />} />
        <Route path="/login" element={<UniConnectLogin />} />
        <Route path="/guest-welcome" element={<GuestWelcomePage />} />
        <Route path="/dashboard" element={<ProtectedRoute><UniConnectDashboard /></ProtectedRoute>} />
        <Route path="/guest-dashboard" element={<GuestDashboard />} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/unimarket" element={<UniMarketPage />} />
        <Route path="/sell-item" element={<ProtectedRoute><SellItemPage /></ProtectedRoute>} />
        <Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
        <Route path="/study-hub" element={<ProtectedRoute><StudyHubApp /></ProtectedRoute>} />
        <Route path="/uni-doc" element={<ProtectedRoute><AIToolApp /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/document-info" element={<DocumentInfo />} />
        <Route path="/quiz-results" element={<ProtectedRoute><QuizResultsPage /></ProtectedRoute>} />
        <Route path="/uni-wallet" element={<ProtectedRoute><UniWalletPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
        <Route path="/transaction-history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
        <Route path="/product-details" element={<ProductDetailsPage />} />
        <Route path="/product-details/:productId" element={<ProductDetailsPage />} /> 
        <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
        <Route path="/header" element={<Header />} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} /> 
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/change-email" element={<ProtectedRoute><ChangeEmailPage /></ProtectedRoute>} />
        <Route path="/student-referral" element={<ProtectedRoute><StudentReferral /></ProtectedRoute>} />
        <Route path="/referral-reward" element={<ProtectedRoute><ReferralReward /></ProtectedRoute>} />
        <Route path="/welcome" element={<UniConnectWelcome />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact-support" element={<ContactSupportPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/campusfeed" element={<ProtectedRoute><CampusFeed /></ProtectedRoute>} />
        <Route path="/guest-upgrade" element={<ProtectedRoute><GuestUpgrade /></ProtectedRoute>} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
      </Router>
      <GenderSelectionModal
        isOpen={showGenderModal}
        userId={currentUser?.uid}
        onClose={() => setShowGenderModal(false)}
        onComplete={() => setShowGenderModal(false)}
      />
    </>
  );
}

export default App;
