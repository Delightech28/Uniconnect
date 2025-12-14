import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
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
import StudyHubPage from "./components/StudyHubPage";
import QuizPage from "./components/QuizPage";
import DocumentInfo from "./components/DocumentInfo";
import ChatInterface from "./components/ChatInterface";
import QuizResultsPage from "./components/QuizResultsPage";
import UniWalletPage from "./components/UniWalletPage";
import WalletPage from "./components/WalletPage";
import CreatePostPage from "./components/CreatePostPage";
import TransactionHistory from "./components/TransactionHistory";
import ProductDetailsPage from "./components/ProductDetailsPage";
import InboxPage from "./components/InboxPage";
import Header from "./components/Header";
import EditProfilePage from "./components/EditProfilePage";
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
import UniSpaceUpgrade from "./components/UniSpaceUpgrade";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestUpgrade from "./components/GuestUpgrade";
function App() {
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
        <Route path="/study-hub" element={<StudyHubPage />} />
        <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/document-info" element={<DocumentInfo />} />
        <Route path="/chat-interface" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
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
        <Route path="/unispace-upgrade" element={<ProtectedRoute><UniSpaceUpgrade /></ProtectedRoute>} />
        <Route path="/guest-upgrade" element={<ProtectedRoute><GuestUpgrade /></ProtectedRoute>} />
      </Routes>
      </Router>
    </>
  );
}

export default App;
