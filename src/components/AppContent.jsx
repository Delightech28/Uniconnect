import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import useMaintenanceBypass from "../hooks/useMaintenanceBypass";
import MaintenancePage from "./MaintenancePage";
import UniConnectLandingPage from "./UniConnectLandingPage";
import UniConnectRegistration from "./UniConnectRegistration";
import StudentVerificationPage from "./StudentVerificationPage";
import VerificationPendingPage from "./VerificationPendingPage";
import VerificationCompletePage from "./VerificationCompletePage";
import VerificationFailedPage from "./VerificationFailedPage";
import HelpAndSupportPage from "./HelpAndSupportPage";
import ReuploadVerificationPage from "./ReuploadVerificationPage";
import UniConnectLogin from "./UniConnectLogin";
import ForgotPasswordPage from "./ForgotPasswordPage";
import GuestWelcomePage from "./GuestWelcomePage";
import UniConnectDashboard from "./UniConnectDashboard";
import GuestDashboard from "./GuestDashboard";
import NotificationsPage from "./NotificationsPage";
import UniMarketPage from "./UniMarketPage";
import SellItemPage from "./SellItemPage";
import MyListingsPage from "./MyListingPage";
import StudyHub from "./StudyHub";
import AIToolApp from "./Ai-tool/App";
import QuizPage from "./QuizPage";
import DocumentInfo from "./DocumentInfo";
import QuizResultsPage from "./QuizResultsPage";
import UniWalletPage from "./UniWalletPage";
import WalletPage from "./WalletPage";
import CreatePostPage from "./CreatePostPage";
import TransactionHistory from "./TransactionHistory";
import ProductDetailsPage from "./ProductDetailsPage";
import InboxPage from "./InboxPage";
import FundWalletPage from "./FundWalletPage";
import SendMoneyPage from "./SendMoneyPage";
import ReceiveMoneyPage from "./ReceiveMoneyPage";
import Header from "./Header";
import EditProfilePage from "./EditProfilePage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import ChangePasswordPage from "./ChangePasswordPage";
import ChangeEmailPage from "./ChangeEmailPage";
import StudentReferral from "./StudentReferral";
import ReferralReward from "./ReferralReward";
import UniConnectWelcome from "./UniConnectWelcome";
import FAQPage from "./FAQPage";
import ContactSupportPage from "./ContactSupportPage";
import TermsOfServicePage from "./TermsOfServicePage";
import CampusFeed from "./CampusFeed";
import AdminPanel from "./AdminPanel";
import ProtectedRoute from "./ProtectedRoute";
import GuestUpgrade from "./GuestUpgrade";
import PricingPage from "./PricingPage";
import GenderSelectionModal from "./GenderSelectionModal";
import GeneralChatPage from "./GeneralChatPage";

const AppContent = () => {
  // Hooks must be called at the top level before any returns
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Maintenance flag - set to false to disable maintenance mode
  const isUnderMaintenance = true;

  // Get bypass status
  const canBypass = useMaintenanceBypass();

  // Only run auth checks when NOT in maintenance mode
  useEffect(() => {
    if (isUnderMaintenance && !canBypass) {
      return; // Skip auth checks during maintenance
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUser(user);
            const userData = userDoc.data();
            if (!userData.gender) {
              setShowGenderModal(true);
            }
          }
        } catch (err) {
          console.error("Error checking gender requirement:", err);
        }
      } else {
        setCurrentUser(null);
        setShowGenderModal(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Show maintenance page if under maintenance and cannot bypass
  if (isUnderMaintenance && !canBypass) {
    return (
      <>
        <MaintenancePage />
      </>
    );
  }

  // Normal routing for bypassed users or when not under maintenance
  return (
    <>
      <Routes>
        <Route path="/" element={<UniConnectLandingPage />} />
        <Route path="/signup" element={<UniConnectRegistration />} />
        <Route path="/verify-student" element={<StudentVerificationPage />} />
        <Route
          path="/verification-pending"
          element={<VerificationPendingPage />}
        />
        <Route
          path="/verification-complete"
          element={<VerificationCompletePage />}
        />
        <Route
          path="/verification-failed"
          element={<VerificationFailedPage />}
        />
        <Route path="/help-support" element={<HelpAndSupportPage />} />
        <Route
          path="/reupload-verification"
          element={<ReuploadVerificationPage />}
        />
        <Route path="/login" element={<UniConnectLogin />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/guest-welcome" element={<GuestWelcomePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UniConnectDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/guest-dashboard" element={<GuestDashboard />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/unimarket" element={<UniMarketPage />} />
        <Route
          path="/sell-item"
          element={
            <ProtectedRoute>
              <SellItemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <MyListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-hub"
          element={
            <ProtectedRoute>
              <StudyHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/uni-doc"
          element={
            <ProtectedRoute>
              <AIToolApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route path="/document-info" element={<DocumentInfo />} />
        <Route
          path="/quiz-results"
          element={
            <ProtectedRoute>
              <QuizResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/uni-wallet"
          element={
            <ProtectedRoute>
              <UniWalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fund-wallet"
          element={
            <ProtectedRoute>
              <FundWalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/send-money"
          element={
            <ProtectedRoute>
              <SendMoneyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receive-money"
          element={
            <ProtectedRoute>
              <ReceiveMoneyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-post"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-post/:postId"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transaction-history"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />
        <Route path="/product-details" element={<ProductDetailsPage />} />
        <Route
          path="/product-details/:productId"
          element={<ProductDetailsPage />}
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route path="/header" element={<Header />} />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-email"
          element={
            <ProtectedRoute>
              <ChangeEmailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-referral"
          element={
            <ProtectedRoute>
              <StudentReferral />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referral-reward"
          element={
            <ProtectedRoute>
              <ReferralReward />
            </ProtectedRoute>
          }
        />
        <Route path="/welcome" element={<UniConnectWelcome />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact-support" element={<ContactSupportPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route
          path="/campusfeed"
          element={
            <ProtectedRoute>
              <CampusFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guest-upgrade"
          element={
            <ProtectedRoute>
              <GuestUpgrade />
            </ProtectedRoute>
          }
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <GeneralChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin-panel" element={<AdminPanel />} />
      </Routes>
      <GenderSelectionModal
        isOpen={showGenderModal}
        userId={currentUser?.uid}
        onClose={() => setShowGenderModal(false)}
        onComplete={() => setShowGenderModal(false)}
      />
    </>
  );
};

export default AppContent;
